/**
 * DocumentUpload — LIFF mobile admin
 *
 * รองรับสองโหมด:
 *   - PNG/JPG หลายหน้า (โหมดเดิม)
 *   - วิดีโอ MP4/WebM ไฟล์เดียว + โปสเตอร์ (เลือกได้) — เฉพาะหมวด "คลิปความรู้"
 */

import { useEffect, useRef, useState } from 'react';
import {
  Form, Input, Button, Typography, Alert, Space, Radio,
  InputNumber, Upload, Progress, message
} from 'antd';
import {
  ArrowLeftOutlined, InboxOutlined, FileImageOutlined,
  CheckCircleOutlined, DeleteOutlined,
  VideoCameraOutlined, PictureOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigation } from '../../hooks/useNavigation.jsx';
import { getIdToken } from '../../api/liff.js';
import { createDocument, createVideoDocument } from '../../api/admin.js';
import { COLORS } from '../../brand.js';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
const POSTER_MAX_BYTES = 2 * 1024 * 1024;

function formatMB(bytes) { return (bytes / 1024 / 1024).toFixed(1) + ' MB'; }
function formatDuration(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function probeVideoDuration(file) {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    const url = URL.createObjectURL(file);
    let resolved = false;
    const cleanup = () => { URL.revokeObjectURL(url); v.removeAttribute('src'); v.load(); };
    const done = (d) => { if (!resolved) { resolved = true; cleanup(); resolve(d); } };
    v.onloadedmetadata = () => done(isFinite(v.duration) ? v.duration : 0);
    v.onerror = () => done(0);
    setTimeout(() => done(0), 5000);
    v.src = url;
  });
}

