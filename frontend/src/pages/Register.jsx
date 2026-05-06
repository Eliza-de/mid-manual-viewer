/**
 * Register — rebranded
 */

import { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Space, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.jsx';
import { register } from '../api/auth.js';
import { getIdToken } from '../api/liff.js';
import { BRAND, COLORS } from '../brand.js';

const { Title, Text, Paragraph } = Typography;

export default function Register() {
  const auth = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();

  async function handleSubmit(values) {
    setSubmitting(true);
    setError(null);
    try {
      const idToken = getIdToken();
      const r = await register(idToken, {
        department: values.department,
        employee_code: values.employee_code || ''
      });
      if (!r.ok) {
        setError(r.error);
        setSubmitting(false);
        return;
      }
      await auth.refresh();
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
      setSubmitting(false);
    }
  }

  return (
    <div style={containerStyle}>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0, color: COLORS.primary }}>ลงทะเบียน</Title>
            <Text type="secondary">{BRAND.appName}</Text>
          </div>

          {auth.profile && (
            <Card size="small" style={{ background: COLORS.bgSoft, border: `1px solid ${COLORS.brandLight}` }}>
              <Space>
                {auth.profile.pictureUrl
                  ? <Avatar src={auth.profile.pictureUrl} size={48} />
                  : <Avatar icon={<UserOutlined />} size={48} />
                }
                <div>
                  <div style={{ fontWeight: 600 }}>{auth.profile.displayName}</div>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    LINE ID: {auth.profile.userId.slice(0, 12)}...
                  </Text>
                </div>
              </Space>
            </Card>
          )}

          <Paragraph style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            กรุณากรอกข้อมูลเพื่อขอเข้าใช้งานระบบ admin จะพิจารณาอนุมัติภายหลัง
          </Paragraph>

          {error && (
            <Alert type="error" showIcon message={error} closable onClose={() => setError(null)} />
          )}

          <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            <Form.Item
              label="แผนก"
              name="department"
              rules={[
                { required: true, message: 'กรุณาระบุแผนก' },
                { max: 100, message: 'ชื่อแผนกยาวเกินไป' }
              ]}
            >
              <Input placeholder="เช่น IT, OPD, Lab" autoComplete="off" />
            </Form.Item>

            <Form.Item
              label={<span>รหัสพนักงาน <Text type="secondary" style={{ marginLeft: 4 }}>(ไม่บังคับ)</Text></span>}
              name="employee_code"
              rules={[{ max: 50, message: 'รหัสพนักงานยาวเกินไป' }]}
            >
              <Input placeholder="เช่น EMP001" autoComplete="off" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                size="large"
                style={{ background: COLORS.primary, borderColor: COLORS.primary }}
              >
                ลงทะเบียน
              </Button>
            </Form.Item>
          </Form>

          <Text type="secondary" style={{ fontSize: 11, textAlign: 'center', display: 'block' }}>
            {BRAND.companyTH} · IT Department
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
