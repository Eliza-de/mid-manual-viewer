/**
 * Pending — waiting for admin approval (rebranded)
 */

import { Card, Result, Button, Space, Avatar, Typography } from 'antd';
import { UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.jsx';
import { BRAND, COLORS } from '../brand.js';

const { Text } = Typography;

export default function Pending() {
  const auth = useAuth();

  return (
    <div style={containerStyle}>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {auth.profile && (
            <Card size="small" style={{ background: COLORS.bgSoft, border: `1px solid ${COLORS.brandLight}` }}>
              <Space>
                {auth.profile.pictureUrl
                  ? <Avatar src={auth.profile.pictureUrl} size={40} />
                  : <Avatar icon={<UserOutlined />} size={40} />
                }
                <div>
                  <div style={{ fontWeight: 600 }}>{auth.profile.displayName}</div>
                  {auth.user && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      แผนก: {auth.user.department}
                    </Text>
                  )}
                </div>
              </Space>
            </Card>
          )}

          <Result
            icon={<ClockCircleOutlined style={{ color: COLORS.accent }} />}
            title="รอการอนุมัติ"
            subTitle="คุณได้ลงทะเบียนเรียบร้อยแล้ว กรุณารอ admin พิจารณาอนุมัติบัญชี"
            extra={[
              <Button key="refresh" type="primary" onClick={auth.refresh}
                style={{ background: COLORS.primary, borderColor: COLORS.primary }}>
                ตรวจสอบสถานะ
              </Button>
            ]}
          />

          <Text type="secondary" style={{ fontSize: 12, textAlign: 'center', display: 'block' }}>
            หากต้องการความช่วยเหลือ ติดต่อ IT Department
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
