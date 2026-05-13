/**
 * UserManagement — VERSION 2 REDESIGN (Lean Buddy mint sage)
 * BUILD: 2026-05-07-V2-USERMGMT
 *
 * Changes from V1:
 *   - Mint gradient header
 *   - REMOVED department filter (no longer used)
 *   - Search bar: full width
 *   - Cleaner cards
 */

import { useEffect, useState, useMemo } from 'react';
import {
  Card, Button, List, Avatar, Tag, Tabs, Modal, message, Space,
  Typography, Dropdown, Empty, Spin, Checkbox, Input, Select
} from 'antd';
import {
  ArrowLeftOutlined, UserOutlined, CheckOutlined, StopOutlined,
  ReloadOutlined, MoreOutlined, KeyOutlined, CrownOutlined, PlayCircleOutlined,
  SearchOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigation } from '../../hooks/useNavigation.jsx';
import { getIdToken } from '../../api/liff.js';
import {
  listUsers, approveUser, disableUser, enableUser,
  toggleAdmin, resetUserPin, deleteUser,
  bulkApproveUsers, bulkDisableUsers, bulkEnableUsers, bulkDeleteUsers
} from '../../api/admin.js';
import BulkActionBar from '../../components/BulkActionBar.jsx';
import { COLORS } from '../../brand.js';

const { Text } = Typography;

function loginGroup(loginCode) {
  if (!loginCode) return '?';
  const c = String(loginCode).trim()[0]?.toUpperCase();
  if (!c) return '?';
  if (/[A-Z]/.test(c)) return c;
  if (/[0-9]/.test(c)) return '#';
  return '?';
}

function groupLabel(g) {
  if (g === '#') return 'ตัวเลข';
  if (g === '?') return 'ไม่มีรหัส';
  return `กลุ่ม ${g}`;
}

