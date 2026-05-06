/**
 * Splash — Initial loading screen
 *
 * Shown only briefly while:
 * - LIFF SDK initializes
 * - Backend checkRegistration is called
 *
 * After this completes, AuthProvider sets status to one of:
 * unregistered / pending / needsPin / needsLogin / authenticated / etc.
 * App.jsx routes accordingly.
 */

import { Card, Spin, Typography, Result, Button } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.jsx';

const { Title, Text } = Typography;

export default function Splash() {
  const auth = useAuth();

  if (auth.status === 'error') {
    return (
      <div style={containerStyle}>
        <Card>
          <Result
            status="error"
            title="ไม่สามารถโหลดระบบได้"
            subTitle={auth.error || 'เกิดข้อผิดพลาด'}
            extra={
              <Button type="primary" onClick={auth.refresh}>
                ลองใหม่
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Title level={3} style={{ margin: 0, color: '#1e3a5f' }}>
            MID Manual Viewer
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 32 }}>
            โรงพยาบาลวิภาราม แหลมฉบัง
          </Text>
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
          />
          <Text type="secondary" style={{ display: 'block', marginTop: 16, fontSize: 13 }}>
            กำลังโหลด...
          </Text>
        </div>
      </Card>
    </div>
  );
}

const containerStyle = {
  padding: 16,
  maxWidth: 480,
  margin: '0 auto',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center'
};
