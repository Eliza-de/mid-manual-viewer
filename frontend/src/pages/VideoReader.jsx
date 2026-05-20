/**
 * VideoReader — เครื่องเล่นวิดีโอรีวิว (LIFF mobile)
 *
 * ใช้ HTML5 <video> + signed URL (30 นาที) ที่มี HTTP Range support ฝั่ง worker.
 * ใช้ anti-capture เหมือน Reader: log การ blur / devtools / context-menu.
 * วิดีโอยังป้องกัน screen-recording ไม่ได้แบบ 100% — แค่ปิดทาง download ปกติ
 * (controlsList="nodownload", disablePictureInPicture) + lay watermark notice.
 */

import { useEffect, useRef, useState } from 'react';
import { Typography } from 'antd';
import { ArrowLeftOutlined, LoadingOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigation } from '../hooks/useNavigation.jsx';
import { useAntiCapture } from '../hooks/useAntiCapture.jsx';
import { getIdToken } from '../api/liff.js';
import { getVideo } from '../api/video.js';
import AntiCaptureNotice from '../components/AntiCaptureNotice.jsx';
import { COLORS } from '../brand.js';

const { Text } = Typography;

export default function VideoReader() {
  const auth = useAuth();
  const nav = useNavigation();
  const doc = nav.currentDoc;
  const videoRef = useRef(null);

  const [src, setSrc] = useState(null);
  const [poster, setPoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useAntiCapture({
    enabled: true,
    documentId: doc?.id || null,
    pageNumber: null,
    onSuspectActivity: (event) => {
      if (event.type !== 'tab_visible') {
        // Pause playback on suspect activity (best-effort)
        try {
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
          }
        } catch (_) {}
      }
    }
  });

  useEffect(() => {
    if (!doc?.id || !auth.session) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const r = await getVideo(getIdToken(), auth.session.token, doc.id);
        if (cancelled) return;
        if (!r.ok) {
          if (r.needsLogin) { auth.logout(); return; }
          setError(r.error || 'โหลดวิดีโอไม่สำเร็จ');
          setLoading(false);
          return;
        }
        setSrc(r.url);
        setPoster(r.posterUrl || null);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'เกิดข้อผิดพลาด');
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [doc?.id, auth.session, auth.logout]);

  if (!doc) return null;

  return (
    <div style={containerStyle}>
      {/* Top bar */}
      <div style={topBarStyle}>
        <div style={backBtnStyle} onClick={nav.closeDoc} role="button" aria-label="กลับ">
          <ArrowLeftOutlined style={{ fontSize: 18 }} />
        </div>

        <div style={titleBlockStyle}>
          <span style={tagMiniStyle}>VIDEO</span>
          <Text style={titleTextStyle} ellipsis>{doc.title}</Text>
        </div>
      </div>

      <AntiCaptureNotice />

      {/* Player */}
      <div style={contentStyle}>
        {error ? (
          <div style={messageBoxStyle}>
            <div style={{ color: '#dc2626', marginBottom: 8 }}>โหลดวิดีโอไม่สำเร็จ</div>
            <div style={{ fontSize: 12, color: '#6B8278' }}>{error}</div>
          </div>
        ) : loading || !src ? (
          <div style={messageBoxStyle}>
            <LoadingOutlined style={{ fontSize: 32, color: COLORS.primary, marginBottom: 12 }} />
            <div style={{ fontSize: 13, color: '#6B8278' }}>กำลังโหลดวิดีโอ...</div>
          </div>
        ) : (
          <div style={playerWrapStyle}>
            <video
              ref={videoRef}
              src={src}
              poster={poster || undefined}
              controls
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              playsInline
              preload="metadata"
              onContextMenu={(e) => e.preventDefault()}
              style={videoStyle}
            />
            {doc.description && (
              <div style={descStyle}>{doc.description}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const containerStyle = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  background: '#0e1110',
  zIndex: 100
};

const topBarStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 14px',
  background: 'white',
  borderBottom: '0.5px solid rgba(31,77,63,0.08)',
  flexShrink: 0,
  position: 'sticky',
  top: 0,
  zIndex: 10,
  boxShadow: '0 1px 3px rgba(31,77,63,0.04)'
};

const backBtnStyle = {
  width: 34,
  height: 34,
  borderRadius: 10,
  background: '#DCEEE3',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: COLORS.primary,
  cursor: 'pointer',
  flexShrink: 0,
};

const titleBlockStyle = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8
};

const tagMiniStyle = {
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: 999,
  background: '#E8965B',
  color: 'white',
  letterSpacing: 0.4,
  flexShrink: 0,
};

const titleTextStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: COLORS.primary,
  flex: 1,
  minWidth: 0,
};

const contentStyle = {
  flex: 1,
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  background: '#0e1110',
  padding: 12,
};

const playerWrapStyle = {
  width: '100%',
  maxWidth: 720,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const videoStyle = {
  width: '100%',
  background: '#000',
  borderRadius: 12,
  display: 'block',
  maxHeight: 'calc(100vh - 220px)',
};

const descStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '0.5px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 13,
  lineHeight: 1.5,
  color: '#cbd5e1',
};

const messageBoxStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: 'white',
  borderRadius: 12,
  margin: 'auto',
  maxWidth: 360,
  textAlign: 'center',
};
