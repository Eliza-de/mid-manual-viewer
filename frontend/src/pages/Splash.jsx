/**
 * Splash — Lean Buddy with full image visible + progress bar overlay
 *
 * Changes from prev:
 *   - Replaced background-image with <img> tag using object-fit: cover
 *   - Image fills screen fully — no whitespace at top
 *   - Progress bar floats above image at fixed bottom position
 */

import { useEffect, useState } from 'react';
import { Result, Button } from 'antd';
import { useAuth } from '../hooks/useAuth.jsx';
import { COLORS } from '../brand.js';

export default function Splash() {
  const auth = useAuth();
  const [progress, setProgress] = useState(0);

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

      {/* Image fills the screen — uses object-fit cover with bottom anchor */}
      <img
        src="/splash-bg.jpg"
        alt=""
        style={imgStyle}
      />

      {/* Progress bar overlay — fixed near bottom of viewport */}
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

const containerStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  width: '100vw',
  height: '100dvh',
  backgroundColor: '#E8F5EE',
  overflow: 'hidden'
};

// 🎯 Image as <img> with object-fit: cover + objectPosition
//   - 'center bottom' = ชิดล่าง (ตัดจากบนถ้าจำเป็น)
//   - ทำให้ copyright card อยู่ก้นจอจริง
const imgStyle = {
  position: 'absolute',
  top: 0, left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center bottom',   // ← key: bottom alignment
  zIndex: 1
};

// 🎯 Progress bar overlay — fixed position from bottom
//
// ค่า bottom เป็นความสูง pixel จากก้นจอ (คงที่ไม่ขึ้นกับขนาดจอ)
//   bottom: '120px'  -> สูงประมาณ copyright card
//   bottom: '180px'  -> default ★ (เหนือ copyright card)
//   bottom: '220px'  -> สูงขึ้นอีก
//   bottom: '260px'  -> ใกล้ tagline
const progressBoxStyle = {
  position: 'absolute',
  bottom: '180px',
  left: 0,
  right: 0,
  padding: '0 40px',
  zIndex: 10,
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
  opacity: 0.8,
  fontWeight: 600,
  textShadow: '0 1px 2px rgba(255,255,255,0.5)'
};

const progressPercentStyle = {
  fontSize: 13,
  color: COLORS.primary,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  textShadow: '0 1px 2px rgba(255,255,255,0.5)'
};

const progressTrackStyle = {
  height: 6,
  background: 'rgba(255, 255, 255, 0.6)',
  borderRadius: 999,
  overflow: 'hidden',
  position: 'relative',
  boxShadow: '0 1px 3px rgba(31, 77, 63, 0.1)'
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
