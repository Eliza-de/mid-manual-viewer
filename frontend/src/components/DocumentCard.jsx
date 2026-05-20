/**
 * DocumentCard — Chapter-N pill + page-1 image thumbnail
 * BUILD: 2026-05-13-CHAPTER-THUMB
 *
 * - Tag is now "Chapter-{index+1}" in a single dark pill, regardless of form_code
 * - Thumbnail is the document's page 1 image (lazy-loaded on viewport entry)
 * - Mint gradient + FileTextOutlined remain as loading/error fallback
 */

import { useEffect, useRef, useState } from 'react';
import { FileTextOutlined, ClockCircleOutlined, RightOutlined,
         PlayCircleFilled, VideoCameraOutlined } from '@ant-design/icons';
import { relativeTime } from '../utils/format.js';
import { COLORS } from '../brand.js';
import { useThumbnail } from '../hooks/useThumbnail.jsx';

const THUMB_GRADIENT = `linear-gradient(135deg, #A4DFCB, #5DBFA0)`;

function formatDuration(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function DocumentCard({ doc, index = 0, onClick }) {
  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const isVideo = doc?.media_type === 'video';
  const { url: thumbUrl } = useThumbnail(doc?.id, visible, isVideo ? 'video' : 'pages');

  useEffect(() => {
    if (visible) return;
    const el = cardRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
          break;
        }
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  const chapterLabel = isVideo ? 'VIDEO' : `Chapter-${index + 1}`;

  return (
    <div
      ref={cardRef}
      onClick={() => onClick(doc)}
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(31,77,63,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(31,77,63,0.06)';
      }}
    >
      {/* Thumbnail */}
      <div style={thumbStyle}>
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt=""
            style={thumbImgStyle}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : isVideo ? (
          <VideoCameraOutlined style={{ color: 'white', fontSize: 22 }} />
        ) : (
          <FileTextOutlined style={{ color: 'white', fontSize: 24 }} />
        )}
        {isVideo && (
          <div style={playOverlayStyle}>
            <PlayCircleFilled style={{ color: 'white', fontSize: 22, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />
          </div>
        )}
        {isVideo && doc.video_duration_sec > 0 ? (
          <div style={pageCountBadgeStyle}>
            {formatDuration(doc.video_duration_sec)}
          </div>
        ) : (
          !isVideo && typeof doc.page_count === 'number' && (
            <div style={pageCountBadgeStyle}>
              {doc.page_count}p
            </div>
          )
        )}
      </div>

      {/* Info */}
      <div style={infoStyle}>
        <div style={{ marginBottom: 6 }}>
          <span style={isVideo ? tagVideoStyle : tagStyle}>{chapterLabel}</span>
        </div>

        <div style={titleStyle}>
          {doc.title}
        </div>

        {doc.description && (
          <div style={descStyle}>
            {doc.description}
          </div>
        )}

        <div style={metaStyle}>
          {doc.updated_at && (
            <span style={metaItemStyle}>
              <ClockCircleOutlined style={{ fontSize: 11 }} />
              {relativeTime(doc.updated_at)}
            </span>
          )}
        </div>
      </div>

      <RightOutlined style={chevronStyle} />
    </div>
  );
}

// ===== Styles =====

const cardStyle = {
  background: 'white',
  borderRadius: 16,
  padding: 14,
  marginBottom: 10,
  boxShadow: '0 1px 3px rgba(31,77,63,0.06)',
  border: '0.5px solid rgba(31,77,63,0.05)',
  display: 'flex',
  gap: 12,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  alignItems: 'flex-start'
};

const thumbStyle = {
  width: 56,
  height: 70,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  position: 'relative',
  overflow: 'hidden',
  background: THUMB_GRADIENT,
  boxShadow: '0 2px 4px rgba(31,77,63,0.08)'
};

const thumbImgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
  userSelect: 'none',
  WebkitUserDrag: 'none',
  pointerEvents: 'none'
};

const pageCountBadgeStyle = {
  position: 'absolute',
  bottom: 4,
  right: 4,
  background: 'rgba(255,255,255,0.95)',
  color: COLORS.primary,
  fontSize: 9,
  fontWeight: 700,
  padding: '1px 6px',
  borderRadius: 999,
  letterSpacing: 0.3,
  zIndex: 1
};

const infoStyle = {
  flex: 1,
  minWidth: 0
};

const tagStyle = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.4,
  padding: '2px 8px',
  borderRadius: 999,
  display: 'inline-block',
  background: '#3A4A44',
  color: 'white'
};

const tagVideoStyle = {
  ...{
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.4,
    padding: '2px 8px',
    borderRadius: 999,
    display: 'inline-block',
    color: 'white',
  },
  background: '#E8965B',
};

const playOverlayStyle = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.18)',
  pointerEvents: 'none',
  zIndex: 1,
};

const titleStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: COLORS.primary,
  lineHeight: 1.3,
  marginBottom: 4,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
};

const descStyle = {
  fontSize: 11,
  color: '#6B8278',
  lineHeight: 1.4,
  marginBottom: 6,
  display: '-webkit-box',
  WebkitLineClamp: 1,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
};

const metaStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: 10,
  color: '#94A3B8'
};

const metaItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 3
};

const chevronStyle = {
  color: '#CBD5E1',
  fontSize: 14,
  marginTop: 28,
  flexShrink: 0
};
