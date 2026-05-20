/**
 * Register — 2 โหมด:
 *   - "มีรหัสเชิญ"  → กรอก login_code อย่างเดียว → /auth/claim → ไป PinSetup
 *   - "ลงทะเบียนเอง" → กรอก full_name + nickname + login_code → /auth/register → รอ admin อนุมัติ
 */

import { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Space, Avatar, Radio } from 'antd';
import { UserOutlined, KeyOutlined, FormOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.jsx';
import { register, claimInvite } from '../api/auth.js';
import { getIdToken } from '../api/liff.js';
import { BRAND, COLORS } from '../brand.js';

const { Title, Text, Paragraph } = Typography;

export default function Register() {
  const auth = useAuth();
  const [mode, setMode] = useState('claim');  // 'claim' | 'self'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();

  async function handleSubmit(values) {
    setSubmitting(true);
    setError(null);
    try {
      const idToken = getIdToken();
      let r;
      if (mode === 'claim') {
        r = await claimInvite(idToken, values.login_code?.trim());
      } else {
        r = await register(idToken, {
          full_name: values.full_name?.trim(),
          nickname: values.nickname?.trim(),
          login_code: values.login_code?.trim()
        });
      }
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

          {/* Mode toggle */}
          <Radio.Group
            value={mode}
            onChange={(e) => { setMode(e.target.value); setError(null); form.resetFields(); }}
            style={{ width: '100%' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Radio.Button value="claim" style={modeBtnStyle}>
                <KeyOutlined /> มีรหัสเชิญ
              </Radio.Button>
              <Radio.Button value="self" style={modeBtnStyle}>
                <FormOutlined /> ลงทะเบียนเอง
              </Radio.Button>
            </div>
          </Radio.Group>

          <Paragraph style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            {mode === 'claim'
              ? 'กรอกรหัสเชิญที่ได้รับจาก admin เพื่อรับสิทธิ์เข้าใช้งานทันที'
              : 'กรอกข้อมูลเพื่อขอเข้าใช้งาน ระบบ admin จะพิจารณาอนุมัติภายหลัง'}
          </Paragraph>

          {error && (
            <Alert type="error" showIcon message={error} closable onClose={() => setError(null)} />
          )}

          <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            {mode === 'self' && (
              <>
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
              </>
            )}

            <Form.Item
              label={mode === 'claim' ? 'รหัสเชิญ' : 'ตั้งค่ารหัสล็อกอิน'}
              name="login_code"
              rules={[
                { required: true, message: mode === 'claim' ? 'กรุณาระบุรหัสเชิญ' : 'กรุณาระบุรหัสล็อกอิน' },
                { max: 100, message: 'รหัสยาวเกินไป' }
              ]}
            >
              <Input
                placeholder={mode === 'claim' ? 'เช่น A-001' : 'รหัสล็อกอิน'}
                autoComplete="off"
                style={mode === 'claim' ? { fontSize: 18, letterSpacing: 1, fontFamily: 'monospace' } : undefined}
              />
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
                {mode === 'claim' ? 'ยืนยันรหัสเชิญ' : 'ลงทะเบียน'}
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

const modeBtnStyle = {
  textAlign: 'center',
  height: 44,
  lineHeight: '42px',
  fontWeight: 500,
};
