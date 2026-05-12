/**
 * UserManagement — V2
 * BUILD: 2026-05-12-V2-USERMGMT
 *
 * Features:
 *   - 3 tabs: pending / active / disabled
 *   - Full-width search (no department filter — removed in V2)
 *   - Bulk select + bulk actions
 *   - Per-user: approve, disable/enable, toggle admin, reset PIN
 */
import { useEffect, useState, useMemo } from 'react';
import {
  Button, List, Avatar, Tag, Tabs, Modal, message, Space,
  Typography, Dropdown, Spin, Checkbox, Input,
} from 'antd';
import {
  UserOutlined, CheckOutlined, StopOutlined, ReloadOutlined,
  MoreOutlined, KeyOutlined, CrownOutlined, PlayCircleOutlined,
  SearchOutlined, UsergroupAddOutlined,
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigation } from '../hooks/useNavigation.jsx';
import { getIdToken } from '../api/liff.js';
import {
  listUsers, approveUser, disableUser, enableUser,
  toggleAdmin, resetUserPin,
  bulkApproveUsers, bulkDisableUsers, bulkEnableUsers,
} from '../api/admin.js';
import { COLORS, SHADOWS, RADIUS } from '../brand.js';
import PageHeader from '../components/PageHeader.jsx';
import BulkActionBar from '../components/BulkActionBar.jsx';
import EmptyState from '../components/EmptyState.jsx';

const { Text } = Typography;

