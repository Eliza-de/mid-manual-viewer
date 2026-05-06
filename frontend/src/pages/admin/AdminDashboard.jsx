/**
 * AdminDashboard — Phase 7
 *
 * Dashboard with real-time stats + 4 active sections:
 *  - เพิ่มเอกสารใหม่
 *  - อนุมัติผู้ใช้ใหม่
 *  - จัดการเอกสาร
 *  - ดู Log
 */

import { useEffect, useState } from 'react';
import { Card, Typography, Button, Row, Col, Tag, Spin, Statistic, Badge, message } from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  UsergroupAddOutlined,
  FileTextOutlined,
  HistoryOutlined,
  RightOutlined,
  ReloadOutlined,
  TeamOutlined,
  EyeOutlined,
  LoginOutlined
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigation } from '../../hooks/useNavigation.jsx';
import { getIdToken } from '../../api/liff.js';
import { getStats } from '../../api/admin.js';

const { Title, Text } = Typography;

export default function AdminDashboard() {
  const auth = useAuth();
  const nav = useNavigation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadStats() {
    if (!auth.session) return;
    setLoading(true);
    try {
      const idToken = getIdToken();
      const r = await getStats(idToken, auth.session.token);
      if (r.ok) {
        setStats(r.stats);
      } else {
        if (r.needsLogin) auth.logout();
        else message.error(r.error || 'โหลดข้อมูลไม่สำเร็จ');
      }
    } catch (err) {
      message.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  const cards = [
    {
      key: 'upload',
      icon: <PlusOutlined style={{ fontSize: 22, color: '#1e3a5f' }} />,
      title: 'เพิ่มเอกสารใหม่',
      desc: 'อัปโหลด PNG เข้าระบบ',
      enabled: true,
      onClick: () => nav.goAdminPage('upload')
    },
    {
      key: 'users',
      icon: <UsergroupAddOutlined style={{ fontSize: 22, color: '#f59e0b' }} />,
      title: 'จัดการผู้ใช้',
      desc: 'อนุมัติ / ระงับ / ตั้งสิทธิ์ admin',
      enabled: true,
      badge: stats?.users?.pending || 0,
      onClick: () => nav.goAdminPage('users')
    },
    {
      key: 'docs',
      icon: <FileTextOutlined style={{ fontSize: 22, color: '#10b981' }} />,
      title: 'จัดการเอกสาร',
      desc: 'แก้ไข / archive / restore',
      enabled: true,
      onClick: () => nav.goAdminPage('docs')
    },
    {
      key: 'logs',
      icon: <HistoryOutlined style={{ fontSize: 22, color: '#6366f1' }} />,
      title: 'ดู Log',
      desc: 'Auth / Audit / Access logs',
      enabled: true,
      onClick: () => nav.goAdminPage('logs')
    }
  ];

  return (
    <div style={pageStyle}>
      <div style={topBarStyle}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={nav.closeAdmin}
          style={{ color: '#fff' }}
        >
          กลับ
        </Button>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
          🛡 Admin Dashboard
        </div>
        <Button
          type="text"
          icon={<ReloadOutlined spin={loading} />}
          onClick={loadStats}
          style={{ color: '#fff' }}
        />
      </div>

      <div style={contentStyle}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Welcome */}
          <Card size="small" style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>ยินดีต้อนรับ</Text>
            <Title level={5} style={{ margin: '4px 0', color: '#1e3a5f' }}>
              {auth.user?.displayName} <Tag color="gold">Admin</Tag>
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {auth.user?.department}
            </Text>
          </Card>

          {/* Stats overview */}
          {loading && !stats ? (
            <Card style={{ marginBottom: 12, textAlign: 'center', padding: 24 }}>
              <Spin />
            </Card>
          ) : stats ? (
            <>
              <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                <Col span={8}>
                  <Card size="small" styles={{ body: { padding: 10 } }}>
                    <Statistic
                      title={<span style={{ fontSize: 11 }}><TeamOutlined /> ผู้ใช้</span>}
                      value={stats.users.total}
                      valueStyle={{ fontSize: 18, color: '#1e3a5f' }}
                    />
                    {stats.users.pending > 0 && (
                      <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 2 }}>
                        รออนุมัติ {stats.users.pending}
                      </div>
                    )}
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" styles={{ body: { padding: 10 } }}>
                    <Statistic
                      title={<span style={{ fontSize: 11 }}><FileTextOutlined /> เอกสาร</span>}
                      value={stats.documents.active}
                      valueStyle={{ fontSize: 18, color: '#10b981' }}
                    />
                    {stats.documents.archived > 0 && (
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                        archived {stats.documents.archived}
                      </div>
                    )}
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" styles={{ body: { padding: 10 } }}>
                    <Statistic
                      title={<span style={{ fontSize: 11 }}><EyeOutlined /> เปิดวันนี้</span>}
                      value={stats.today.accesses}
                      valueStyle={{ fontSize: 18, color: '#6366f1' }}
                    />
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                      <LoginOutlined /> {stats.today.logins} login
                    </div>
                  </Card>
                </Col>
              </Row>
            </>
          ) : null}

          {/* Action Cards */}
          <Row gutter={[8, 8]}>
            {cards.map(c => (
              <Col span={24} key={c.key}>
                <Card
                  hoverable={c.enabled}
                  onClick={c.enabled ? c.onClick : undefined}
                  style={{
                    cursor: c.enabled ? 'pointer' : 'not-allowed',
                    opacity: c.enabled ? 1 : 0.6
                  }}
                  styles={{ body: { padding: 14 } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div>
                      {c.badge > 0 ? (
                        <Badge count={c.badge} offset={[-4, 4]}>
                          {c.icon}
                        </Badge>
                      ) : (
                        c.icon
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: '#1e3a5f' }}>
                        {c.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                        {c.desc}
                      </div>
                    </div>
                    {c.enabled && (
                      <RightOutlined style={{ color: '#cbd5e1', fontSize: 14 }} />
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  position: 'fixed', inset: 0,
  display: 'flex', flexDirection: 'column',
  background: '#f5f7fa', zIndex: 100
};

const topBarStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0 12px', background: '#1e3a5f',
  height: 52, flexShrink: 0
};

const contentStyle = {
  padding: 12, flex: 1, overflowY: 'auto'
};
