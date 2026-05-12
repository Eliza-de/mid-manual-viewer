/**
 * PageImage v3 — Phase 4.2 fix
 *
 * Watermark is rendered as overlay over the entire image container.
 * Container has explicit position: relative + size = full available space.
 * Watermark uses absolute positioning with explicit dimensions.
 */

import { useState, useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Spin, Result, Button } from 'antd';
import { LoadingOutlined, ReloadOutlined } from '@ant-design/icons';
import Watermark from './Watermark.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

export default function PageImage({
  src,
  loading,
  error,
  pageNumber,
  onSwipeLeft,
  onSwipeRight,
  onRetry,
  tabHidden = false
}) {
  const auth = useAuth();
  const touchStartRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [imgErr, setImgErr] = useState(null);

  // Reset image error when src changes
  useEffect(() => { setImgErr(null); }, [src]);

  function onTouchStart(e) {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    } else {
      touchStartRef.current = null;
    }
  }

  function onTouchEnd(e) {
    if (!touchStartRef.current) return;
    if (scale > 1.1) return;

    const start = touchStartRef.current;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const dt = Date.now() - start.time;

    if (Math.abs(dx) < 50) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dt > 500) return;

    if (dx > 0) {
      onSwipeRight && onSwipeRight();
    } else {
      onSwipeLeft && onSwipeLeft();
    }
    touchStartRef.current = null;
  }

  if (error || imgErr) {
    return (
      <div style={containerStyle}>
        <Result
          status="warning"
          title="โหลดหน้านี้ไม่สำเร็จ"
          subTitle={
            <div>
              <div>{error || imgErr}</div>
              {src && (
                <div style={{
                  fontSize: 10,
                  marginTop: 8,
                  wordBreak: 'break-all',
                  color: '#94a3b8',
                  fontFamily: 'monospace',
                }}>
                  {src.startsWith('data:') ? 'src: data URI (base64)' : `src: ${src}`}
                </div>
              )}
            </div>
          }
          extra={onRetry && (
            <Button icon={<ReloadOutlined />} onClick={() => { setImgErr(null); onRetry(); }}>
              ลองใหม่
            </Button>
          )}
        />
      </div>
    );
  }

  if (loading || !src) {
    return (
      <div style={{ ...containerStyle, justifyContent: 'center', alignItems: 'center' }}>
        <Spin
          indicator={<LoadingOutlined style={{ fontSize: 36, color: '#fff' }} spin />}
          tip={<span style={{ color: '#fff' }}>กำลังโหลดหน้า {pageNumber}...</span>}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...containerStyle,
        filter: tabHidden ? 'blur(20px)' : 'none',
        transition: 'filter 200ms ease'
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Zoomable image */}
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={3}
        centerOnInit
        limitToBounds
        doubleClick={{ mode: 'reset' }}
        onZoom={({ state }) => setScale(state.scale)}
        wheel={{ disabled: false }}
        pinch={{ disabled: false }}
        panning={{ disabled: false, velocityDisabled: true }}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src={src}
            alt={`Page ${pageNumber}`}
            style={imgStyle}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onError={(e) => {
              console.error('[PageImage] <img> failed to load', src);
              setImgErr('Browser โหลดรูปไม่ได้ (อาจเป็น 403/404 หรือ network error)');
            }}
          />
        </TransformComponent>
      </TransformWrapper>

      {/* Watermark overlay — covers entire container, on top of zoom */}
      <Watermark user={auth.user} profile={auth.profile} />

      {tabHidden && (
        <div style={hiddenOverlay}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
            🔒 ภาพถูกซ่อนชั่วคราว
          </div>
          <div style={{ color: '#cbd5e1', fontSize: 13, marginTop: 8 }}>
            กลับมาที่หน้านี้เพื่อดูต่อ
          </div>
        </div>
      )}
    </div>
  );
}

const containerStyle = {
  flex: 1,
  width: '100%',
  height: '100%',
  display: 'flex',
  background: '#1f2937',
  overflow: 'hidden',
  position: 'relative'   // critical: Watermark uses inset:0 of this
};

const imgStyle = {
  display: 'block',
  maxWidth: '100%',
  maxHeight: '100%',
  width: 'auto',
  height: 'auto',
  objectFit: 'contain',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitUserDrag: 'none',
  pointerEvents: 'auto'
};

const hiddenOverlay = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.7)',
  zIndex: 100,
  backdropFilter: 'blur(10px)'
};
