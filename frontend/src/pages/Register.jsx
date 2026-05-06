/**
 * Register — First-time user registration form
 *
 * Collects: department, employee_code (optional)
 * Calls register endpoint → next step depends on response:
 *   - autoApproved (bootstrap admin) → needsPin
 *   - status: pending → PendingApproval screen
 */

import { useState } from 'react';
import { Card, Form, Input, Button, Typography, Avatar, Space, Alert, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.jsx';
import { register } from '../api/auth.js';
import { getIdToken } from '../api/liff.js';

const { Title, Text, Paragraph } = Typography;

export default function Register() {
  const auth = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [form] = Form.useForm();

  async function onSubmit(values) {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const idToken = getIdToken();
      const r = await register(idToken, {
        department: values.department,
        employee_code: values.employee_code || ''
      });
      if (!r.ok) {
        setErrorMsg(r.error);
        setSubmitting(false);
        return;
      }
      // Refresh auth state — will route to PinSetup or PendingApproval
      await auth.refresh();
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาด');
      setSubmitting(false);
    }
  }

  return (
    <div style={containerStyle}>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0, color: '#1e3a5f' }}>
              ลงทะเบียน
            </Title>
            <Text type="secondary">MID Manual Viewer</Text>
          </div>

          {auth.profile && (
            <Card size="small" style={{ background: '#f8fafc' }}>
              <Space>
                {auth.profile.pictureUrl
                  ? <Avatar src={auth.profile.pictureUrl} size={48} />
                  : <Avatar icon={<UserOutlined />} size={48} />}
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

          {errorMsg && (
            <Alert type="error" showIcon message={errorMsg} closable onClose={() => setErrorMsg(null)} />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            requiredMark={false}
          >
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
              label={<span>รหัสพนักงาน <Tag style={{ marginLeft: 4 }}>ไม่บังคับ</Tag></span>}
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
              >
                ลงทะเบียน
              </Button>
            </Form.Item>
          </Form>

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
