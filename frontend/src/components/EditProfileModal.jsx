/**
 * EditProfileModal — user edits their own profile (LIFF and desktop admin self).
 *
 * Props:
 *   open      — boolean
 *   user      — { displayName?, display_name?, fullName?, full_name?,
 *                  nickname, loginCode?, login_code? } or null
 *   onCancel  — () => void
 *   onSave    — async (fields) => void   // throws on error; caller closes
 */

import { useEffect } from 'react';
import { Modal, Form, Input, Typography } from 'antd';

const { Text } = Typography;

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  }
  return '';
}

export default function EditProfileModal({ open, user, onCancel, onSave }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && user) {
      form.setFieldsValue({
        full_name: pick(user, 'fullName', 'full_name'),
        nickname: pick(user, 'nickname'),
        login_code: pick(user, 'loginCode', 'login_code'),
      });
    }
  }, [open, user, form]);

  async function handleOk() {
    const values = await form.validateFields();
    const fields = {
      full_name: values.full_name.trim(),
      nickname: values.nickname.trim(),
      login_code: values.login_code.trim(),
    };
    await onSave(fields);
  }

  const displayName = pick(user, 'displayName', 'display_name');

  return (
    <Modal
      title="👤 แก้ไขโปรไฟล์ของฉัน"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="บันทึก"
      cancelText="ยกเลิก"
      destroyOnClose
    >
      {displayName && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          บัญชี LINE: <b>{displayName}</b>
        </Text>
      )}
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          label="ชื่อ-สกุล"
          name="full_name"
          rules={[
            { required: true, message: 'กรุณาระบุชื่อ-สกุล' },
            { max: 200, message: 'ชื่อ-สกุลยาวเกินไป' },
          ]}
        >
          <Input placeholder="ชื่อ-สกุล" autoComplete="off" />
        </Form.Item>
        <Form.Item
          label="ชื่อเล่น"
          name="nickname"
          rules={[
            { required: true, message: 'กรุณาระบุชื่อเล่น' },
            { max: 100, message: 'ชื่อเล่นยาวเกินไป' },
          ]}
        >
          <Input placeholder="ชื่อเล่น" autoComplete="off" />
        </Form.Item>
        <Form.Item
          label="รหัสล็อกอิน"
          name="login_code"
          rules={[
            { required: true, message: 'กรุณาระบุรหัสล็อกอิน' },
            { max: 100, message: 'รหัสล็อกอินยาวเกินไป' },
          ]}
        >
          <Input placeholder="เช่น G-3871" autoComplete="off" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