export default function UserManagement() {
  // V2 marker
  if (typeof window !== 'undefined' && !window.__usermgmt_v2_loaded) {
    console.log('%c[UserManagement V2 LOADED]', 'background:#1F4D3F;color:#A4DFCB;padding:4px 8px;border-radius:4px');
    window.__usermgmt_v2_loaded = true;
  }

  const auth = useAuth();
  const nav = useNavigation();
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [selected, setSelected] = useState(new Map());
  const selectedCount = selected.size;

  const selfId = auth.session?.user?.lineUserId || auth.session?.lineUserId;

  const groupOptions = useMemo(() => {
    const counts = new Map();
    users.forEach(u => {
      const g = loginGroup(u.login_code);
      counts.set(g, (counts.get(g) || 0) + 1);
    });
    const letters = [...counts.keys()].filter(k => /^[A-Z]$/.test(k)).sort();
    const rest = ['#', '?'].filter(k => counts.has(k));
    return [...letters, ...rest].map(g => ({ value: g, label: `${groupLabel(g)} (${counts.get(g)})` }));
  }, [users]);

  const visibleUsers = useMemo(() => {
    if (groupFilter === 'ALL') return users;
    return users.filter(u => loginGroup(u.login_code) === groupFilter);
  }, [users, groupFilter]);

  const grouped = useMemo(() => {
    const buckets = new Map();
    for (const u of visibleUsers) {
      const g = loginGroup(u.login_code);
      if (!buckets.has(g)) buckets.set(g, []);
      buckets.get(g).push(u);
    }
    const letters = [...buckets.keys()].filter(k => /^[A-Z]$/.test(k)).sort();
    const rest = ['#', '?'].filter(k => buckets.has(k));
    return [...letters, ...rest].map(g => [g, buckets.get(g)]);
  }, [visibleUsers]);

  const allSelected = visibleUsers.length > 0 && visibleUsers.every(u => u.line_user_id === selfId || selected.has(u.line_user_id));
  const someSelected = visibleUsers.some(u => selected.has(u.line_user_id));

  async function load() {
    if (!auth.session) return;
    setLoading(true);
    try {
      // department parameter removed
      const r = await listUsers(getIdToken(), auth.session.token, { status: tab, search });
      if (r.ok) setUsers(r.users);
      else if (r.needsLogin) auth.logout();
      else message.error(r.error || 'โหลดข้อมูลไม่สำเร็จ');
    } catch (err) {
      message.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [tab, search]);
  useEffect(() => { setSelected(new Map()); }, [tab, search, groupFilter]);

  function toggleSelect(user) {
    const m = new Map(selected);
    if (m.has(user.line_user_id)) m.delete(user.line_user_id);
    else m.set(user.line_user_id, user);
    setSelected(m);
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Map());
    } else {
      const m = new Map();
      visibleUsers.forEach(u => {
        if (u.line_user_id !== selfId) m.set(u.line_user_id, u);
      });
      setSelected(m);
    }
  }

  // ============ INDIVIDUAL ACTIONS ============

  async function handleApprove(user) {
    Modal.confirm({
      title: 'อนุมัติผู้ใช้',
      content: `อนุมัติให้ ${user.display_name} (${user.department}) เข้าใช้งานระบบ?`,
      okText: 'อนุมัติ', cancelText: 'ยกเลิก',
      okButtonProps: { style: { background: COLORS.primary, borderColor: COLORS.primary } },
      async onOk() {
        const r = await approveUser(getIdToken(), auth.session.token, user.line_user_id);
        if (r.ok) { message.success('อนุมัติสำเร็จ'); load(); }
        else message.error(r.error || 'ไม่สำเร็จ');
      }
    });
  }

  async function handleDisable(user) {
    Modal.confirm({
      title: 'ระงับการใช้งาน',
      content: `ระงับ ${user.display_name}? ผู้ใช้จะเข้าระบบไม่ได้จนกว่าจะถูก enable ใหม่`,
      okText: 'ระงับ', okButtonProps: { danger: true }, cancelText: 'ยกเลิก',
      async onOk() {
        const r = await disableUser(getIdToken(), auth.session.token, user.line_user_id);
        if (r.ok) { message.success('ระงับสำเร็จ'); load(); }
        else message.error(r.error || 'ไม่สำเร็จ');
      }
    });
  }

  async function handleEnable(user) {
    const r = await enableUser(getIdToken(), auth.session.token, user.line_user_id);
    if (r.ok) { message.success('เปิดใช้งานสำเร็จ'); load(); }
    else message.error(r.error || 'ไม่สำเร็จ');
  }

  async function handleToggleAdmin(user) {
    const action = user.is_admin ? 'ถอดสิทธิ์ admin' : 'มอบสิทธิ์ admin';
    Modal.confirm({
      title: action, content: `${action} จาก ${user.display_name}?`,
      okText: 'ยืนยัน', cancelText: 'ยกเลิก',
      okButtonProps: { style: { background: COLORS.primary, borderColor: COLORS.primary } },
      async onOk() {
        const r = await toggleAdmin(getIdToken(), auth.session.token, user.line_user_id);
        if (r.ok) { message.success(`${action}สำเร็จ`); load(); }
        else message.error(r.error || 'ไม่สำเร็จ');
      }
    });
  }

  async function handleResetPin(user) {
    Modal.confirm({
      title: 'Reset PIN',
      content: `Reset PIN ของ ${user.display_name}? ผู้ใช้ต้องตั้ง PIN ใหม่เมื่อ login ครั้งหน้า`,
      okText: 'Reset', okButtonProps: { danger: true }, cancelText: 'ยกเลิก',
      async onOk() {
        const r = await resetUserPin(getIdToken(), auth.session.token, user.line_user_id);
        if (r.ok) { message.success('Reset PIN สำเร็จ'); load(); }
        else message.error(r.error || 'ไม่สำเร็จ');
      }
    });
  }

  async function handleDelete(user) {
    Modal.confirm({
      title: 'ลบผู้ใช้ถาวร',
      content: (
        <div>
          <div>ลบ <b>{user.display_name}</b>{user.nickname ? ` (${user.nickname})` : ''} ถาวร?</div>
          <div style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>
            การกระทำนี้ไม่สามารถย้อนกลับได้ — user คนนี้ต้องลงทะเบียนใหม่หากกลับมาใช้งาน
          </div>
        </div>
      ),
      okText: 'ลบถาวร', okButtonProps: { danger: true }, cancelText: 'ยกเลิก',
      async onOk() {
        const r = await deleteUser(getIdToken(), auth.session.token, user.line_user_id);
        if (r.ok) { message.success('ลบสำเร็จ'); load(); }
        else message.error(r.error || 'ไม่สำเร็จ');
      }
    });
  }

  // ============ BULK ACTIONS ============

  async function runBulk(action, label, danger = false) {
    const ids = Array.from(selected.keys());
    if (ids.length === 0) return;

    Modal.confirm({
      title: `${label} (${ids.length} รายการ)`,
      content: `ยืนยัน ${label} ผู้ใช้ ${ids.length} คน?`,
      okText: 'ยืนยัน', okButtonProps: { danger }, cancelText: 'ยกเลิก',
      async onOk() {
        setBulkLoading(true);
        try {
          const r = await action(getIdToken(), auth.session.token, ids);
          if (r.ok) {
            const msg = `✅ สำเร็จ ${r.succeeded} รายการ` +
              (r.failed_count > 0 ? ` · ⚠️ ผิดพลาด ${r.failed_count}` : '');
            message.success(msg, 4);
            setSelected(new Map());
            load();
          } else {
            message.error(r.error || `${label}ไม่สำเร็จ`);
          }
        } catch (err) {
          message.error(err.message || 'เกิดข้อผิดพลาด');
        } finally {
          setBulkLoading(false);
        }
      }
    });
  }

  const bulkActions = useMemo(() => {
    const deleteAction = {
      key: 'bulkDelete',
      icon: <DeleteOutlined />,
      label: 'ลบถาวรทั้งหมด',
      danger: true,
      onClick: () => runBulk(bulkDeleteUsers, 'ลบถาวร', true),
      loading: bulkLoading
    };
    if (tab === 'pending') {
      return [{
        key: 'bulkApprove',
        icon: <CheckOutlined />,
        label: 'อนุมัติทั้งหมด',
        onClick: () => runBulk(bulkApproveUsers, 'อนุมัติ'),
        loading: bulkLoading
      }, deleteAction];
    }
    if (tab === 'active') {
      return [{
        key: 'bulkDisable',
        icon: <StopOutlined />,
        label: 'ระงับทั้งหมด',
        danger: true,
        onClick: () => runBulk(bulkDisableUsers, 'ระงับ', true),
        loading: bulkLoading
      }, deleteAction];
    }
    if (tab === 'disabled') {
      return [{
        key: 'bulkEnable',
        icon: <PlayCircleOutlined />,
        label: 'เปิดใช้งานทั้งหมด',
        onClick: () => runBulk(bulkEnableUsers, 'เปิดใช้งาน'),
        loading: bulkLoading
      }, deleteAction];
    }
    return [];
  }, [tab, bulkLoading]);

  function buildActionMenu(user) {
    const items = [];
    if (user.status === 'pending') {
      items.push({ key: 'approve', icon: <CheckOutlined style={{ color: '#5DBFA0' }} />, label: 'อนุมัติ', onClick: () => handleApprove(user) });
    }
    if (user.status === 'active') {
      items.push({ key: 'toggleAdmin', icon: <CrownOutlined style={{ color: '#F59E0B' }} />, label: user.is_admin ? 'ถอด admin' : 'ตั้งเป็น admin', onClick: () => handleToggleAdmin(user) });
      items.push({ key: 'resetPin', icon: <KeyOutlined />, label: 'Reset PIN', onClick: () => handleResetPin(user) });
      items.push({ type: 'divider' });
      items.push({ key: 'disable', icon: <StopOutlined />, label: 'ระงับการใช้งาน', danger: true, onClick: () => handleDisable(user) });
    }
    if (user.status === 'disabled') {
      items.push({ key: 'enable', icon: <PlayCircleOutlined style={{ color: '#5DBFA0' }} />, label: 'เปิดใช้งานอีกครั้ง', onClick: () => handleEnable(user) });
    }
    items.push({ type: 'divider' });
    items.push({ key: 'delete', icon: <DeleteOutlined />, label: 'ลบผู้ใช้ถาวร', danger: true, onClick: () => handleDelete(user) });
    return items;
  }

  function renderUserCard(user) {
    const isSelf = user.line_user_id === selfId;
    const isChecked = selected.has(user.line_user_id);
    return (
      <Card
        key={user.line_user_id}
        size="small"
        style={{
          marginBottom: 8,
          borderColor: isChecked ? COLORS.primary : 'rgba(31,77,63,0.08)',
          background: isChecked ? COLORS.bgSoft : '#fff',
          borderRadius: 12,
          borderWidth: '0.5px'
        }}
        styles={{ body: { padding: 12 } }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Checkbox
            checked={isChecked}
            disabled={isSelf}
            onChange={() => toggleSelect(user)}
          />
          {user.picture_url
            ? <Avatar src={user.picture_url} size={40} />
            : <Avatar icon={<UserOutlined />} size={40} />
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text strong style={{ fontSize: 14 }}>{user.display_name}</Text>
              {user.is_admin && <Tag color="gold" style={{ marginInlineEnd: 0 }}>Admin</Tag>}
              {isSelf && <Tag color="blue" style={{ marginInlineEnd: 0 }}>คุณ</Tag>}
            </div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              {user.nickname || user.full_name || user.department}
              {user.employee_code && ` · ${user.employee_code}`}
              {user.login_code && ` · 🔑 ${user.login_code}`}
            </Text>
            {user.last_login_at && tab === 'active' && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                last login: {new Date(user.last_login_at).toLocaleString('th-TH')}
              </Text>
            )}
            {user.created_at && tab === 'pending' && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                ลงทะเบียน: {new Date(user.created_at).toLocaleString('th-TH')}
              </Text>
            )}
          </div>
          <Space>
            {user.status === 'pending' && (
              <Button type="primary" size="small" icon={<CheckOutlined />}
                onClick={() => handleApprove(user)}
                style={{ background: COLORS.primary, borderColor: COLORS.primary }}>
                อนุมัติ
              </Button>
            )}
            <Dropdown menu={{ items: buildActionMenu(user) }} placement="bottomRight" trigger={['click']}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        </div>
      </Card>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Mint gradient header */}
      <div style={topBarStyle}>
        <div style={iconBtnStyle} onClick={() => nav.goAdminPage('dashboard')} role="button">
          <ArrowLeftOutlined style={{ fontSize: 18 }} />
        </div>
        <div style={titleStyle}>จัดการผู้ใช้</div>
        <div style={iconBtnStyle} onClick={load} role="button">
          <ReloadOutlined spin={loading} style={{ fontSize: 18 }} />
        </div>
      </div>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        centered
        style={{ background: '#fff' }}
        items={[
          { key: 'pending', label: 'รออนุมัติ' },
          { key: 'active', label: 'ใช้งาน' },
          { key: 'disabled', label: 'ระงับ' }
        ]}
      />

      <div style={{ ...contentStyle, paddingBottom: selectedCount > 0 ? 80 : 12 }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <Input
            placeholder="ค้นหาชื่อ / รหัสพนักงาน..."
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={searchInputStyle}
          />
          <Select
            value={groupFilter}
            onChange={setGroupFilter}
            style={{ width: '100%', marginBottom: 10 }}
            options={[
              { value: 'ALL', label: `กลุ่ม: ทั้งหมด (${users.length})` },
              ...groupOptions,
            ]}
          />

          {loading && users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
          ) : visibleUsers.length === 0 ? (
            <Empty
              description={
                search ? 'ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข' :
                groupFilter !== 'ALL' ? `ไม่มีผู้ใช้ใน${groupLabel(groupFilter)}` :
                tab === 'pending' ? 'ไม่มีผู้ใช้รออนุมัติ' :
                tab === 'active' ? 'ไม่มีผู้ใช้ที่ active' :
                'ไม่มีผู้ใช้ที่ถูกระงับ'
              }
              style={{ marginTop: 40 }}
            />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', marginBottom: 6 }}>
                <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleSelectAll}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    เลือกทั้งหมด ({visibleUsers.length}{groupFilter !== 'ALL' ? ` ใน${groupLabel(groupFilter)}` : ''})
                  </Text>
                </Checkbox>
              </div>

              {groupFilter === 'ALL'
                ? grouped.map(([g, list]) => (
                    <div key={g} style={{ marginBottom: 12 }}>
                      <div style={sectionHeaderStyle}>
                        {groupLabel(g)} <span style={sectionCountStyle}>({list.length})</span>
                      </div>
                      {list.map(renderUserCard)}
                    </div>
                  ))
                : visibleUsers.map(renderUserCard)
              }
            </>
          )}
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedCount}
        onClear={() => setSelected(new Map())}
        actions={bulkActions}
      />
    </div>
  );
}

const pageStyle = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  background: COLORS.bgSoft,
  zIndex: 100
};

const topBarStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 14px',
  background: `linear-gradient(135deg, #5DBFA0 0%, ${COLORS.primary} 100%)`,
  height: 56,
  flexShrink: 0,
  boxShadow: '0 2px 8px rgba(31,77,63,0.12)'
};

const iconBtnStyle = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: 'rgba(255,255,255,0.18)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0
};

const titleStyle = {
  color: 'white',
  fontWeight: 600,
  fontSize: 16,
  flex: 1,
  textAlign: 'center'
};

const contentStyle = {
  padding: 12,
  flex: 1,
  overflowY: 'auto'
};

const searchInputStyle = {
  borderRadius: 12,
  marginBottom: 10,
  height: 40,
  border: '0.5px solid rgba(31,77,63,0.12)'
};

const sectionHeaderStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.primary,
  background: COLORS.bgSoft,
  padding: '6px 12px',
  borderRadius: 8,
  marginBottom: 8,
  display: 'inline-block',
};

const sectionCountStyle = {
  color: '#6B8278',
  fontWeight: 500,
  marginLeft: 4,
};
