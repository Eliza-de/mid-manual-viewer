/**
 * CreateMemberModal — Admin pre-creates a "shell" user that a real LINE
 * account can later claim by entering the login_code.
 *
 * Used by both desktop UserManagement and LIFF UserManagement. The caller
 * supplies an `onSubmit(fields)` that knows the right auth flavor
 * (adminToken vs idToken+sessionToken).
 */
import { useState } from 'react';
import { Modal, Form, Input, Checkbox, Alert, Button, Typography, Tooltip } from 'antd';
import { CopyOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function CreateMemberModal({ open, onClose, onSubmit }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleOk() {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      setError(null);
      const r = await onSubmit({
        full_name: values.full_name?.trim(),
        nickname: values.nickname?.trim(),
        login_code: values.login_code?.trim(),
        department: values.department?.trim() || '',
        employee_code: values.employee_code?.trim() || '',
        is_admin: !!values.is_admin
      });
      setSubmitting(false);
      if (!r?.ok) {
        setError(r?.error || 'สร้างสมาชิกไม่สำเร็จ');
        return;
      }
      setSuccess(values.login_code);
    } catch (err) {
      if (err?.errorFields) return; // form validation
      setError(err?.message || 'เกิดข้อผิดพลาด');
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) return;
    form.resetFields();
    setError(null);
    setSuccess(null);
    setCopied(false);
    onClose();
  }

  function copyCode() {
    if (!success) return;
    try {
      navigator.clipboard.writeText(success);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  }

  function createAnother() {
    form.resetFields();
    setSuccess(null);
    setError(null);
    setCopied(false);
  }

  return (
    <Modal
      title="➕ สร้างสมาชิกใหม่ (รหัสเชิญ)"
      open={open}
      onCancel={handleClose}
      footer={success ? (
        <>
          <Button onClick={createAnother}>สร้างอีกคน</Button>
          <Button type="primary" onClick={handleClose}>ปิด</Button>
        </>
      ) : (
        <>
          <Button onClick={handleClose} disabled={submitting}>ยกเลิก</Button>
          <Button type="primary" onClick={handleOk} loading={submitting}>สร้าง</Button>
        </>
      )}
      maskClosable={!submitting}
      width={520}
    >
      {success ? (
        <div>
          <Alert
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            message="สร้างสมาชิกสำเร็จ"
            description="ส่งรหัสเชิญด้านล่างให้สมาชิก เปิด LIFF แล้วเลือก 'มีรหัสเชิญ' เพื่อรับสิทธิ์เข้าใช้งาน"
            style={{ marginBottom: 16 }}
          />
          <div style={codeBoxStyle}>
            <div style={{ fontSize: 11, color: '#6B8278', marginBottom: 6 }}>รหัสเชิญ (login_code)</div>
            <div style={codeRowStyle}>
              <code style={codeTextStyle}>{success}</code>
              <Tooltip title={copied ? 'คัดลอกแล้ว' : 'คัดลอก'}>
                <Button
                  icon={copied ? <CheckCircleOutlined /> : <CopyOutlined />}
                  onClick={copyCode}
                />
              </Tooltip>
            </div>
          </div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>
            สมาชิกใหม่จะเป็น <b>active</b> ทันทีเมื่อ claim รหัสนี้ — ไม่ต้องรอ admin อนุมัติซ้ำ
          </Text>
        </div>
      ) : (
        <>
          {error && (
            <Alert type="error" showIcon message={error} closable
              onClose={() => setError(null)}
              style={{ marginBottom: 16, borderRadius: 8 }} />
          )}

          <Form form={form} layout="vertical" requiredMark={false} disabled={submitting}>
            <Form.Item
              label="ชื่อ-สกุล"
              name="full_name"
              rules={[
                { required: true, message: 'กรุณาระบุชื่อ-สกุล' },
                { max: 200, message: 'ชื่อยาวเกินไป' }
              ]}
            >
              <Input placeholder="เช่น สมชาย ใจดี" />
            </Form.Item>

            <Form.Item
              label="ชื่อเล่น"
              name="nickname"
              rules={[
                { required: true, message: 'กรุณาระบุชื่อเล่น' },
                { max: 100, message: 'ชื่อเล่นยาวเกินไป' }
              ]}
            >
              <Input placeholder="เช่น ชาย" />
            </Form.Item>

            <Form.Item
              label="รหัสเชิญ (login_code)"
              name="login_code"
              rules={[
                { required: true, message: 'กรุณาระบุรหัสเชิญ' },
                { max: 100, message: 'รหัสยาวเกินไป' },
                {
                  pattern: /^[A-Za-z0-9\-_]+$/,
                  message: 'ใช้ได้เฉพาะ A-Z, 0-9, ขีดกลาง, ขีดล่าง'
                }
              ]}
              extra="ส่งรหัสนี้ให้สมาชิกเพื่อ claim สิทธิ์เข้าใช้งาน (เช่น A-001, HR-2026)"
            >
              <Input placeholder="A-001" />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item label="แผนก" name="department">
                <Input placeholder="ไม่บังคับ" />
              </Form.Item>
              <Form.Item label="รหัสพนักงาน" name="employee_code">
                <Input placeholder="ไม่บังคับ" />
              </Form.Item>
            </div>

            <Form.Item name="is_admin" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Checkbox>มอบสิทธิ์ admin ให้สมาชิกนี้</Checkbox>
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
}

const codeBoxStyle = {
  background: '#F0F9F3',
  border: '1px solid #5DBFA0',
  borderRadius: 10,
  padding: 12,
};

const codeRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const codeTextStyle = {
  flex: 1,
  fontSize: 18,
  fontWeight: 700,
  letterSpacing: 1,
  color: '#1F4D3F',
  background: 'white',
  padding: '8px 12px',
  borderRadius: 8,
  fontFamily: 'monospace',
};
