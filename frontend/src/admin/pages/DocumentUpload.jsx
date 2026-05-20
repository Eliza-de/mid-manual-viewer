/**
 * DocumentUpload — Admin console
 *
 * เพิ่มเอกสารใหม่ — รองรับสองโหมด:
 *   - PNG/JPG หลายหน้า (โหมดเดิม) สำหรับหมวด เล่ม / บท / คลิปความรู้
 *   - วิดีโอ MP4/WebM ไฟล์เดียว + โปสเตอร์ (เลือกได้) เฉพาะหมวด "คลิปความรู้"
 */
import { useEffect, useRef, useState } from 'react';
import {
  Form, Input, Button, Typography, Alert, Radio,
  InputNumber, Upload, Progress, message,
} from 'antd';
import {
  InboxOutlined, FileImageOutlined, CheckCircleOutlined, DeleteOutlined,
  VideoCameraOutlined, PictureOutlined,
} from '@ant-design/icons';
import { createDocument, createVideoDocument } from '../api/admin';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const MINT_DARK = '#1F4D3F';
const MINT_MID = '#5DBFA0';
const MINT_SOFT = '#DCEEE3';

const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
const POSTER_MAX_BYTES = 2 * 1024 * 1024;

function formatMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function formatDuration(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// Read <video>.duration off a File without uploading it
function probeVideoDuration(file) {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    const url = URL.createObjectURL(file);
    let resolved = false;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      v.removeAttribute('src');
      v.load();
    };
    const done = (d) => { if (!resolved) { resolved = true; cleanup(); resolve(d); } };
    v.onloadedmetadata = () => done(isFinite(v.duration) ? v.duration : 0);
    v.onerror = () => done(0);
    setTimeout(() => done(0), 5000);
    v.src = url;
  });
}

