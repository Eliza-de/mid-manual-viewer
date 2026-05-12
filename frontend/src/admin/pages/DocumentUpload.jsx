/**
 * DocumentUpload — Admin console
 *
 * เพิ่มเอกสารใหม่ — multipart upload (PNG/JPG, สูงสุด 100 หน้า, 5MB/ไฟล์)
 */
import { useState } from 'react';
import {
  Form, Input, Button, Typography, Alert, Space, Radio,
  InputNumber, Upload, Progress, message,
} from 'antd';
import {
  InboxOutlined, FileImageOutlined, CheckCircleOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { createDocument } from '../api/admin';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const MINT_DARK = '#1F4D3F';
const MINT_MID = '#5DBFA0';
const MINT_SOFT = '#DCEEE3';
const MINT_MUTED = '#6B8278';

export default function DocumentUpload({ onNavigate }) {
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

  async function handleSubmit(values) {
    if (fileList.length === 0) {
      setError('กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setProgress(15);

    try {
      const files = fileList.map(f => f.originFileObj).filter(Boolean);
      setProgress(40);

      const r = await createDocument({
        title: values.title,
        form_code: values.form_code || '',
        category: values.category,
        description: values.description || '',
        sort_order: values.sort_order || 999,
      }, files);

      setProgress(100);

      const doc = r.document || {};
      setSuccess(`เพิ่มเอกสารสำเร็จ: ${doc.title || values.title}${doc.page_count ? ` (${doc.page_count} หน้า)` : ''}`);
      form.resetFields();
      setFileList([]);
      setTimeout(() => setUploading(false), 500);
    } catch (err) {
      setError(err.message || 'อัปโหลดไม่สำเร็จ');
      setUploading(false);
    }
  }

  const canSubmit = fileList.length > 0 && !uploading;

  return (
    <div>
      <div style={pageHeaderStyle}>
        <h1 style={pageTitleStyle}>📤 เพิ่มเอกสารใหม่</h1>
        {onNavigate && (
          <Button onClick={() => onNavigate('documents')}>ไปจัดการเอกสาร →</Button>
        )}
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={cardStyle}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Title level={5} style={{ margin: 0, color: MINT_DARK }}>📤 อัปโหลดเอกสาร</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                รองรับ PNG/JPG · สูงสุด 100 หน้า · 5MB ต่อไฟล์
              </Text>
            </div>

            {error && (
              <Alert type="error" showIcon message={error} closable
                onClose={() => setError(null)} style={{ borderRadius: 10 }} />
            )}
            {success && (
              <Alert type="success" showIcon icon={<CheckCircleOutlined />}
                message={success} closable
                onClose={() => setSuccess(null)} style={{ borderRadius: 10 }} />
            )}

            {uploading && (
              <Progress
                percent={progress}
                status={progress === 100 ? 'success' : 'active'}
                strokeColor={MINT_DARK}
              />
            )}

            <Form form={form} layout="vertical" onFinish={handleSubmit}
              requiredMark={false} disabled={uploading}>
              <Form.Item label="ชื่อเอกสาร" name="title"
                rules={[
                  { required: true, message: 'กรุณาระบุชื่อ' },
                  { max: 200, message: 'ชื่อยาวเกินไป' },
                ]}>
                <Input placeholder="เช่น คู่มือผู้ใช้ระบบ HR" />
              </Form.Item>

              <Form.Item label="Form Code" name="form_code">
                <Input maxLength={20} placeholder="เช่น FM-001 (ไม่บังคับ)" />
              </Form.Item>

              <Form.Item label="หมวด" name="category" rules={[{ required: true }]} initialValue="topic">
                <Radio.Group>
                  <Radio value="full_book">เล่ม</Radio>
                  <Radio value="topic">บท</Radio>
                  <Radio value="summary">รีวิว</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item label="คำอธิบาย" name="description">
                <Input.TextArea rows={2} maxLength={500} showCount placeholder="ไม่บังคับ" />
              </Form.Item>

              <Form.Item label="ลำดับการแสดง" name="sort_order" initialValue={999}>
                <InputNumber min={1} max={9999} style={{ width: 120 }} />
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
                    removeIcon: <DeleteOutlined />,
                  }}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ color: MINT_MID }} />
                  </p>
                  <p className="ant-upload-text" style={{ color: MINT_DARK }}>
                    คลิกหรือลากไฟล์มาเพื่ออัปโหลด
                  </p>
                  <p className="ant-upload-hint" style={{ fontSize: 11 }}>
                    ไฟล์จะเรียงตามชื่อ — ใช้ชื่อ page_001.png, page_002.png...
                  </p>
                </Dragger>
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={uploading}
                  size="large"
                  icon={<FileImageOutlined />}
                  disabled={!canSubmit}
                  style={canSubmit
                    ? { background: MINT_DARK, borderColor: MINT_DARK, height: 44, fontWeight: 500 }
                    : { background: '#E5E7EB', borderColor: '#E5E7EB', color: '#9CA3AF', height: 44, fontWeight: 500 }}
                >
                  {uploading ? 'กำลังอัปโหลด...' : `อัปโหลด ${fileList.length} ไฟล์`}
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </div>
      </div>
    </div>
  );
}

const pageHeaderStyle = {
  background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 16,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  flexWrap: 'wrap', gap: 12,
  border: '0.5px solid rgba(31,77,63,0.08)',
  boxShadow: '0 1px 3px rgba(31,77,63,0.06)',
};

const pageTitleStyle = { margin: 0, fontSize: 22, fontWeight: 700, color: MINT_DARK };

const cardStyle = {
  background: '#fff', borderRadius: 14, padding: 24,
  border: '0.5px solid rgba(31,77,63,0.08)',
  boxShadow: '0 1px 3px rgba(31,77,63,0.04)',
};
