/**
 * Splash — initial loading screen (rebranded: Lean Buddy)
 */

import { Card, Spin, Typography, Result, Button } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.jsx';
import { BRAND, COLORS } from '../brand.js';

const { Title, Text } = Typography;

export default function Splash() {
  const auth = useAuth();

  if (auth.status === 'error') {
    return (
      <div style={containerStyle}>
        <Card style={cardStyle}>
          <Result
            status="error"
            title="ไม่สามารถโหลดระบบได้"
            subTitle={auth.error || 'เกิดข้อผิดพลาด'}
            extra={
              <Button type="primary" onClick={auth.refresh} style={{ background: COLORS.primary, borderColor: COLORS.primary }}>
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
      <Card style={cardStyle}>
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={logoStyle}>
            <span role="img" aria-label="logo" style={{ fontSize: 32 }}>📖</span>
          </div>
          <Title level={3} style={{ margin: '12px 0 4px', color: COLORS.primary }}>
            {BRAND.appName}
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 32, fontSize: 13 }}>
            {BRAND.appTagline}
          </Text>
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 32, color: COLORS.primary }} spin />}
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
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  width: '100vw',
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  background: COLORS.bgSoft
};

const cardStyle = {
  width: '100%',
  maxWidth: 400,
  boxShadow: '0 2px 16px rgba(31, 77, 63, 0.08)',
  border: `1px solid ${COLORS.brandLight}`
};

const logoStyle = {
  width: 72,
  height: 72,
  margin: '0 auto',
  borderRadius: 16,
  background: COLORS.brand,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
