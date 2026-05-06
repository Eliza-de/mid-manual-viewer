/**
 * DocumentUpload — admin upload form for new documents
 *
 * Reads PNG files, converts to base64, sends batch to backend.
 */

import { useState } from 'react';
import {
  Button, Card, Input, Radio, InputNumber, Upload,
  Typography, Space, Divider, message, List
} from 'antd';
import {
  ArrowLeftOutlined,
  CloudUploadOutlined,
  InboxOutlined,
  FileImageOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigation } from '../../hooks/useNavigation.jsx';
import { createDocument } from '../../api/admin.js';
import { getIdToken } from '../../api/liff.js';
import UploadProgress from '../../components/UploadProgress.jsx';

const { Title, Text } = Typography;

export default function DocumentUpload() {
  const auth = useAuth();
  const nav = useNavigation();

  // Form state
  const [title, setTitle] = useState('');
  const [formCode, setFormCode] = useState('');
  const [category, setCategory] = useState('topic');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [files, setFiles] = useState([]);   // [{ file, name, size }]

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState('');

  function onPickFiles(info) {
    // antd Upload's beforeUpload pattern — collect, don't actually upload yet
    return false;
  }

  function beforeUpload(file) {
    if (!file.type.startsWith('image/png')) {
      message.error('รองรับเฉพาะไฟล์ PNG');
      return Upload.LIST_IGNORE;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('ไฟล์ใหญ่เกิน 5MB: ' + file.name);
      return Upload.LIST_IGNORE;
    }
    setFiles(prev => {
      // Avoid dup
      if (prev.find(f => f.name === file.name && f.size === file.size)) return prev;
      return [...prev, { file, name: file.name, size: file.size }];
    });
    return false;   // prevent automatic upload
  }

  function removeFile(name) {
    setFiles(prev => prev.filter(f => f.name !== name));
  }

  function sortFiles() {
    setFiles(prev =>
      [...prev].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    );
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const result = r.result;
        // strip "data:image/png;base64," prefix
        const idx = result.indexOf(',');
        resolve(idx >= 0 ? result.slice(idx + 1) : result);
      };
      r.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ: ' + file.name));
      r.readAsDataURL(file);
    });
  }

  async function onSubmit() {
    // Validation
    if (!title.trim()) {
      message.error('กรุณาระบุชื่อเอกสาร');
      return;
    }
    if (files.length === 0) {
      message.error('กรุณาเลือกไฟล์ PNG อย่างน้อย 1 ไฟล์');
      return;
    }
    if (files.length > 100) {
      message.error('อัปโหลดได้สูงสุด 100 หน้าต่อครั้ง');
      return;
    }

    // Sort files by name (page_001, page_002, ...)
    const sorted = [...files].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );

    setUploading(true);
    setProgress(0);
    setErrorText('');
    setStatusText('กำลังอ่านไฟล์...');

    try {
      // Read all files to base64 (with progress)
      const pages = [];
      for (let i = 0; i < sorted.length; i++) {
        const f = sorted[i];
        setStatusText(`อ่าน ${f.name} (${i + 1}/${sorted.length})`);
        const data = await readFileAsBase64(f.file);
        pages.push({ filename: f.name, data });
        setProgress(Math.round(((i + 1) / sorted.length) * 60));   // 0-60% for reading
      }

      setStatusText('กำลังส่งข้อมูลไปยัง server...');
      setProgress(70);

      const idToken = getIdToken();
      const r = await createDocument(idToken, auth.session.token, {
        title: title.trim(),
        form_code: formCode.trim(),
        category: category,
        description: description.trim(),
        sort_order: sortOrder
      }, pages);

      setProgress(95);

      if (!r.ok) {
        if (r.needsLogin) {
          auth.logout();
          return;
        }
        setErrorText(r.error || 'อัปโหลดไม่สำเร็จ');
        return;
      }

      setProgress(100);
      setStatusText('สำเร็จ! กำลังกลับไปหน้าเอกสาร...');

      // Brief pause then close
      setTimeout(() => {
        message.success('เพิ่มเอกสาร "' + r.document.title + '" สำเร็จ ');
        setUploading(false);
        nav.closeAdmin();   // back to home
      }, 800);
    } catch (err) {
      setErrorText(err.message || 'เกิดข้อผิดพลาด');
    }
  }

  function dismissError() {
    setUploading(false);
    setErrorText('');
  }

  return (
    <div style={pageStyle}>
      {/* Top bar */}
      <div style={topBarStyle}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => nav.goAdminPage('dashboard')}
          style={{ color: '#fff' }}
        >
          กลับ
        </Button>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
          เพิ่มเอกสารใหม่
        </div>
        <div style={{ width: 60 }} />
      </div>

      <div style={contentStyle}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* Title */}
              <div>
                <Text strong>ชื่อเอกสาร <Text type="danger">*</Text></Text>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="เช่น ใบรายงานตรวจเช็คบำรุงรักษา"
                  maxLength={200}
                  style={{ marginTop: 4 }}
                />
              </div>

              {/* Form Code */}
              <div>
                <Text strong>Form Code</Text>
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                  ไม่บังคับ
                </Text>
                <Input
                  value={formCode}
                  onChange={e => setFormCode(e.target.value)}
                  placeholder="F-MID-XXX"
                  maxLength={20}
                  style={{ marginTop: 4 }}
                />
              </div>

              {/* Category */}
              <div>
                <Text strong>หมวด <Text type="danger">*</Text></Text>
                <Radio.Group
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ marginTop: 6, display: 'block' }}
                >
                  <Radio value="full_book">📚 เต็มเล่ม</Radio>
                  <Radio value="topic">📑 เรื่อง</Radio>
                  <Radio value="summary">📋 สรุป</Radio>
                </Radio.Group>
              </div>

              {/* Description */}
              <div>
                <Text strong>คำอธิบาย</Text>
                <Input.TextArea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  showCount
                  style={{ marginTop: 4 }}
                />
              </div>

              {/* Sort Order */}
              <div>
                <Text strong>ลำดับการแสดง</Text>
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                  เลขน้อย = แสดงก่อน
                </Text>
                <InputNumber
                  value={sortOrder}
                  onChange={setSortOrder}
                  min={1}
                  max={9999}
                  style={{ width: 100, marginTop: 4, display: 'block' }}
                />
              </div>

              <Divider style={{ margin: '8px 0' }} />

              {/* File picker */}
              <div>
                <Text strong>
                  ไฟล์ PNG <Text type="danger">*</Text>
                </Text>
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                  เลือกไฟล์ตั้งชื่อ page_001.png, page_002.png, ...
                </Text>
                <Upload.Dragger
                  multiple
                  accept="image/png"
                  beforeUpload={beforeUpload}
                  showUploadList={false}
                  style={{ marginTop: 8 }}
                >
                  <p>
                    <InboxOutlined style={{ fontSize: 32, color: '#1e3a5f' }} />
                  </p>
                  <p style={{ fontSize: 13 }}>คลิกหรือลากไฟล์ PNG มาที่นี่</p>
                  <p style={{ fontSize: 11, color: '#94a3b8' }}>
                    รองรับหลายไฟล์ ขนาดสูงสุด 5MB ต่อไฟล์
                  </p>
                </Upload.Dragger>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8
                  }}>
                    <Text strong>ไฟล์ที่เลือก: {files.length}</Text>
                    <Button size="small" onClick={sortFiles}>
                      เรียงตามชื่อ
                    </Button>
                  </div>
                  <List
                    size="small"
                    bordered
                    dataSource={files}
                    style={{ maxHeight: 200, overflowY: 'auto' }}
                    renderItem={f => (
                      <List.Item
                        actions={[
                          <Button
                            key="del"
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeFile(f.name)}
                          />
                        ]}
                      >
                        <Space>
                          <FileImageOutlined style={{ color: '#1e3a5f' }} />
                          <span style={{ fontSize: 12 }}>{f.name}</span>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {(f.size / 1024).toFixed(0)} KB
                          </Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </Space>
          </Card>

          {/* Submit */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Button
              size="large"
              onClick={() => nav.goAdminPage('dashboard')}
              style={{ flex: 1 }}
            >
              ยกเลิก
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CloudUploadOutlined />}
              onClick={onSubmit}
              disabled={!title.trim() || files.length === 0}
              style={{ flex: 2 }}
            >
              อัปโหลด {files.length > 0 ? `(${files.length} หน้า)` : ''}
            </Button>
          </div>
        </div>
      </div>

      {/* Progress modal */}
      <UploadProgress
        open={uploading}
        percent={progress}
        statusText={statusText}
        errorText={errorText}
      />

      {/* Allow dismiss on error */}
      {errorText && uploading && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 2000
        }}>
          <Button onClick={dismissError}>ปิด</Button>
        </div>
      )}
    </div>
  );
}

const pageStyle = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  background: '#f5f7fa',
  zIndex: 100
};

const topBarStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 12px',
  background: '#1e3a5f',
  height: 52,
  flexShrink: 0
};

const contentStyle = {
  padding: 16,
  flex: 1,
  overflowY: 'auto'
};
