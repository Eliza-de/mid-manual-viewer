/**
 * Register — 3 simple text fields (rebranded)
 *   - ชื่อ-สกุล
 *   - ชื่อเล่น
 *   - ตั้งค่ารหัสล็อกอิน (text ปกติ)
 *
 * After submit → status='pending' → goes to Pending page
 *               (or 'active' if bootstrap admin → PinSetup)
 * PIN is set in PinSetup page (unchanged from before).
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
        full_name: values.full_name,
        nickname: values.nickname,
        login_code: values.login_code
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
            กรุณากรอกข้อมูลเพื่อขอเข้าใช้งาน ระบบ admin จะพิจารณาอนุมัติภายหลัง
          </Paragraph>

          {error && (
            <Alert type="error" showIcon message={error} closable onClose={() => setError(null)} />
          )}

          <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            <Form.Item
              label="ชื่อ-สกุล"
              name="full_name"
              rules={[
                { required: true, message: 'กรุณาระบุชื่อ-สกุล' },
                { max: 200, message: 'ชื่อ-สกุลยาวเกินไป' }
              ]}
            >
              <Input placeholder="ชื่อ-สกุล" autoComplete="off" />
            </Form.Item>

            <Form.Item
              label="ชื่อเล่น"
              name="nickname"
              rules={[
                { required: true, message: 'กรุณาระบุชื่อเล่น' },
                { max: 100, message: 'ชื่อเล่นยาวเกินไป' }
              ]}
            >
              <Input placeholder="ชื่อเล่น" autoComplete="off" />
            </Form.Item>

            <Form.Item
              label="ตั้งค่ารหัสล็อกอิน"
              name="login_code"
              rules={[
                { required: true, message: 'กรุณาระบุรหัสล็อกอิน' },
                { max: 100, message: 'รหัสล็อกอินยาวเกินไป' }
              ]}
            >
              <Input placeholder="รหัสล็อกอิน" autoComplete="off" />
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
