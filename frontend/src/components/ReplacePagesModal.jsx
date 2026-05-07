/**
 * ReplacePagesModal — VERSION 2 REDESIGN (Lean Buddy mint sage)
 * BUILD: 2026-05-07-V2-REPLACE
 *
 * Changes from V1:
 *   - Submit button: visible disabled state (gray, not invisible green)
 *   - Cleaner radio cards
 *   - Same upload logic
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
  // V2 marker
  if (typeof window !== 'undefined' && open && !window.__replace_v2_loaded) {
    console.log('%c[ReplacePagesModal V2 LOADED]', 'background:#1F4D3F;color:#A4DFCB;padding:4px 8px;border-radius:4px');
    window.__replace_v2_loaded = true;
  }

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
          else setError(r.error || 'อัพโหลดไม่สำเร็จ');
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

  const canSubmit = fileList.length > 0 && !uploading;
  const submitText = uploading ? 'กำลังอัปโหลด...' : (
    mode === 'replaceOne' ? 'แทนที่หน้านี้' :
    mode === 'append' ? `เพิ่ม ${fileList.length} หน้า` :
    `แทนที่ทั้งหมด (${fileList.length} หน้า)`
  );

  // Button style — danger for replaceAll, primary otherwise, disabled gray
  function getSubmitStyle() {
    if (!canSubmit) return disabledBtnStyle;
    if (mode === 'replaceAll') {
      return {
        background: '#EF4444',
        borderColor: '#EF4444',
        color: 'white',
        fontWeight: 500
      };
    }
    return primaryBtnStyle;
  }

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
        {/* Document info */}
        <div style={docInfoStyle}>
          <Text strong style={{ color: COLORS.primary, fontSize: 14 }}>{doc.title}</Text>
          <div style={{ fontSize: 12, color: '#6B8278', marginTop: 4 }}>
            ปัจจุบัน {doc.page_count} หน้า
            {doc.form_code && ` · ${doc.form_code}`}
          </div>
        </div>

        {/* Mode selection */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8, color: COLORS.primary }}>
            เลือกวิธี:
          </Text>
          <Radio.Group value={mode} onChange={handleModeChange} disabled={uploading} style={{ width: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio value="append" style={getRadioStyle(mode === 'append')}>
                <span style={{ fontWeight: 500 }}>
                  <PlusCircleOutlined style={{ color: '#5DBFA0' }} /> เพิ่มหน้าท้าย
                </span>
                <div style={subStyle}>เพิ่มหน้าใหม่ต่อจากหน้าสุดท้าย</div>
              </Radio>
              <Radio value="replaceOne" style={getRadioStyle(mode === 'replaceOne')}>
                <span style={{ fontWeight: 500 }}>
                  <SwapOutlined style={{ color: '#E8965B' }} /> แทนที่หน้าเดียว
                </span>
                <div style={subStyle}>แก้ไขหน้าใดหน้าหนึ่ง (ระบุเลขหน้า)</div>
              </Radio>
              <Radio value="replaceAll" style={getRadioStyle(mode === 'replaceAll')}>
                <span style={{ fontWeight: 500 }}>
                  <ReloadOutlined style={{ color: '#EF4444' }} /> แทนที่ทั้งหมด
                </span>
                <div style={subStyle}>ลบหน้าเดิมทั้งหมด + อัปโหลดใหม่</div>
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        {error && <Alert type="error" showIcon message={error} closable onClose={() => setError(null)} style={{ borderRadius: 10 }} />}

        {mode === 'replaceAll' && (
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message="คำเตือน: หน้าเดิมทั้งหมดจะถูกลบ"
            description="การกระทำนี้ไม่สามารถย้อนกลับได้ ตรวจสอบให้แน่ใจก่อนยืนยัน"
            style={{ borderRadius: 10 }}
          />
        )}

        {uploading && (
          <Progress percent={progress} status={progress === 100 ? 'success' : 'active'} strokeColor={COLORS.primary} />
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
                <InboxOutlined style={{ color: '#5DBFA0' }} />
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
              <Button onClick={handleClose} disabled={uploading} style={{ borderRadius: 10 }}>
                ยกเลิก
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={uploading}
                icon={<FileImageOutlined />}
                disabled={!canSubmit}
                style={getSubmitStyle()}
              >
                {submitText}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
}

// ===== Styles =====

const docInfoStyle = {
  padding: 14,
  background: COLORS.bgSoft,
  border: `0.5px solid rgba(31,77,63,0.12)`,
  borderRadius: 12
};

function getRadioStyle(isActive) {
  return {
    width: '100%',
    padding: '10px 14px',
    border: isActive
      ? `0.5px solid ${COLORS.primary}`
      : '0.5px solid rgba(31,77,63,0.08)',
    background: isActive ? COLORS.bgSoft : 'white',
    borderRadius: 12,
    marginBottom: 0,
    transition: 'all 0.15s'
  };
}

const subStyle = {
  fontSize: 11,
  color: '#6B8278',
  marginTop: 2,
  marginLeft: 24
};

// Primary button — strong green with WHITE text
const primaryBtnStyle = {
  background: COLORS.primary,
  borderColor: COLORS.primary,
  color: 'white',
  fontWeight: 500,
  borderRadius: 10
};

// Disabled button — light gray with VISIBLE gray text
const disabledBtnStyle = {
  background: '#E5E7EB',
  borderColor: '#E5E7EB',
  color: '#9CA3AF',
  fontWeight: 500,
  borderRadius: 10
};
