/**
 * PendingApproval — Shown when user is registered but waiting for admin approval
 */

import { Card, Result, Button, Typography, Space, Avatar } from 'antd';
import { ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.jsx';

const { Text } = Typography;

export default function PendingApproval() {
  const auth = useAuth();

  return (
    <div style={containerStyle}>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {auth.profile && (
            <Card size="small" style={{ background: '#f8fafc' }}>
              <Space>
                {auth.profile.pictureUrl
                  ? <Avatar src={auth.profile.pictureUrl} size={40} />
                  : <Avatar icon={<UserOutlined />} size={40} />}
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
            icon={<ClockCircleOutlined style={{ color: '#f59e0b' }} />}
            title="รอการอนุมัติ"
            subTitle="คุณได้ลงทะเบียนเรียบร้อยแล้ว กรุณารอ admin พิจารณาอนุมัติบัญชี"
            extra={[
              <Button key="refresh" type="primary" onClick={auth.refresh}>
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
