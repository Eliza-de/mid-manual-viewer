/**
 * ReplacePagesModal — Replace pages of an existing document
 *
 * 3 modes:
 *  - replaceOne: replace single page
 *  - append: add pages at end
 *  - replaceAll: wipe + re-upload all
 */

import { useState } from 'react';
import {
  Modal, Radio, Form, InputNumber, Upload, Button, Alert, Progress,
  Typography, Space, message
} from 'antd';
import {
  InboxOutlined, FileImageOutlined, WarningOutlined,
  PlusCircleOutlined, SwapOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.jsx';
import { getIdToken } from '../api/liff.js';
import { replacePage, appendPages, replaceAllPages } from '../api/admin.js';
import { COLORS } from '../brand.js';

const { Text } = Typography;
const { Dragger } = Upload;

export default function ReplacePagesModal({ open, doc, onClose, onSuccess }) {
  const auth = useAuth();
  const [form] = Form.useForm();
  const [mode, setMode] = useState('append');
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  function reset() {
    setMode('append');
    setFileList([]);
    setUploading(false);
    setProgress(0);
    setError(null);
    form.resetFields();
  }

  function handleClose() {
    if (uploading) return;
    reset();
    onClose();
  }

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
    // Limit: replaceOne = 1 file, others = 100
    const max = mode === 'replaceOne' ? 1 : 100;
    setFileList(sorted.slice(0, max));
  }

  async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
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
    setProgress(5);

    try {
      const idToken = getIdToken();
      const sessionToken = auth.session.token;

      if (mode === 'replaceOne') {
        // Single page replacement
        const pageNumber = values.page_number;
        const data = await fileToBase64(fileList[0].originFileObj);
        setProgress(60);

        const r = await replacePage(idToken, sessionToken, doc.id, pageNumber, data);
        setProgress(100);

        if (!r.ok) {
          if (r.needsLogin) auth.logout();
          else setError(r.error || 'แทนที่หน้าไม่สำเร็จ');
          setUploading(false);
          return;
        }

        message.success(`✅ แทนที่หน้า ${pageNumber} สำเร็จ`);
        setTimeout(() => { onSuccess(); reset(); }, 500);

      } else {
        // Multi-page upload (append or replaceAll)
        const pages = [];
        for (let i = 0; i < fileList.length; i++) {
          const f = fileList[i].originFileObj;
          const data = await fileToBase64(f);
          pages.push({ data });
          setProgress(5 + Math.round((i + 1) / fileList.length * 60));
        }
        setProgress(70);

        const r = mode === 'append'
          ? await appendPages(idToken, sessionToken, doc.id, pages)
          : await replaceAllPages(idToken, sessionToken, doc.id, pages);

        setProgress(100);

        if (!r.ok) {
          if (r.needsLogin) auth.logout();
          else setError(r.error || 'อัปโหลดไม่สำเร็จ');
          setUploading(false);
          return;
        }

        const msg = mode === 'append'
          ? `✅ เพิ่ม ${pages.length} หน้าสำเร็จ (รวม ${r.new_page_count} หน้า)`
          : `✅ แทนที่ทั้งหมดสำเร็จ (${pages.length} หน้า)`;
        message.success(msg);
        setTimeout(() => { onSuccess(); reset(); }, 500);
      }

    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
      setUploading(false);
    }
  }

  function handleModeChange(e) {
    setMode(e.target.value);
    setFileList([]);
    setError(null);
    form.resetFields(['page_number']);
  }

  if (!doc) return null;

  return (
    <Modal
      title={<><SwapOutlined /> แก้ไขหน้าเอกสาร</>}
      open={open}
      onCancel={handleClose}
      footer={null}
      width={500}
      maskClosable={!uploading}
      closable={!uploading}
      destroyOnClose
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Document Info */}
        <div style={{
          padding: 12,
          background: COLORS.bgSoft,
          border: `1px solid ${COLORS.brandLight}`,
          borderRadius: 6
        }}>
          <Text strong style={{ color: COLORS.primary }}>{doc.title}</Text>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            ปัจจุบัน {doc.page_count} หน้า
            {doc.form_code && ` · ${doc.form_code}`}
          </div>
        </div>

        {/* Mode selection */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            เลือกวิธี:
          </Text>
          <Radio.Group value={mode} onChange={handleModeChange} disabled={uploading} style={{ width: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio value="append" style={radioStyle}>
                <span style={{ fontWeight: 500 }}>
                  <PlusCircleOutlined style={{ color: COLORS.accent }} /> เพิ่มหน้าท้าย
                </span>
                <div style={subStyle}>เพิ่มหน้าใหม่ต่อจากหน้าสุดท้าย</div>
              </Radio>
              <Radio value="replaceOne" style={radioStyle}>
                <span style={{ fontWeight: 500 }}>
                  <SwapOutlined style={{ color: '#f59e0b' }} /> แทนที่หน้าเดียว
                </span>
                <div style={subStyle}>แก้ไขหน้าใดหน้าหนึ่ง (ระบุเลขหน้า)</div>
              </Radio>
              <Radio value="replaceAll" style={radioStyle}>
                <span style={{ fontWeight: 500 }}>
                  <ReloadOutlined style={{ color: '#ef4444' }} /> แทนที่ทั้งหมด
                </span>
                <div style={subStyle}>ลบหน้าเดิมทั้งหมด + อัปโหลดใหม่</div>
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        {error && <Alert type="error" showIcon message={error} closable onClose={() => setError(null)} />}

        {mode === 'replaceAll' && (
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message="คำเตือน: หน้าเดิมทั้งหมดจะถูกลบ"
            description="การกระทำนี้ไม่สามารถย้อนกลับได้ ตรวจสอบให้แน่ใจก่อนยืนยัน"
          />
        )}

        {uploading && (
          <Progress percent={progress} status={progress === 100 ? 'success' : 'active'} strokeColor={COLORS.accent} />
        )}

        {/* Form */}
        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} disabled={uploading}>
          {mode === 'replaceOne' && (
            <Form.Item
              label={`เลขหน้าที่ต้องการแทนที่ (1-${doc.page_count})`}
              name="page_number"
              rules={[
                { required: true, message: 'กรุณาระบุเลขหน้า' },
                {
                  validator: async (_, v) => {
                    if (v < 1 || v > doc.page_count) {
                      throw new Error(`ต้องอยู่ระหว่าง 1 ถึง ${doc.page_count}`);
                    }
                  }
                }
              ]}
            >
              <InputNumber min={1} max={doc.page_count} style={{ width: 120 }} placeholder="เช่น 5" />
            </Form.Item>
          )}

          <Form.Item
            label={
              mode === 'replaceOne'
                ? 'ไฟล์ใหม่ (1 ไฟล์)'
                : `ไฟล์ (${fileList.length}/100)`
            }
            required
          >
            <Dragger
              multiple={mode !== 'replaceOne'}
              maxCount={mode === 'replaceOne' ? 1 : 100}
              accept="image/png,image/jpeg"
              fileList={fileList}
              beforeUpload={beforeUpload}
              onChange={handleChange}
              showUploadList={{ showRemoveIcon: !uploading }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: COLORS.accent }} />
              </p>
              <p className="ant-upload-text" style={{ color: COLORS.primary }}>
                {mode === 'replaceOne'
                  ? 'คลิกหรือลากไฟล์มา (1 ไฟล์)'
                  : 'คลิกหรือลากไฟล์มา (รองรับหลายไฟล์)'}
              </p>
              <p className="ant-upload-hint" style={{ fontSize: 11 }}>
                {mode !== 'replaceOne' && 'ไฟล์เรียงตามชื่อ - ใช้ page_001.png, page_002.png...'}
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleClose} disabled={uploading}>ยกเลิก</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={uploading}
                icon={<FileImageOutlined />}
                disabled={fileList.length === 0}
                danger={mode === 'replaceAll'}
                style={
                  mode === 'replaceAll'
                    ? undefined
                    : { background: COLORS.primary, borderColor: COLORS.primary }
                }
              >
                {uploading ? 'กำลังอัปโหลด...' : (
                  mode === 'replaceOne' ? 'แทนที่หน้านี้' :
                  mode === 'append' ? `เพิ่ม ${fileList.length} หน้า` :
                  `แทนที่ทั้งหมด (${fileList.length} หน้า)`
                )}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
}

const radioStyle = {
  width: '100%',
  padding: '8px 12px',
  border: `1px solid #e2e8f0`,
  borderRadius: 6,
  marginBottom: 0
};

const subStyle = {
  fontSize: 11,
  color: '#94a3b8',
  marginTop: 2,
  marginLeft: 24
};
