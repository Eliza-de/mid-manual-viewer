/**
 * UserManagement — Admin console
 *
 * 3 tabs: pending / active / disabled
 * Full-width search, bulk select + bulk actions
 * Per-user: approve, disable/enable, toggle admin, reset PIN
 */
import { useEffect, useState, useMemo } from 'react';
import {
  Card, Button, List, Avatar, Tag, Tabs, Modal, message, Space,
  Typography, Dropdown, Empty, Spin, Checkbox, Input,
} from 'antd';
import {
  UserOutlined, CheckOutlined, StopOutlined, ReloadOutlined,
  MoreOutlined, KeyOutlined, CrownOutlined, PlayCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  listUsers, approveUser, disableUser, enableUser,
  toggleAdmin, resetUserPin,
  bulkApproveUsers, bulkDisableUsers, bulkEnableUsers,
} from '../api/admin';

const { Text } = Typography;

const MINT_DARK = '#1F4D3F';
const MINT_MID = '#5DBFA0';
const MINT_SOFT = '#DCEEE3';
const MINT_MUTED = '#6B8278';

export default function UserManagement({ user: currentUser }) {
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [selected, setSelected] = useState(new Map());
  const selectedCount = selected.size;

  const allSelected = users.length > 0 && users.every(u => selected.has(u.line_user_id));
  const someSelected = users.some(u => selected.has(u.line_user_id));

  const selfId = currentUser?.lineUserId || currentUser?.line_user_id;

  async function load() {
    setLoading(true);
    try {
      const r = await listUsers({ status: tab, search });
      setUsers(r.users || []);
    } catch (err) {
      message.error(err.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [tab, search]);
  useEffect(() => { setSelected(new Map()); }, [tab, search]);

  function toggleSelect(u) {
    const m = new Map(selected);
    if (m.has(u.line_user_id)) m.delete(u.line_user_id);
    else m.set(u.line_user_id, u);
    setSelected(m);
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Map());
    } else {
      const m = new Map();
      users.forEach(u => { if (u.line_user_id !== selfId) m.set(u.line_user_id, u); });
      setSelected(m);
    }
  }

  async function handleApprove(u) {
    Modal.confirm({
      title: 'อนุมัติผู้ใช้',
      content: `อนุมัติให้ ${u.display_name} (${u.department || '-'}) เข้าใช้งานระบบ?`,
      okText: 'อนุมัติ', cancelText: 'ยกเลิก',
      okButtonProps: { style: { background: MINT_DARK, borderColor: MINT_DARK } },
      async onOk() {
        try {
          await approveUser(u.line_user_id);
          message.success('อนุมัติสำเร็จ');
          load();
        } catch (err) { message.error(err.message || 'ไม่สำเร็จ'); }
      },
    });
  }

  async function handleDisable(u) {
    Modal.confirm({
      title: 'ระงับการใช้งาน',
      content: `ระงับ ${u.display_name}? ผู้ใช้จะเข้าระบบไม่ได้จนกว่าจะถูก enable ใหม่`,
      okText: 'ระงับ', okButtonProps: { danger: true }, cancelText: 'ยกเลิก',
      async onOk() {
        try {
          await disableUser(u.line_user_id);
          message.success('ระงับสำเร็จ');
          load();
        } catch (err) { message.error(err.message || 'ไม่สำเร็จ'); }
      },
    });
  }

  async function handleEnable(u) {
    try {
      await enableUser(u.line_user_id);
      message.success('เปิดใช้งานสำเร็จ');
      load();
    } catch (err) { message.error(err.message || 'ไม่สำเร็จ'); }
  }

  async function handleToggleAdmin(u) {
    const action = u.is_admin ? 'ถอดสิทธิ์ admin' : 'มอบสิทธิ์ admin';
    Modal.confirm({
      title: action, content: `${action} จาก ${u.display_name}?`,
      okText: 'ยืนยัน', cancelText: 'ยกเลิก',
      okButtonProps: { style: { background: MINT_DARK, borderColor: MINT_DARK } },
      async onOk() {
        try {
          await toggleAdmin(u.line_user_id);
          message.success(`${action}สำเร็จ`);
          load();
        } catch (err) { message.error(err.message || 'ไม่สำเร็จ'); }
      },
    });
  }

  async function handleResetPin(u) {
    Modal.confirm({
      title: 'Reset PIN',
      content: `Reset PIN ของ ${u.display_name}? ผู้ใช้ต้องตั้ง PIN ใหม่เมื่อ login ครั้งหน้า`,
      okText: 'Reset', okButtonProps: { danger: true }, cancelText: 'ยกเลิก',
      async onOk() {
        try {
          await resetUserPin(u.line_user_id);
          message.success('Reset PIN สำเร็จ');
          load();
        } catch (err) { message.error(err.message || 'ไม่สำเร็จ'); }
      },
    });
  }

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
          const r = await action(ids);
          const msg = `✅ สำเร็จ ${r.succeeded ?? ids.length} รายการ` +
            (r.failed_count > 0 ? ` · ⚠️ ผิดพลาด ${r.failed_count}` : '');
          message.success(msg, 4);
          setSelected(new Map());
          load();
        } catch (err) {
          message.error(err.message || `${label}ไม่สำเร็จ`);
        } finally {
          setBulkLoading(false);
        }
      },
    });
  }

  const bulkActions = useMemo(() => {
    if (tab === 'pending') return [{ key: 'a', icon: <CheckOutlined />, label: 'อนุมัติทั้งหมด', onClick: () => runBulk(bulkApproveUsers, 'อนุมัติ'), loading: bulkLoading }];
    if (tab === 'active')  return [{ key: 'b', icon: <StopOutlined />, label: 'ระงับทั้งหมด', danger: true, onClick: () => runBulk(bulkDisableUsers, 'ระงับ', true), loading: bulkLoading }];
    if (tab === 'disabled') return [{ key: 'c', icon: <PlayCircleOutlined />, label: 'เปิดใช้งานทั้งหมด', onClick: () => runBulk(bulkEnableUsers, 'เปิดใช้งาน'), loading: bulkLoading }];
    return [];
  }, [tab, bulkLoading, selectedCount]);

  function buildActionMenu(u) {
    const items = [];
    if (u.status === 'pending') {
      items.push({ key: 'approve', icon: <CheckOutlined style={{ color: MINT_MID }} />, label: 'อนุมัติ', onClick: () => handleApprove(u) });
    }
    if (u.status === 'active') {
      items.push({ key: 'toggleAdmin', icon: <CrownOutlined style={{ color: '#F59E0B' }} />, label: u.is_admin ? 'ถอด admin' : 'ตั้งเป็น admin', onClick: () => handleToggleAdmin(u) });
      items.push({ key: 'resetPin', icon: <KeyOutlined />, label: 'Reset PIN', onClick: () => handleResetPin(u) });
      items.push({ type: 'divider' });
      items.push({ key: 'disable', icon: <StopOutlined />, label: 'ระงับการใช้งาน', danger: true, onClick: () => handleDisable(u) });
    }
    if (u.status === 'disabled') {
      items.push({ key: 'enable', icon: <PlayCircleOutlined style={{ color: MINT_MID }} />, label: 'เปิดใช้งานอีกครั้ง', onClick: () => handleEnable(u) });
    }
    return items;
  }

  return (
    <div>
      <div style={pageHeaderStyle}>
        <h1 style={pageTitleStyle}>👥 จัดการผู้ใช้</h1>
        <button onClick={load} style={refreshBtnStyle} title="รีเฟรช">
          <ReloadOutlined spin={loading} />
        </button>
      </div>

      <div style={cardStyle}>
        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={[
            { key: 'pending',  label: 'รออนุมัติ' },
            { key: 'active',   label: 'ใช้งาน' },
            { key: 'disabled', label: 'ระงับ' },
          ]}
        />

        <Input
          placeholder="ค้นหาชื่อ / รหัสพนักงาน..."
          prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ borderRadius: 10, marginBottom: 16, maxWidth: 480 }}
        />

        {loading && users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
        ) : users.length === 0 ? (
          <Empty
            description={
              search ? 'ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข' :
              tab === 'pending' ? 'ไม่มีผู้ใช้รออนุมัติ' :
              tab === 'active' ? 'ไม่มีผู้ใช้ที่ active' :
              'ไม่มีผู้ใช้ที่ถูกระงับ'
            }
            style={{ padding: 40 }}
          />
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', marginBottom: 6 }}>
              <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleSelectAll}>
                <Text type="secondary" style={{ fontSize: 12 }}>เลือกทั้งหมด ({users.length})</Text>
              </Checkbox>
              {selectedCount > 0 && (
                <Text type="secondary" style={{ fontSize: 12 }}>เลือก {selectedCount}</Text>
              )}
            </div>

            <List
              dataSource={users}
              renderItem={u => {
                const isSelf = u.line_user_id === selfId;
                const isChecked = selected.has(u.line_user_id);
                return (
                  <Card
                    size="small"
                    style={{
                      marginBottom: 8,
                      borderColor: isChecked ? MINT_DARK : 'rgba(31,77,63,0.08)',
                      background: isChecked ? MINT_SOFT : '#fff',
                      borderRadius: 12,
                      borderWidth: '0.5px',
                    }}
                    styles={{ body: { padding: 12 } }}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Checkbox checked={isChecked} disabled={isSelf} onChange={() => toggleSelect(u)} />
                      {u.picture_url
                        ? <Avatar src={u.picture_url} size={40} />
                        : <Avatar icon={<UserOutlined />} size={40} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text strong style={{ fontSize: 14 }}>{u.display_name}</Text>
                          {u.is_admin && <Tag color="gold" style={{ marginInlineEnd: 0 }}>Admin</Tag>}
                          {isSelf && <Tag color="blue" style={{ marginInlineEnd: 0 }}>คุณ</Tag>}
                        </div>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                          {u.nickname || u.full_name || u.department}
                          {u.employee_code && ` · ${u.employee_code}`}
                        </Text>
                        {u.last_login_at && tab === 'active' && (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            last login: {new Date(u.last_login_at).toLocaleString('th-TH')}
                          </Text>
                        )}
                        {u.created_at && tab === 'pending' && (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            ลงทะเบียน: {new Date(u.created_at).toLocaleString('th-TH')}
                          </Text>
                        )}
                      </div>
                      <Space>
                        {u.status === 'pending' && (
                          <Button type="primary" size="small" icon={<CheckOutlined />}
                            onClick={() => handleApprove(u)}
                            style={{ background: MINT_DARK, borderColor: MINT_DARK }}>
                            อนุมัติ
                          </Button>
                        )}
                        <Dropdown menu={{ items: buildActionMenu(u) }} placement="bottomRight" trigger={['click']}>
                          <Button type="text" icon={<MoreOutlined />} />
                        </Dropdown>
                      </Space>
                    </div>
                  </Card>
                );
              }}
            />
          </>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div style={bulkBarStyle}>
          <span style={{ fontWeight: 600 }}>เลือก {selectedCount} รายการ</span>
          <Space>
            {bulkActions.map(a => (
              <Button
                key={a.key}
                icon={a.icon}
                danger={a.danger}
                loading={a.loading}
                onClick={a.onClick}
                type={a.danger ? 'default' : 'primary'}
                style={a.danger ? {} : { background: '#fff', borderColor: '#fff', color: MINT_DARK }}
              >
                {a.label}
              </Button>
            ))}
            <Button type="text" style={{ color: '#fff' }} onClick={() => setSelected(new Map())}>ยกเลิก</Button>
          </Space>
        </div>
      )}
    </div>
  );
}

const pageHeaderStyle = {
  background: '#fff',
  borderRadius: 14,
  padding: '16px 20px',
  marginBottom: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  border: '0.5px solid rgba(31,77,63,0.08)',
  boxShadow: '0 1px 3px rgba(31,77,63,0.06)',
};

const pageTitleStyle = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
  color: MINT_DARK,
};

const refreshBtnStyle = {
  background: MINT_SOFT,
  border: 'none',
  borderRadius: 8,
  width: 32, height: 32,
  cursor: 'pointer', color: MINT_DARK,
};

const cardStyle = {
  background: '#fff',
  borderRadius: 14,
  padding: 20,
  border: '0.5px solid rgba(31,77,63,0.08)',
  boxShadow: '0 1px 3px rgba(31,77,63,0.04)',
};

const bulkBarStyle = {
  position: 'fixed',
  bottom: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  background: MINT_DARK,
  color: '#fff',
  padding: '10px 20px',
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  boxShadow: '0 4px 16px rgba(31,77,63,0.25)',
  zIndex: 200,
};
