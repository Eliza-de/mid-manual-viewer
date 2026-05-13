/**
 * EditUserModal — admin edits another user's profile fields.
 *
 * Props:
 *   open      — boolean
 *   user      — { display_name, full_name, nickname, login_code, employee_code } or null
 *   onCancel  — () => void
 *   onSave    — async (fields) => void   // throws on error; caller closes
 */

import { useEffect } from 'react';
import { Modal, Form, Input, Typography } from 'antd';

const { Text } = Typography;

export default function EditUserModal({ open, user, onCancel, onSave }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && user) {
      form.setFieldsValue({
        full_name: user.full_name || '',
        nickname: user.nickname || '',
        login_code: user.login_code || '',
        employee_code: user.employee_code || '',
      });
    }
  }, [open, user, form]);

  async function handleOk() {
    const values = await form.validateFields();
    const fields = {
      full_name: values.full_name.trim(),
      nickname: values.nickname.trim(),
      login_code: values.login_code.trim(),
      employee_code: (values.employee_code || '').trim(),
    };
    await onSave(fields);
  }

  return (
    <Modal
      title="✏️ แก้ไขข้อมูลผู้ใช้"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="บันทึก"
      cancelText="ยกเลิก"
      destroyOnClose
    >
      {user && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          กำลังแก้ไข: <b>{user.display_name}</b>
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
        <Form.Item
          label="รหัสพนักงาน (optional)"
          name="employee_code"
          rules={[{ max: 100, message: 'รหัสพนักงานยาวเกินไป' }]}
        >
          <Input placeholder="รหัสพนักงาน" autoComplete="off" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
