/**
 * VideoReader — เครื่องเล่นวิดีโอรีวิว (LIFF mobile)
 *
 * Layout: top bar (compact) + video fills remaining viewport (object-contain).
 * Autoplay: tries with sound first, falls back to muted if browser blocks
 * (iOS Safari requires user gesture for sound-on autoplay). Shows a
 * "🔊 แตะเพื่อเปิดเสียง" overlay when muted fallback kicked in.
 */

import { useEffect, useRef, useState } from 'react';
import { Typography } from 'antd';
import { ArrowLeftOutlined, LoadingOutlined, SoundOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigation } from '../hooks/useNavigation.jsx';
import { useAntiCapture } from '../hooks/useAntiCapture.jsx';
import { getIdToken } from '../api/liff.js';
import { getVideo } from '../api/video.js';
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
  const [mutedFallback, setMutedFallback] = useState(false);

  useAntiCapture({
    enabled: true,
    documentId: doc?.id || null,
    pageNumber: null,
    onSuspectActivity: (event) => {
      if (event.type !== 'tab_visible') {
        try {
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
          }
        } catch (_) {}
      }
    }
  });

  // Fetch signed URL
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

  // Autoplay attempt — try with sound first, fall back to muted if browser
  // rejects (iOS Safari, Chrome on mobile without prior interaction).
  useEffect(() => {
    if (!src || !videoRef.current) return;
    const v = videoRef.current;
    let cancelled = false;

    const tryPlay = async () => {
      try {
        v.muted = false;
        await v.play();
        if (!cancelled) setMutedFallback(false);
      } catch (_) {
        if (cancelled) return;
        v.muted = true;
        setMutedFallback(true);
        try { await v.play(); } catch (_) {}
      }
    };
    // Small delay lets <video> register the src and metadata first
    const t = setTimeout(tryPlay, 50);
    return () => { cancelled = true; clearTimeout(t); };
  }, [src]);

  function unmute() {
    if (!videoRef.current) return;
    videoRef.current.muted = false;
    setMutedFallback(false);
    // Ensure it's still playing
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    }
  }

  if (!doc) return null;

  return (
    <div style={containerStyle}>
      {/* Top bar — compact */}
      <div style={topBarStyle}>
        <div style={backBtnStyle} onClick={nav.closeDoc} role="button" aria-label="กลับ">
          <ArrowLeftOutlined style={{ fontSize: 18 }} />
        </div>

        <div style={titleBlockStyle}>
          <span style={tagMiniStyle}>VIDEO</span>
          <Text style={titleTextStyle} ellipsis>{doc.title}</Text>
        </div>
      </div>

      {/* Player area — fills */}
      <div style={contentStyle}>
        {error ? (
          <div style={messageBoxStyle}>
            <div style={{ color: '#fca5a5', marginBottom: 8 }}>โหลดวิดีโอไม่สำเร็จ</div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>{error}</div>
          </div>
        ) : loading || !src ? (
          <div style={messageBoxStyle}>
            <LoadingOutlined style={{ fontSize: 32, color: '#A4DFCB', marginBottom: 12 }} />
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>กำลังโหลดวิดีโอ...</div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={src}
              poster={poster || undefined}
              controls
              autoPlay
              playsInline
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              preload="auto"
              onContextMenu={(e) => e.preventDefault()}
              style={videoStyle}
            />
            {mutedFallback && (
              <button onClick={unmute} style={unmuteBtnStyle}>
                <SoundOutlined style={{ fontSize: 16 }} />
                <span>แตะเพื่อเปิดเสียง</span>
              </button>
            )}
          </>
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
  background: '#000',
  zIndex: 100,
};

const topBarStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  background: 'rgba(15,17,16,0.92)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  flexShrink: 0,
  position: 'relative',
  zIndex: 10,
};

const backBtnStyle = {
  width: 34,
  height: 34,
  borderRadius: 10,
  background: 'rgba(255,255,255,0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  cursor: 'pointer',
  flexShrink: 0,
};

const titleBlockStyle = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
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
  color: 'white',
  flex: 1,
  minWidth: 0,
};

const contentStyle = {
  flex: 1,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#000',
  overflow: 'hidden',
};

const videoStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  background: '#000',
  display: 'block',
};

const unmuteBtnStyle = {
  position: 'absolute',
  top: 14,
  right: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 12px',
  borderRadius: 999,
  background: 'rgba(0,0,0,0.7)',
  color: 'white',
  border: '1px solid rgba(255,255,255,0.25)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  zIndex: 11,
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
};

const messageBoxStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  textAlign: 'center',
};