export default function DocumentUpload({ onNavigate }) {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // PDF-image mode
  const [fileList, setFileList] = useState([]);

  // Video mode
  const [contentMode, setContentMode] = useState('pages'); // 'pages' | 'video'
  const [category, setCategory] = useState('topic');
  const [videoFile, setVideoFile] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const posterPreviewRef = useRef(null);

  // Force mode back to 'pages' if user picks a non-summary category
  useEffect(() => {
    if (category !== 'summary' && contentMode === 'video') {
      setContentMode('pages');
    }
  }, [category, contentMode]);

  // Cleanup poster object URL
  useEffect(() => {
    return () => {
      if (posterPreviewRef.current) URL.revokeObjectURL(posterPreviewRef.current);
    };
  }, []);

  function beforeUploadImage(file) {
    const isImage = file.type === 'image/png' || file.type === 'image/jpeg';
    if (!isImage) { message.error('รับเฉพาะไฟล์ PNG หรือ JPG'); return Upload.LIST_IGNORE; }
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

  async function handleVideoSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    const okMime = ['video/mp4', 'video/webm'].includes(file.type);
    if (!okMime) { message.error('รับเฉพาะ MP4 หรือ WebM'); return; }
    if (file.size > VIDEO_MAX_BYTES) {
      message.error(`ไฟล์เกิน 50 MB (${formatMB(file.size)})`);
      return;
    }
    const duration = await probeVideoDuration(file);
    setVideoFile(file);
    setVideoDuration(duration);
  }

  function handlePosterSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const okMime = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    if (!okMime) { message.error('โปสเตอร์รับ JPG/PNG/WebP'); return; }
    if (file.size > POSTER_MAX_BYTES) {
      message.error(`โปสเตอร์เกิน 2 MB (${formatMB(file.size)})`);
      return;
    }
    if (posterPreviewRef.current) URL.revokeObjectURL(posterPreviewRef.current);
    const url = URL.createObjectURL(file);
    posterPreviewRef.current = url;
    setPosterFile(file);
    setPosterPreview(url);
  }

  function clearVideo() {
    setVideoFile(null);
    setVideoDuration(0);
  }
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
      if (values.category !== 'summary') {
        setError('วิดีโออนุญาตเฉพาะหมวด "คลิปความรู้" เท่านั้น'); return;
      }
    } else {
      if (fileList.length === 0) { setError('กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์'); return; }
    }

    setUploading(true);
    setProgress(15);

    try {
      let r;
      if (contentMode === 'video') {
        setProgress(40);
        r = await createVideoDocument({
          title: values.title,
          form_code: values.form_code || '',
          description: values.description || '',
          sort_order: values.sort_order || 999,
        }, videoFile, posterFile, videoDuration);
      } else {
        const files = fileList.map(f => f.originFileObj).filter(Boolean);
        setProgress(40);
        r = await createDocument({
          title: values.title,
          form_code: values.form_code || '',
          category: values.category,
          description: values.description || '',
          sort_order: values.sort_order || 999,
        }, files);
      }

      setProgress(100);
      const doc = r.document || {};
      const detail = doc.media_type === 'video'
        ? `วิดีโอ ${formatMB(doc.video_size || 0)}${doc.video_duration_sec ? ` · ${formatDuration(doc.video_duration_sec)}` : ''}`
        : (doc.page_count ? `${doc.page_count} หน้า` : '');
      setSuccess(`เพิ่มเอกสารสำเร็จ: ${doc.title || values.title}${detail ? ` (${detail})` : ''}`);

      form.resetFields();
      setFileList([]);
      clearVideo();
      clearPoster();
      setContentMode('pages');
      setTimeout(() => setUploading(false), 500);
    } catch (err) {
      setError(err.message || 'อัปโหลดไม่สำเร็จ');
      setUploading(false);
    }
  }

  const canSubmit = !uploading && (contentMode === 'video' ? !!videoFile : fileList.length > 0);

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={pageTitleStyle}>📤 เพิ่มเอกสารใหม่</h1>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {contentMode === 'video'
              ? 'วิดีโอ MP4/WebM · สูงสุด 50 MB · โปสเตอร์ JPG/PNG/WebP สูงสุด 2 MB'
              : 'รองรับ PNG/JPG · สูงสุด 100 หน้า · 5MB ต่อไฟล์'}
          </Text>
        </div>
        {onNavigate && (
          <Button onClick={() => onNavigate('documents')}>ไปจัดการเอกสาร →</Button>
        )}
      </div>

      {(error || success || uploading) && (
        <div style={{ marginBottom: 16 }}>
          {error && (
            <Alert type="error" showIcon message={error} closable
              onClose={() => setError(null)} style={{ borderRadius: 10, marginBottom: 8 }} />
          )}
          {success && (
            <Alert type="success" showIcon icon={<CheckCircleOutlined />}
              message={success} closable
              onClose={() => setSuccess(null)} style={{ borderRadius: 10, marginBottom: 8 }} />
          )}
          {uploading && (
            <Progress
              percent={progress}
              status={progress === 100 ? 'success' : 'active'}
              strokeColor={MINT_DARK}
            />
          )}
        </div>
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit}
        requiredMark={false} disabled={uploading}
        onValuesChange={(changed) => {
          if (changed.category !== undefined) setCategory(changed.category);
        }}>
        <div style={twoColStyle}>
          {/* Left: metadata */}
          <div style={cardStyle}>
            <Title level={5} style={{ marginTop: 0, marginBottom: 16, color: MINT_DARK }}>
              📝 ข้อมูลเอกสาร
            </Title>

            <Form.Item label="ชื่อเอกสาร" name="title"
              rules={[
                { required: true, message: 'กรุณาระบุชื่อ' },
                { max: 200, message: 'ชื่อยาวเกินไป' },
              ]}>
              <Input placeholder="เช่น คู่มือผู้ใช้ระบบ HR" size="large" />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
              <Form.Item label="Form Code" name="form_code">
                <Input maxLength={20} placeholder="เช่น FM-001 (ไม่บังคับ)" />
              </Form.Item>
              <Form.Item label="ลำดับการแสดง" name="sort_order" initialValue={999}>
                <InputNumber min={1} max={9999} style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <Form.Item label="หมวด" name="category" rules={[{ required: true }]} initialValue="topic">
              <Radio.Group buttonStyle="solid">
                <Radio.Button value="full_book">เล่ม</Radio.Button>
                <Radio.Button value="topic">บท</Radio.Button>
                <Radio.Button value="summary">คลิปความรู้</Radio.Button>
              </Radio.Group>
            </Form.Item>

            {category === 'summary' && (
              <Form.Item label="เนื้อหา" style={{ marginBottom: 16 }}>
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

            <Form.Item label="คำอธิบาย" name="description" style={{ marginBottom: 0 }}>
              <Input.TextArea rows={4} maxLength={500} showCount placeholder="ไม่บังคับ" />
            </Form.Item>
          </div>

          {/* Right: file uploader */}
          <div style={cardStyle}>
            {contentMode === 'video' ? (
              <VideoUploader
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
              <>
                <Title level={5} style={{ marginTop: 0, marginBottom: 16, color: MINT_DARK }}>
                  📁 ไฟล์ ({fileList.length}/100)
                </Title>
                <Form.Item required style={{ marginBottom: 0 }}>
                  <Dragger
                    multiple
                    accept="image/png,image/jpeg"
                    fileList={fileList}
                    beforeUpload={beforeUploadImage}
                    onChange={handlePagesChange}
                    showUploadList={{
                      showRemoveIcon: !uploading,
                      removeIcon: <DeleteOutlined />,
                    }}
                    style={{ background: MINT_SOFT, borderColor: MINT_MID }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined style={{ color: MINT_MID, fontSize: 48 }} />
                    </p>
                    <p className="ant-upload-text" style={{ color: MINT_DARK, fontSize: 15, fontWeight: 500 }}>
                      คลิกหรือลากไฟล์มาเพื่ออัปโหลด
                    </p>
                    <p className="ant-upload-hint" style={{ fontSize: 12 }}>
                      ไฟล์จะเรียงตามชื่อ — ใช้ชื่อ page_001.png, page_002.png...
                    </p>
                  </Dragger>
                </Form.Item>
              </>
            )}
          </div>
        </div>

        <div style={{ ...cardStyle, marginTop: 16, padding: 16 }}>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={uploading}
              size="large"
              icon={contentMode === 'video' ? <VideoCameraOutlined /> : <FileImageOutlined />}
              disabled={!canSubmit}
              style={canSubmit
                ? { background: MINT_DARK, borderColor: MINT_DARK, height: 48, fontWeight: 500, fontSize: 15 }
                : { background: '#E5E7EB', borderColor: '#E5E7EB', color: '#9CA3AF', height: 48, fontWeight: 500, fontSize: 15 }}
            >
              {uploading
                ? 'กำลังอัปโหลด...'
                : contentMode === 'video'
                  ? (videoFile ? `อัปโหลดวิดีโอ (${formatMB(videoFile.size)})` : 'เลือกวิดีโอก่อน')
                  : `อัปโหลด ${fileList.length} ไฟล์`}
            </Button>
          </Form.Item>
        </div>
      </Form>
    </div>
  );
}

function VideoUploader({
  videoFile, videoDuration, onPick, onClear,
  posterFile, posterPreview, onPickPoster, onClearPoster,
  disabled
}) {
  const videoInputRef = useRef(null);
  const posterInputRef = useRef(null);

  return (
    <>
      <Title level={5} style={{ marginTop: 0, marginBottom: 16, color: MINT_DARK }}>
        🎬 วิดีโอคลิปความรู้
      </Title>

      {/* Video picker */}
      <div style={{ marginBottom: 16 }}>
        <Text style={labelStyle}>ไฟล์วิดีโอ *</Text>
        {!videoFile ? (
          <div
            style={pickerStyle}
            onClick={() => !disabled && videoInputRef.current?.click()}
            role="button"
          >
            <VideoCameraOutlined style={{ fontSize: 40, color: MINT_MID }} />
            <div style={{ color: MINT_DARK, fontWeight: 500, marginTop: 8 }}>
              คลิกเพื่อเลือกไฟล์วิดีโอ
            </div>
            <div style={{ fontSize: 12, color: '#6B8278', marginTop: 4 }}>
              MP4 / WebM · สูงสุด 50 MB
            </div>
          </div>
        ) : (
          <div style={selectedFileStyle}>
            <VideoCameraOutlined style={{ color: MINT_DARK, fontSize: 20 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, color: MINT_DARK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {videoFile.name}
              </div>
              <div style={{ fontSize: 11, color: '#6B8278' }}>
                {formatMB(videoFile.size)}{videoDuration ? ` · ${formatDuration(videoDuration)}` : ''}
              </div>
            </div>
            <Button size="small" icon={<DeleteOutlined />} onClick={onClear} disabled={disabled} />
          </div>
        )}
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm"
          style={{ display: 'none' }}
          onChange={onPick}
        />
      </div>

      {/* Poster picker */}
      <div>
        <Text style={labelStyle}>โปสเตอร์ (ภาพปก) — ไม่บังคับ</Text>
        {!posterFile ? (
          <div
            style={pickerStyle}
            onClick={() => !disabled && posterInputRef.current?.click()}
            role="button"
          >
            <PictureOutlined style={{ fontSize: 32, color: MINT_MID }} />
            <div style={{ color: MINT_DARK, fontWeight: 500, marginTop: 6 }}>
              เลือกภาพปก
            </div>
            <div style={{ fontSize: 12, color: '#6B8278', marginTop: 4 }}>
              JPG / PNG / WebP · สูงสุด 2 MB
            </div>
          </div>
        ) : (
          <div style={selectedFileStyle}>
            {posterPreview && (
              <img src={posterPreview} alt="" style={{ width: 48, height: 60, objectFit: 'cover', borderRadius: 6 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, color: MINT_DARK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {posterFile.name}
              </div>
              <div style={{ fontSize: 11, color: '#6B8278' }}>{formatMB(posterFile.size)}</div>
            </div>
            <Button size="small" icon={<DeleteOutlined />} onClick={onClearPoster} disabled={disabled} />
          </div>
        )}
        <input
          ref={posterInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={onPickPoster}
        />
      </div>
    </>
  );
}

const labelStyle = { display: 'block', fontSize: 13, color: MINT_DARK, marginBottom: 6, fontWeight: 500 };

const pickerStyle = {
  background: MINT_SOFT,
  border: `1.5px dashed ${MINT_MID}`,
  borderRadius: 10,
  padding: '20px 12px',
  textAlign: 'center',
  cursor: 'pointer',
};

const selectedFileStyle = {
  background: '#F0F9F3',
  border: `1px solid ${MINT_MID}`,
  borderRadius: 10,
  padding: '10px 12px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const pageHeaderStyle = {
  background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 16,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  flexWrap: 'wrap', gap: 12,
  border: '0.5px solid rgba(31,77,63,0.08)',
  boxShadow: '0 1px 3px rgba(31,77,63,0.06)',
};

const pageTitleStyle = { margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: MINT_DARK };

const twoColStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
  gap: 16,
  alignItems: 'stretch',
};

const cardStyle = {
  background: '#fff', borderRadius: 14, padding: 20,
  border: '0.5px solid rgba(31,77,63,0.08)',
  boxShadow: '0 1px 3px rgba(31,77,63,0.04)',
};
