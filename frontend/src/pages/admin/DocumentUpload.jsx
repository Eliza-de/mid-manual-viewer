/**
 * DocumentUpload — admin upload PDF pages (rebranded)
 */

import { useState } from 'react';
import {
  Card, Form, Input, Button, Typography, Alert, Space, Radio,
  InputNumber, Upload, Progress, message
} from 'antd';
import {
  ArrowLeftOutlined, InboxOutlined, FileImageOutlined,
  CheckCircleOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigation } from '../../hooks/useNavigation.jsx';
import { getIdToken } from '../../api/liff.js';
import { createDocument } from '../../api/admin.js';
import { COLORS } from '../../brand.js';

const { Title, Text } = Typography;
const { Dragger } = Upload;

export default function DocumentUpload() {
  const auth = useAuth();
  const nav = useNavigation();
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fileList, setFileList] = useState([]);

  function beforeUpload(file) {
    const isImage = file.type === 'image/png' || file.type === 'image/jpeg';
    if (!isImage) {
      message.error('รับเฉพาะไฟล์ PNG หรือ JPG');
      return Upload.LIST_IGNORE;
    }
    const isUnder5M = file.size / 1024 / 1024 < 5;
    if (!isUnder5M) {
      message.error(`${file.name} เกิน 5MB`);
      return Upload.LIST_IGNORE;
    }
    return false;
  }

  function handleChange({ fileList: newFileList }) {
    const sorted = [...newFileList].sort((a, b) => {
      const aName = a.name || '';
      const bName = b.name || '';
      return aName.localeCompare(bName, undefined, { numeric: true });
    });
    setFileList(sorted.slice(0, 100));
  }

  async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = reader.result.split(',')[1];
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(values) {
    if (fileList.length === 0) {
      setError('กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setProgress(5);

    try {
      const pages = [];
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i].originFileObj;
        const data = await fileToBase64(f);
        pages.push({ data });
        setProgress(5 + Math.round((i + 1) / fileList.length * 60));
      }

      setProgress(70);

      const idToken = getIdToken();
      const r = await createDocument(idToken, auth.session.token, {
        title: values.title,
        form_code: values.form_code || '',
        category: values.category,
        description: values.description || '',
        sort_order: values.sort_order || 999
      }, pages);

      setProgress(100);

      if (!r.ok) {
        if (r.needsLogin) {
          auth.logout();
          return;
        }
        setError(r.error || 'อัปโหลดไม่สำเร็จ');
        setUploading(false);
        return;
      }

      setSuccess(`เพิ่มเอกสารสำเร็จ: ${r.document.title} (${r.document.page_count} หน้า)`);
      form.resetFields();
      setFileList([]);
      setTimeout(() => setUploading(false), 500);

    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
      setUploading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={topBarStyle}>
        <Button type="text" icon={<ArrowLeftOutlined />}
          onClick={() => nav.goAdminPage('dashboard')} style={{ color: '#fff' }}>กลับ</Button>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>เพิ่มเอกสารใหม่</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={contentStyle}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Title level={5} style={{ margin: 0, color: COLORS.primary }}>📤 อัปโหลดเอกสาร</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  รองรับ PNG/JPG · สูงสุด 100 หน้า · 5MB ต่อไฟล์
                </Text>
              </div>

              {error && <Alert type="error" showIcon message={error} closable onClose={() => setError(null)} />}
              {success && (
                <Alert type="success" showIcon icon={<CheckCircleOutlined />}
                  message={success} closable onClose={() => setSuccess(null)} />
              )}

              {uploading && (
                <Progress percent={progress} status={progress === 100 ? 'success' : 'active'} strokeColor={COLORS.accent} />
              )}

              <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}
                disabled={uploading}>
                <Form.Item label="ชื่อเอกสาร" name="title"
                  rules={[
                    { required: true, message: 'กรุณาระบุชื่อ' },
                    { max: 200, message: 'ชื่อยาวเกินไป' }
                  ]}>
                  <Input placeholder="เช่น คู่มือผู้ใช้ระบบ HR" />
                </Form.Item>

                <Form.Item label="Form Code" name="form_code">
                  <Input maxLength={20} placeholder="เช่น FM-001 (ไม่บังคับ)" />
                </Form.Item>

                <Form.Item label="หมวด" name="category" rules={[{ required: true }]} initialValue="topic">
                  <Radio.Group>
                    <Radio value="full_book">📚 เต็มเล่ม</Radio>
                    <Radio value="topic">📑 เรื่อง</Radio>
                    <Radio value="summary">📋 สรุป</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item label="คำอธิบาย" name="description">
                  <Input.TextArea rows={2} maxLength={500} showCount placeholder="ไม่บังคับ" />
                </Form.Item>

                <Form.Item label="ลำดับการแสดง" name="sort_order" initialValue={999}>
                  <InputNumber min={1} max={9999} style={{ width: 100 }} />
                </Form.Item>

                <Form.Item label={`ไฟล์ (${fileList.length}/100)`} required>
                  <Dragger
                    multiple
                    accept="image/png,image/jpeg"
                    fileList={fileList}
                    beforeUpload={beforeUpload}
                    onChange={handleChange}
                    showUploadList={{
                      showRemoveIcon: !uploading,
                      removeIcon: <DeleteOutlined />
                    }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined style={{ color: COLORS.accent }} />
                    </p>
                    <p className="ant-upload-text" style={{ color: COLORS.primary }}>คลิกหรือลากไฟล์มาเพื่ออัปโหลด</p>
                    <p className="ant-upload-hint">ไฟล์จะเรียงตามชื่อ - ใช้ชื่อ page_001.png, page_002.png...</p>
                  </Dragger>
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit" block loading={uploading} size="large"
                    icon={<FileImageOutlined />}
                    disabled={fileList.length === 0}
                    style={{ background: COLORS.primary, borderColor: COLORS.primary }}>
                    {uploading ? 'กำลังอัปโหลด...' : `อัปโหลด ${fileList.length} ไฟล์`}
                  </Button>
                </Form.Item>
              </Form>
            </Space>
          </Card>
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  position: 'fixed', inset: 0,
  display: 'flex', flexDirection: 'column',
  background: COLORS.bgSoft, zIndex: 100
};

const topBarStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0 12px', background: COLORS.primary,
  height: 52, flexShrink: 0
};

const contentStyle = { padding: 12, flex: 1, overflowY: 'auto' };
