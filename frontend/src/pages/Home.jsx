/**
 * Home — Placeholder page for authenticated users
 *
 * Phase 1: just shows welcome + logout button
 * Phase 2: will become document list with bottom tab navigation
 */

import { Card, Typography, Space, Avatar, Button, Tag, Result } from 'antd';
import { UserOutlined, LogoutOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.jsx';

const { Title, Text, Paragraph } = Typography;

export default function Home() {
  const auth = useAuth();

  return (
    <div style={containerStyle}>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0, color: '#1e3a5f' }}>
              MID Manual Viewer
            </Title>
          </div>

          {auth.user && (
            <Card size="small" style={{ background: '#f0f9ff' }}>
              <Space style={{ width: '100%' }}>
                {auth.profile?.pictureUrl
                  ? <Avatar src={auth.profile.pictureUrl} size={48} />
                  : <Avatar icon={<UserOutlined />} size={48} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {auth.user.displayName}
                    {auth.user.isAdmin && (
                      <Tag color="gold" style={{ marginLeft: 8 }}>Admin</Tag>
                    )}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    แผนก: {auth.user.department}
                  </Text>
                </div>
              </Space>
            </Card>
          )}

          <Result
            icon={<CheckCircleFilled style={{ color: '#10b981' }} />}
            title="เข้าสู่ระบบสำเร็จ"
            subTitle="ระบบยืนยันตัวตนเรียบร้อยแล้ว"
            style={{ padding: '16px 0' }}
          />

          <Card size="small" title="🚧 อยู่ระหว่างพัฒนา">
            <Paragraph style={{ margin: 0, fontSize: 13 }}>
              <Text strong>Phase 1 — Authentication ✅</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Phase ถัดไป (2) จะเพิ่มการดูคู่มือ พร้อม bottom tab navigation
                สำหรับ "เต็มเล่ม" / "เรื่อง" / "สรุป"
              </Text>
            </Paragraph>
          </Card>

          <Button
            block
            icon={<LogoutOutlined />}
            onClick={auth.logout}
            danger
          >
            ออกจากระบบ
          </Button>

          <Text type="secondary" style={{ fontSize: 11, textAlign: 'center', display: 'block' }}>
            Vibharam Laemchabang Hospital · IT Department
          </Text>
        </Space>
      </Card>
    </div>
  );
}

const containerStyle = {
  padding: 16,
  maxWidth: 480,
  margin: '0 auto'
};
