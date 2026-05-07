/**
 * Splash — Lean Buddy with full splash image + progress bar in middle
 *
 * Layout (top to bottom):
 *   [Splash image as background — fills entire screen]
 *
 *   The image already contains:
 *     - Logo (orange/green people)
 *     - "Lean Buddy" + "By Med-healthup"
 *     - Tagline
 *     - 3 dots
 *     - Empty space in middle <-- progress bar overlaid HERE
 *     - Copyright card at bottom
 *
 *   We position the progress bar absolutely so it lands in the
 *   empty space below the dots and above the copyright card.
 */

import { useEffect, useState } from 'react';
import { Result, Button } from 'antd';
import { useAuth } from '../hooks/useAuth.jsx';
import { COLORS } from '../brand.js';

export default function Splash() {
  const auth = useAuth();
  const [progress, setProgress] = useState(0);

  // Smooth ramp toward 90% while loading; jumps to 100% when ready
  useEffect(() => {
    if (auth.status === 'error') return;

    let raf;
    let lastTime = performance.now();
    const target = auth.status === 'ready' ? 100 : 90;

    function tick(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setProgress((p) => {
        if (p >= target) return target;
        const speed = (target - p) * 0.8;
        return Math.min(target, p + speed * dt);
      });

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [auth.status]);

  // Error state — show retry card
  if (auth.status === 'error') {
    return (
      <div style={errorContainerStyle}>
        <div style={errorCardStyle}>
          <Result
            status="error"
            title="ไม่สามารถโหลดระบบได้"
            subTitle={auth.error || 'เกิดข้อผิดพลาด'}
            extra={
              <Button
                type="primary"
                onClick={auth.refresh}
                style={{ background: COLORS.primary, borderColor: COLORS.primary }}
              >
                ลองใหม่
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const pct = Math.round(progress);

  return (
    <div style={containerStyle}>
      <style>{keyframes}</style>

      {/*
        Progress bar positioned absolutely.
        - top: 56vh  -> below "dots" in the splash image
        - bottom region: above the copyright card (which is in image at ~80vh)
        Adjust top % if needed to match your image's empty space exactly.
      */}
      <div style={progressBoxStyle}>
        <div style={progressLabelRowStyle}>
          <span style={progressLabelStyle}>กำลังเตรียมระบบ</span>
          <span style={progressPercentStyle}>{pct}%</span>
        </div>
        <div style={progressTrackStyle}>
          <div style={{ ...progressFillStyle, width: `${pct}%` }}>
            <div style={shimmerStyle}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Animations =====

const keyframes = `
  @keyframes lb-shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
  }
  @keyframes lb-fadein {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// ===== Styles =====

const containerStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  width: '100vw',
  height: '100dvh',
  // Full splash image as background
  backgroundImage: 'url(/splash-bg.jpg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center top',
  backgroundRepeat: 'no-repeat',
  backgroundColor: '#E8F5EE',
  overflow: 'hidden'
};

// Position the progress bar in the empty space between dots and copyright card.
// 56vh from top works for most phones. If your splash image varies,
// you can change to specific px or use bottom-based positioning.
const progressBoxStyle = {
  position: 'absolute',
  top: '56vh',
  left: 0,
  right: 0,
  padding: '0 40px',
  animation: 'lb-fadein 0.6s ease-out'
};

const progressLabelRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8
};

const progressLabelStyle = {
  fontSize: 12,
  color: COLORS.primary,
  opacity: 0.7,
  fontWeight: 500
};

const progressPercentStyle = {
  fontSize: 13,
  color: COLORS.primary,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums'
};

const progressTrackStyle = {
  height: 6,
  background: 'rgba(31, 77, 63, 0.12)',
  borderRadius: 999,
  overflow: 'hidden',
  position: 'relative'
};

const progressFillStyle = {
  height: '100%',
  background: `linear-gradient(90deg, #5DBFA0 0%, ${COLORS.primary} 100%)`,
  borderRadius: 999,
  position: 'relative',
  overflow: 'hidden',
  transition: 'width 0.2s ease-out'
};

const shimmerStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: 50,
  height: '100%',
  background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.7) 50%, transparent 100%)',
  animation: 'lb-shimmer 1.5s ease-in-out infinite'
};

// ===== Error state =====

const errorContainerStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  background: COLORS.bgSoft
};

const errorCardStyle = {
  width: '100%',
  maxWidth: 400,
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 16px rgba(31, 77, 63, 0.08)',
  border: `1px solid ${COLORS.brandLight}`,
  padding: 24
};
