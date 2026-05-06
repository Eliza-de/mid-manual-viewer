/**
 * UserManagement — admin user management (rebranded)
 */

import { useEffect, useState } from 'react';
import {
  Card, Button, List, Avatar, Tag, Tabs, Modal, message, Space,
  Typography, Dropdown, Empty, Spin
} from 'antd';
import {
  ArrowLeftOutlined, UserOutlined, CheckOutlined, StopOutlined,
  ReloadOutlined, MoreOutlined, KeyOutlined, CrownOutlined, PlayCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigation } from '../../hooks/useNavigation.jsx';
import { getIdToken } from '../../api/liff.js';
import {
  listUsers, approveUser, disableUser, enableUser,
  toggleAdmin, resetUserPin
} from '../../api/admin.js';
import { COLORS } from '../../brand.js';

const { Text } = Typography;

export default function UserManagement() {
  const auth = useAuth();
  const nav = useNavigation();
  const [tab, setTab] = useState('pending');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!auth.session) return;
    setLoading(true);
    try {
      const idToken = getIdToken();
      const r = await listUsers(idToken, auth.session.token, tab);
      if (r.ok) setUsers(r.users);
      else if (r.needsLogin) auth.logout();
      else message.error(r.error || 'โหลดข้อมูลไม่สำเร็จ');
    } catch (err) {
      message.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [tab]);

  async function handleApprove(user) {
    Modal.confirm({
      title: 'อนุมัติผู้ใช้',
      content: `อนุมัติให้ ${user.display_name} (${user.department}) เข้าใช้งานระบบ?`,
      okText: 'อนุมัติ',
      cancelText: 'ยกเลิก',
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
      title: action, content: `${action} ของ ${user.display_name}?`,
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

  function buildActionMenu(user) {
    const items = [];
    if (user.status === 'pending') {
      items.push({
        key: 'approve', icon: <CheckOutlined style={{ color: COLORS.accent }} />,
        label: 'อนุมัติ', onClick: () => handleApprove(user)
      });
    }
    if (user.status === 'active') {
      items.push({
        key: 'toggleAdmin', icon: <CrownOutlined style={{ color: '#f59e0b' }} />,
        label: user.is_admin ? 'ถอด admin' : 'ตั้งเป็น admin',
        onClick: () => handleToggleAdmin(user)
      });
      items.push({
        key: 'resetPin', icon: <KeyOutlined />, label: 'Reset PIN',
        onClick: () => handleResetPin(user)
      });
      items.push({ type: 'divider' });
      items.push({
        key: 'disable', icon: <StopOutlined />, label: 'ระงับการใช้งาน',
        danger: true, onClick: () => handleDisable(user)
      });
    }
    if (user.status === 'disabled') {
      items.push({
        key: 'enable', icon: <PlayCircleOutlined style={{ color: COLORS.accent }} />,
        label: 'เปิดใช้งานอีกครั้ง', onClick: () => handleEnable(user)
      });
    }
    return items;
  }

  return (
    <div style={pageStyle}>
      <div style={topBarStyle}>
        <Button type="text" icon={<ArrowLeftOutlined />}
          onClick={() => nav.goAdminPage('dashboard')} style={{ color: '#fff' }}>กลับ</Button>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>จัดการผู้ใช้</div>
        <Button type="text" icon={<ReloadOutlined spin={loading} />} onClick={load} style={{ color: '#fff' }} />
      </div>

      <Tabs activeKey={tab} onChange={setTab} centered
        style={{ background: '#fff' }}
        items={[
          { key: 'pending', label: 'รออนุมัติ' },
          { key: 'active', label: 'ใช้งาน' },
          { key: 'disabled', label: 'ระงับ' }
        ]}
      />

      <div style={contentStyle}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {loading && users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
          ) : users.length === 0 ? (
            <Empty
              description={
                tab === 'pending' ? 'ไม่มีผู้ใช้รออนุมัติ' :
                tab === 'active' ? 'ไม่มีผู้ใช้ที่ active' :
                'ไม่มีผู้ใช้ที่ถูกระงับ'
              }
              style={{ marginTop: 40 }}
            />
          ) : (
            <List
              dataSource={users}
              renderItem={user => (
                <Card size="small" style={{ marginBottom: 8 }} styles={{ body: { padding: 12 } }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {user.picture_url
                      ? <Avatar src={user.picture_url} size={40} />
                      : <Avatar icon={<UserOutlined />} size={40} />
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text strong style={{ fontSize: 14 }}>{user.display_name}</Text>
                        {user.is_admin && <Tag color="gold" style={{ marginInlineEnd: 0 }}>Admin</Tag>}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                        {user.department}
                        {user.employee_code && ` · ${user.employee_code}`}
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
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  position: 'fixed', inset: 0,
  display: 'flex', flexDirection: 'column',
  background: COLORS.bgSoft, zIndex: 100
};

const topBarStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0 12px', background: COLORS.primary,
  height: 52, flexShrink: 0
};

const contentStyle = { padding: 12, flex: 1, overflowY: 'auto' };