export default function DocumentUpload() {
  const auth = useAuth();
  const nav = useNavigation();
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [fileList, setFileList] = useState([]);

  const [contentMode, setContentMode] = useState('pages');
  const [category, setCategory] = useState('topic');
  const [videoFile, setVideoFile] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const posterPreviewRef = useRef(null);

  useEffect(() => {
    if (category !== 'summary' && contentMode === 'video') setContentMode('pages');
  }, [category, contentMode]);

  useEffect(() => () => {
    if (posterPreviewRef.current) URL.revokeObjectURL(posterPreviewRef.current);
  }, []);

  function beforeUploadImage(file) {
    const isImage = file.type === 'image/png' || file.type === 'image/jpeg';
    if (!isImage) { message.error('รับเฉพาะ PNG/JPG'); return Upload.LIST_IGNORE; }
    if (file.size / 1024 / 1024 >= 5) { message.error(`${file.name} เกิน 5MB`); return Upload.LIST_IGNORE; }
    return false;
  }

  function handlePagesChange({ fileList: newFileList }) {
    const sorted = [...newFileList].sort((a, b) => {
      const aName = a.name || ''; const bName = b.name || '';
      return aName.localeCompare(bName, undefined, { numeric: true });
    });
    setFileList(sorted.slice(0, 100));
  }

  async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleVideoSelect(e) {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    if (!['video/mp4', 'video/webm'].includes(file.type)) { message.error('รับเฉพาะ MP4/WebM'); return; }
    if (file.size > VIDEO_MAX_BYTES) { message.error(`ไฟล์เกิน 50 MB (${formatMB(file.size)})`); return; }
    const duration = await probeVideoDuration(file);
    setVideoFile(file);
    setVideoDuration(duration);
  }

  function handlePosterSelect(e) {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { message.error('รับ JPG/PNG/WebP'); return; }
    if (file.size > POSTER_MAX_BYTES) { message.error(`โปสเตอร์เกิน 2 MB (${formatMB(file.size)})`); return; }
    if (posterPreviewRef.current) URL.revokeObjectURL(posterPreviewRef.current);
    const url = URL.createObjectURL(file);
    posterPreviewRef.current = url;
    setPosterFile(file);
    setPosterPreview(url);
  }

  function clearVideo() { setVideoFile(null); setVideoDuration(0); }
  function clearPoster() {
    if (posterPreviewRef.current) URL.revokeObjectURL(posterPreviewRef.current);
    posterPreviewRef.current = null;
    setPosterFile(null);
    setPosterPreview(null);
  }

  async function handleSubmit(values) {
    setError(null); setSuccess(null);

    if (contentMode === 'video') {
      if (!videoFile) { setError('กรุณาเลือกไฟล์วิดีโอ'); return; }
      if (values.category !== 'summary') { setError('วิดีโอใช้ได้เฉพาะหมวด "คลิปความรู้"'); return; }
    } else {
      if (fileList.length === 0) { setError('กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์'); return; }
    }

    setUploading(true); setProgress(5);
    const idToken = getIdToken();

    try {
      let r;
      if (contentMode === 'video') {
        setProgress(40);
        r = await createVideoDocument(idToken, auth.session.token, {
          title: values.title,
          form_code: values.form_code || '',
          description: values.description || '',
          sort_order: values.sort_order || 999,
        }, videoFile, posterFile, videoDuration);
      } else {
        const pages = [];
        for (let i = 0; i < fileList.length; i++) {
          const f = fileList[i].originFileObj;
          const data = await fileToBase64(f);
          pages.push({ data });
          setProgress(5 + Math.round((i + 1) / fileList.length * 60));
        }
        setProgress(70);
        r = await createDocument(idToken, auth.session.token, {
          title: values.title,
          form_code: values.form_code || '',
          category: values.category,
          description: values.description || '',
          sort_order: values.sort_order || 999
        }, pages);
      }

      setProgress(100);

      if (!r.ok) {
        if (r.needsLogin) { auth.logout(); return; }
        setError(r.error || 'อัปโหลดไม่สำเร็จ');
        setUploading(false);
        return;
      }

      const doc = r.document || {};
      const detail = doc.media_type === 'video'
        ? `วิดีโอ ${formatMB(doc.video_size || 0)}${doc.video_duration_sec ? ` · ${formatDuration(doc.video_duration_sec)}` : ''}`
        : (doc.page_count ? `${doc.page_count} หน้า` : '');
      setSuccess(`เพิ่มเอกสารสำเร็จ: ${doc.title}${detail ? ` (${detail})` : ''}`);

      form.resetFields();
      setFileList([]);
      clearVideo(); clearPoster();
      setContentMode('pages');
      setTimeout(() => setUploading(false), 500);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
      setUploading(false);
    }
  }

  const canSubmit = !uploading && (contentMode === 'video' ? !!videoFile : fileList.length > 0);

  return (
    <div style={pageStyle}>
      <div style={topBarStyle}>
        <div style={iconBtnStyle} onClick={() => nav.goAdminPage('dashboard')} role="button">
          <ArrowLeftOutlined style={{ fontSize: 18 }} />
        </div>
        <div style={titleStyle}>เพิ่มเอกสารใหม่</div>
        <div style={{ width: 36 }} />
      </div>

      <div style={contentStyle}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={cardStyle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Title level={5} style={{ margin: 0, color: COLORS.primary }}>
                  {contentMode === 'video' ? '🎬 อัปโหลดวิดีโอคลิปความรู้' : '📤 อัปโหลดเอกสาร'}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {contentMode === 'video'
                    ? 'MP4/WebM · สูงสุด 50 MB · โปสเตอร์ ≤ 2 MB'
                    : 'รองรับ PNG/JPG · สูงสุด 100 หน้า · 5MB ต่อไฟล์'}
                </Text>
              </div>

              {error && <Alert type="error" showIcon message={error} closable onClose={() => setError(null)} style={{ borderRadius: 10 }} />}
              {success && (
                <Alert type="success" showIcon icon={<CheckCircleOutlined />}
                  message={success} closable onClose={() => setSuccess(null)} style={{ borderRadius: 10 }} />
              )}

              {uploading && (
                <Progress
                  percent={progress}
                  status={progress === 100 ? 'success' : 'active'}
                  strokeColor={COLORS.primary}
                />
              )}

              <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}
                disabled={uploading}
                onValuesChange={(changed) => {
                  if (changed.category !== undefined) setCategory(changed.category);
                }}>
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
                    <Radio value="full_book">เล่ม</Radio>
                    <Radio value="topic">บท</Radio>
                    <Radio value="summary">คลิปความรู้</Radio>
                  </Radio.Group>
                </Form.Item>

                {category === 'summary' && (
                  <Form.Item label="เนื้อหา">
                    <Radio.Group
                      value={contentMode}
                      onChange={(e) => setContentMode(e.target.value)}
                      buttonStyle="solid"
                      disabled={uploading}
                    >
                      <Radio.Button value="pages"><PictureOutlined /> รูปภาพ</Radio.Button>
                      <Radio.Button value="video"><VideoCameraOutlined /> วิดีโอ</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                )}

                <Form.Item label="คำอธิบาย" name="description">
                  <Input.TextArea rows={2} maxLength={500} showCount placeholder="ไม่บังคับ" />
                </Form.Item>

                <Form.Item label="ลำดับการแสดง" name="sort_order" initialValue={999}>
                  <InputNumber min={1} max={9999} style={{ width: 100 }} />
                </Form.Item>

                {contentMode === 'video' ? (
                  <VideoPicker
                    videoFile={videoFile}
                    videoDuration={videoDuration}
                    onPick={handleVideoSelect}
                    onClear={clearVideo}
                    posterFile={posterFile}
                    posterPreview={posterPreview}
                    onPickPoster={handlePosterSelect}
                    onClearPoster={clearPoster}
                    disabled={uploading}
                  />
                ) : (
                  <Form.Item label={`ไฟล์ (${fileList.length}/100)`} required>
                    <Dragger
                      multiple
                      accept="image/png,image/jpeg"
                      fileList={fileList}
                      beforeUpload={beforeUploadImage}
                      onChange={handlePagesChange}
                      showUploadList={{
                        showRemoveIcon: !uploading,
                        removeIcon: <DeleteOutlined />
                      }}
                    >
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined style={{ color: '#5DBFA0' }} />
                      </p>
                      <p className="ant-upload-text" style={{ color: COLORS.primary }}>คลิกหรือลากไฟล์มาเพื่ออัปโหลด</p>
                      <p className="ant-upload-hint" style={{ fontSize: 11 }}>ไฟล์จะเรียงตามชื่อ - ใช้ชื่อ page_001.png, page_002.png...</p>
                    </Dragger>
                  </Form.Item>
                )}

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={uploading}
                    size="large"
                    icon={contentMode === 'video' ? <VideoCameraOutlined /> : <FileImageOutlined />}
                    disabled={!canSubmit}
                    style={canSubmit ? primaryBtnStyle : disabledBtnStyle}
                  >
                    {uploading
                      ? 'กำลังอัปโหลด...'
                      : contentMode === 'video'
                        ? (videoFile ? `อัปโหลดวิดีโอ (${formatMB(videoFile.size)})` : 'เลือกวิดีโอก่อน')
                        : `อัปโหลด ${fileList.length} ไฟล์`}
                  </Button>
                </Form.Item>
              </Form>
            </Space>
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoPicker({
  videoFile, videoDuration, onPick, onClear,
  posterFile, posterPreview, onPickPoster, onClearPoster,
  disabled
}) {
  const videoInputRef = useRef(null);
  const posterInputRef = useRef(null);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={pickerLabel}>ไฟล์วิดีโอ *</div>
        {!videoFile ? (
          <div style={pickerBox} onClick={() => !disabled && videoInputRef.current?.click()} role="button">
            <VideoCameraOutlined style={{ fontSize: 32, color: '#5DBFA0' }} />
            <div style={{ color: COLORS.primary, fontWeight: 500, marginTop: 6 }}>คลิกเลือกวิดีโอ</div>
            <div style={{ fontSize: 11, color: '#6B8278', marginTop: 2 }}>MP4 / WebM · สูงสุด 50 MB</div>
          </div>
        ) : (
          <div style={selectedFileBox}>
            <VideoCameraOutlined style={{ color: COLORS.primary, fontSize: 18 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, color: COLORS.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                {videoFile.name}
              </div>
              <div style={{ fontSize: 11, color: '#6B8278' }}>
                {formatMB(videoFile.size)}{videoDuration ? ` · ${formatDuration(videoDuration)}` : ''}
              </div>
            </div>
            <Button size="small" icon={<DeleteOutlined />} onClick={onClear} disabled={disabled} />
          </div>
        )}
        <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" style={{ display: 'none' }} onChange={onPick} />
      </div>

      <div>
        <div style={pickerLabel}>โปสเตอร์ (ภาพปก) — ไม่บังคับ</div>
        {!posterFile ? (
          <div style={pickerBox} onClick={() => !disabled && posterInputRef.current?.click()} role="button">
            <PictureOutlined style={{ fontSize: 28, color: '#5DBFA0' }} />
            <div style={{ color: COLORS.primary, fontWeight: 500, marginTop: 6 }}>เลือกภาพปก</div>
            <div style={{ fontSize: 11, color: '#6B8278', marginTop: 2 }}>JPG / PNG / WebP · ≤ 2 MB</div>
          </div>
        ) : (
          <div style={selectedFileBox}>
            {posterPreview && (
              <img src={posterPreview} alt="" style={{ width: 40, height: 50, objectFit: 'cover', borderRadius: 6 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, color: COLORS.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                {posterFile.name}
              </div>
              <div style={{ fontSize: 11, color: '#6B8278' }}>{formatMB(posterFile.size)}</div>
            </div>
            <Button size="small" icon={<DeleteOutlined />} onClick={onClearPoster} disabled={disabled} />
          </div>
        )}
        <input ref={posterInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={onPickPoster} />
      </div>
    </div>
  );
}

const pickerLabel = { fontSize: 13, color: COLORS.primary, marginBottom: 6, fontWeight: 500 };

const pickerBox = {
  background: '#F0F9F3',
  border: '1.5px dashed #5DBFA0',
  borderRadius: 10,
  padding: '16px 12px',
  textAlign: 'center',
  cursor: 'pointer',
};

const selectedFileBox = {
  background: '#F0F9F3',
  border: '1px solid #5DBFA0',
  borderRadius: 10,
  padding: '8px 10px',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const pageStyle = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  background: COLORS.bgSoft,
  zIndex: 100
};

const topBarStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 14px',
  background: `linear-gradient(135deg, #5DBFA0 0%, ${COLORS.primary} 100%)`,
  height: 56,
  flexShrink: 0,
  boxShadow: '0 2px 8px rgba(31,77,63,0.12)'
};

const iconBtnStyle = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: 'rgba(255,255,255,0.18)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0
};

const titleStyle = {
  color: 'white',
  fontWeight: 600,
  fontSize: 16,
  flex: 1,
  textAlign: 'center'
};

const contentStyle = {
  padding: 12,
  flex: 1,
  overflowY: 'auto'
};

const cardStyle = {
  background: 'white',
  borderRadius: 14,
  padding: 16,
  border: '0.5px solid rgba(31,77,63,0.08)',
  boxShadow: '0 1px 3px rgba(31,77,63,0.04)'
};

const primaryBtnStyle = {
  background: COLORS.primary,
  borderColor: COLORS.primary,
  color: 'white',
  fontWeight: 500,
  height: 44
};

const disabledBtnStyle = {
  background: '#E5E7EB',
  borderColor: '#E5E7EB',
  color: '#9CA3AF',
  fontWeight: 500,
  height: 44
};
