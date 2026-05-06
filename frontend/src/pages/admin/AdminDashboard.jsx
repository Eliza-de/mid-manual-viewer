/**
 * AdminDashboard — admin home page with action cards
 *
 * Phase 5: เพิ่มเอกสารใหม่ (active)
 * Phase 7: อนุมัติผู้ใช้, จัดการเอกสาร, ดู Log (placeholder)
 */

import { Card, Typography, Button, Row, Col, Tag, message } from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  UsergroupAddOutlined,
  FileTextOutlined,
  HistoryOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigation } from '../../hooks/useNavigation.jsx';

const { Title, Text } = Typography;

export default function AdminDashboard() {
  const auth = useAuth();
  const nav = useNavigation();

  const cards = [
    {
      key: 'upload',
      icon: <PlusOutlined style={{ fontSize: 24, color: '#1e3a5f' }} />,
      title: 'เพิ่มเอกสารใหม่',
      desc: 'อัปโหลด PNG เข้า Drive และเพิ่มในระบบ',
      enabled: true,
      onClick: () => nav.goAdminPage('upload')
    },
    {
      key: 'users',
      icon: <UsergroupAddOutlined style={{ fontSize: 24, color: '#94a3b8' }} />,
      title: 'อนุมัติผู้ใช้ใหม่',
      desc: 'รายการผู้ใช้ pending รอ approve',
      enabled: false,
      tag: 'Phase 7'
    },
    {
      key: 'docs',
      icon: <FileTextOutlined style={{ fontSize: 24, color: '#94a3b8' }} />,
      title: 'จัดการเอกสาร',
      desc: 'แก้ไข / archive / ลบ เอกสาร',
      enabled: false,
      tag: 'Phase 7'
    },
    {
      key: 'logs',
      icon: <HistoryOutlined style={{ fontSize: 24, color: '#94a3b8' }} />,
      title: 'ดู Log',
      desc: 'Auth log, Audit log, Access log',
      enabled: false,
      tag: 'Phase 7'
    }
  ];

  return (
    <div style={pageStyle}>
      {/* Top bar */}
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
        <div style={{ width: 60 }} />
      </div>

      <div style={contentStyle}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Welcome */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Text type="secondary">ยินดีต้อนรับ</Text>
            <Title level={4} style={{ margin: '4px 0', color: '#1e3a5f' }}>
              {auth.user?.displayName} <Tag color="gold">Admin</Tag>
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {auth.user?.department}
            </Text>
          </Card>

          {/* Cards */}
          <Row gutter={[12, 12]}>
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
                    <div>{c.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 600,
                        fontSize: 15,
                        color: c.enabled ? '#1e3a5f' : '#64748b'
                      }}>
                        {c.title}
                        {c.tag && (
                          <Tag color="default" style={{ marginLeft: 8, fontSize: 10 }}>
                            {c.tag}
                          </Tag>
                        )}
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
  position: 'fixed',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  background: '#f5f7fa',
  zIndex: 100
};

const topBarStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 12px',
  background: '#1e3a5f',
  height: 52,
  flexShrink: 0
};

const contentStyle = {
  padding: 16,
  flex: 1,
  overflowY: 'auto'
};