export default function UserManagement() {
  if (typeof window !== 'undefined' && !window.__usermgmt_v2_loaded) {
    console.log('%c[UserManagement V2 LOADED]', 'background:#1F4D3F;color:#A4DFCB;padding:4px 8px;border-radius:4px');
    window.__usermgmt_v2_loaded = true;
  }

  const auth = useAuth();
  const nav = useNavigation();
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selected, setSelected] = useState(new Map());

  async function load() {
    setLoading(true);
    setSelected(new Map());
    try {
      const token = await getIdToken();
      const data = await listUsers(token, { status: tab });
      setUsers(data?.users || []);
    } catch (e) {
      message.error('โหลดข้อมูลผู้ใช้ไม่สำเร็จ');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [tab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.dept || '').toLowerCase().includes(q) ||
      (u.line_user_id || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  const allSelected = filtered.length > 0 && filtered.every(u => selected.has(u.line_user_id));
  const someSelected = selected.size > 0 && !allSelected;

  function toggleSelect(uid, u) {
    const next = new Map(selected);
    if (next.has(uid)) next.delete(uid); else next.set(uid, u);
    setSelected(next);
  }
  function toggleSelectAll() {
    if (allSelected) setSelected(new Map());
    else setSelected(new Map(filtered.map(u => [u.line_user_id, u])));
  }

  // --- Per-user actions ---
  async function doApprove(u) {
    try {
      const token = await getIdToken();
      await approveUser(token, u.line_user_id);
      message.success(`อนุมัติ ${u.name} แล้ว`);
      load();
    } catch (e) { message.error('ทำรายการไม่สำเร็จ'); }
  }
  async function doDisable(u) {
    Modal.confirm({
      title: `ระงับผู้ใช้ ${u.name}?`,
      okText: 'ระงับ', okButtonProps: { danger: true },
      onOk: async () => {
        const token = await getIdToken();
        await disableUser(token, u.line_user_id);
        message.success('ระงับแล้ว'); load();
      },
    });
  }
  async function doEnable(u) {
    const token = await getIdToken();
    await enableUser(token, u.line_user_id);
    message.success('เปิดใช้งานแล้ว'); load();
  }
  async function doToggleAdmin(u) {
    Modal.confirm({
      title: u.is_admin ? `ถอด admin จาก ${u.name}?` : `ตั้ง ${u.name} เป็น admin?`,
      onOk: async () => {
        const token = await getIdToken();
        await toggleAdmin(token, u.line_user_id);
        message.success('เปลี่ยนสิทธิ์แล้ว'); load();
      },
    });
  }
  async function doResetPin(u) {
    Modal.confirm({
      title: `รีเซ็ต PIN ของ ${u.name}?`,
      content: 'ผู้ใช้จะต้องตั้ง PIN ใหม่ในครั้งถัดไป',
      onOk: async () => {
        const token = await getIdToken();
        await resetUserPin(token, u.line_user_id);
        message.success('รีเซ็ต PIN แล้ว');
      },
    });
  }

  // --- Bulk actions ---
  async function bulkRun(action, fn, confirmText) {
    const ids = Array.from(selected.keys());
    if (ids.length === 0) return;
    Modal.confirm({
      title: confirmText.replace('{n}', ids.length),
      onOk: async () => {
        setBulkLoading(true);
        try {
          const token = await getIdToken();
          await fn(token, ids);
          message.success(`${action} ${ids.length} รายการแล้ว`);
          load();
        } catch (e) { message.error('ทำรายการไม่สำเร็จ'); }
        finally { setBulkLoading(false); }
      },
    });
  }

  const bulkActions = useMemo(() => {
    if (tab === 'pending') return [{
      label: 'อนุมัติทั้งหมด', type: 'primary', icon: <CheckOutlined />,
      loading: bulkLoading,
      onClick: () => bulkRun('อนุมัติ', bulkApproveUsers, 'อนุมัติ {n} รายการ?'),
    }];
    if (tab === 'active') return [{
      label: 'ระงับทั้งหมด', danger: true, icon: <StopOutlined />,
      loading: bulkLoading,
      onClick: () => bulkRun('ระงับ', bulkDisableUsers, 'ระงับ {n} รายการ?'),
    }];
    if (tab === 'disabled') return [{
      label: 'เปิดใช้งานทั้งหมด', type: 'primary', icon: <PlayCircleOutlined />,
      loading: bulkLoading,
      onClick: () => bulkRun('เปิดใช้งาน', bulkEnableUsers, 'เปิดใช้งาน {n} รายการ?'),
    }];
    return [];
  }, [tab, bulkLoading]);

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bgMain, paddingBottom: selected.size > 0 ? 80 : 24 }}>
      <PageHeader
        title="User Management"
        icon={<UsergroupAddOutlined />}
        onBack={() => nav.goTo('admin')}
        rightAction={
          <button
            onClick={load}
            style={{
              background: 'rgba(255,255,255,0.25)', border: 'none',
              borderRadius: 10, width: 38, height: 38, color: '#fff', cursor: 'pointer',
            }}
          ><ReloadOutlined spin={loading} /></button>
        }
      />

      <div style={{ padding: 14 }}>
        {/* Search full-width */}
        <Input
          size="large"
          allowClear
          prefix={<SearchOutlined style={{ color: COLORS.textMuted }} />}
          placeholder="ค้นหา ชื่อ / แผนก / LINE ID"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 12, borderRadius: RADIUS.md }}
        />

        {/* Tabs */}
        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={[
            { key: 'pending', label: '⏳ รออนุมัติ' },
            { key: 'active', label: '✓ ใช้งาน' },
            { key: 'disabled', label: '🚫 ระงับ' },
          ]}
        />

        {/* Select-all */}
        {filtered.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', background: COLORS.cardBg,
            borderRadius: RADIUS.md, marginBottom: 10,
            boxShadow: SHADOWS.card,
          }}>
            <Checkbox
              indeterminate={someSelected}
              checked={allSelected}
              onChange={toggleSelectAll}
            />
            <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>
              เลือกทั้งหมด ({filtered.length})
            </Text>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={tab === 'pending' ? '✨' : '👥'}
            title="ไม่พบผู้ใช้"
            subtitle={search ? 'ลองเปลี่ยนคำค้นหา' : 'ยังไม่มีรายการในสถานะนี้'}
          />
        ) : (
          <List
            dataSource={filtered}
            renderItem={u => (
              <div
                style={{
                  background: COLORS.cardBg, borderRadius: RADIUS.md,
                  padding: 12, marginBottom: 8, boxShadow: SHADOWS.card,
                  display: 'flex', alignItems: 'center', gap: 12,
                  border: selected.has(u.line_user_id) ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.borderLight}`,
                }}
              >
                <Checkbox
                  checked={selected.has(u.line_user_id)}
                  onChange={() => toggleSelect(u.line_user_id, u)}
                />
                <Avatar src={u.picture_url} icon={<UserOutlined />} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap',
                  }}>
                    <Text strong style={{ color: COLORS.primaryDark }}>{u.name}</Text>
                    {u.is_admin && (
                      <Tag color="gold" icon={<CrownOutlined />} style={{ margin: 0 }}>Admin</Tag>
                    )}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {u.dept || 'ไม่ระบุแผนก'}
                  </Text>
                  {u.last_login_at && (
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                      Last login: {new Date(u.last_login_at).toLocaleString('th-TH')}
                    </div>
                  )}
                </div>
                <Space>
                  {tab === 'pending' && (
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      size="small"
                      style={{ background: COLORS.primaryDark }}
                      onClick={() => doApprove(u)}
                    >อนุมัติ</Button>
                  )}
                  <Dropdown
                    menu={{
                      items: [
                        tab === 'active' && { key: 'admin', icon: <CrownOutlined />,
                          label: u.is_admin ? 'ถอด Admin' : 'ตั้งเป็น Admin',
                          onClick: () => doToggleAdmin(u) },
                        tab === 'active' && { key: 'pin', icon: <KeyOutlined />,
                          label: 'รีเซ็ต PIN', onClick: () => doResetPin(u) },
                        tab === 'active' && { type: 'divider' },
                        tab === 'active' && { key: 'disable', icon: <StopOutlined />,
                          label: 'ระงับ', danger: true, onClick: () => doDisable(u) },
                        tab === 'disabled' && { key: 'enable', icon: <PlayCircleOutlined />,
                          label: 'เปิดใช้งาน', onClick: () => doEnable(u) },
                      ].filter(Boolean),
                    }}
                  >
                    <Button icon={<MoreOutlined />} size="small" />
                  </Dropdown>
                </Space>
              </div>
            )}
          />
        )}
      </div>

      <BulkActionBar
        count={selected.size}
        onClear={() => setSelected(new Map())}
        actions={bulkActions}
      />
    </div>
  );
}
