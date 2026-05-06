/**
 * PageImage — renders a single page PNG with pinch-to-zoom + pan
 *
 * Uses react-zoom-pan-pinch for gesture handling.
 * Supports swipe for page change when not zoomed.
 */

import { useState, useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Spin, Result, Button } from 'antd';
import { LoadingOutlined, ReloadOutlined } from '@ant-design/icons';

export default function PageImage({
  src,
  loading,
  error,
  pageNumber,
  onSwipeLeft,
  onSwipeRight,
  onRetry
}) {
  const touchStartRef = useRef(null);
  const [scale, setScale] = useState(1);

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
    if (scale > 1.1) return;   // Don't swipe-navigate while zoomed

    const start = touchStartRef.current;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const dt = Date.now() - start.time;

    // Must be horizontal + fast + significant
    if (Math.abs(dx) < 50) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dt > 500) return;

    if (dx > 0) {
      onSwipeRight && onSwipeRight();   // swipe right → previous
    } else {
      onSwipeLeft && onSwipeLeft();     // swipe left → next
    }
    touchStartRef.current = null;
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <Result
          status="warning"
          title="โหลดหน้านี้ไม่สำเร็จ"
          subTitle={error}
          extra={onRetry && (
            <Button icon={<ReloadOutlined />} onClick={onRetry}>
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
          indicator={<LoadingOutlined style={{ fontSize: 36, color: '#1e3a5f' }} spin />}
          tip={`กำลังโหลดหน้า ${pageNumber}...`}
        />
      </div>
    );
  }

  return (
    <div
      style={containerStyle}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
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
          contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <img
            src={src}
            alt={`Page ${pageNumber}`}
            style={imgStyle}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        </TransformComponent>
      </TransformWrapper>
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
  position: 'relative'
};

const imgStyle = {
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
