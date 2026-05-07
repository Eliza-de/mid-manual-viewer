/**
 * Splash — initial loading screen (Lean Buddy redesign)
 *
 * Changes from previous:
 *   - Replaced book emoji with custom logo image (2 people holding hands)
 *   - Removed white Card frame — fullscreen mint sage background
 *   - Added copyright notice at bottom
 *   - Smoother loading animation with pulse + dots
 */

import { Result, Button } from 'antd';
import { useAuth } from '../hooks/useAuth.jsx';
import { BRAND, COLORS } from '../brand.js';

export default function Splash() {
  const auth = useAuth();

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

  return (
    <div style={containerStyle}>
      {/* Inline keyframe animations */}
      <style>{keyframes}</style>

      {/* Main content centered */}
      <div style={contentStyle}>
        {/* Logo with subtle pulse */}
        <div style={logoWrapperStyle}>
          <img
            src="/logo-buddy.jpg"
            alt="Lean Buddy logo"
            style={logoImgStyle}
          />
        </div>

        {/* Brand name */}
        <div style={appNameStyle}>{BRAND.appName}</div>
        <div style={taglineStyle}>By Med-healthup</div>

        {/* Animated loading dots */}
        <div style={dotsContainerStyle}>
          <span style={{ ...dotStyle, animationDelay: '0s' }}></span>
          <span style={{ ...dotStyle, animationDelay: '0.2s' }}></span>
          <span style={{ ...dotStyle, animationDelay: '0.4s' }}></span>
        </div>
        <div style={loadingTextStyle}>กำลังโหลด...</div>
      </div>

      {/* Copyright notice at bottom */}
      <div style={copyrightStyle}>
        <div style={copyrightTextStyle}>
          ข้อมูลในแหล่งเรียนรู้นี้ เป็นลิขสิทธิ์ของ
          <br />
          <strong>บริษัท เมดเฮลท์อัพ จำกัด</strong>
          <br />
          ห้ามลอกเลียนแบบ หรือ เผยแพร่ ก่อนได้รับอนุญาต
        </div>
      </div>
    </div>
  );
}

// ===== Animations =====

const keyframes = `
  @keyframes leanbuddy-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.95; }
  }
  @keyframes leanbuddy-bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
    40% { transform: translateY(-8px); opacity: 1; }
  }
  @keyframes leanbuddy-fadein {
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
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '40px 20px 32px',
  // Soft mint gradient — no harsh card edges
  background: `linear-gradient(180deg, #E8F5EE 0%, ${COLORS.bgSoft} 50%, #E8F5EE 100%)`,
  overflow: 'hidden'
};

const contentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  maxWidth: 400,
  animation: 'leanbuddy-fadein 0.6s ease-out'
};

const logoWrapperStyle = {
  width: 180,
  height: 180,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 20,
  animation: 'leanbuddy-pulse 2.4s ease-in-out infinite'
};

const logoImgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  // Soft shadow that blends with mint bg
  filter: 'drop-shadow(0 4px 12px rgba(31, 77, 63, 0.12))'
};

const appNameStyle = {
  fontSize: 32,
  fontWeight: 700,
  color: COLORS.primary,
  letterSpacing: '-0.5px',
  marginBottom: 4
};

const taglineStyle = {
  fontSize: 14,
  color: COLORS.primary,
  opacity: 0.6,
  fontWeight: 400,
  marginBottom: 36
};

const dotsContainerStyle = {
  display: 'flex',
  gap: 8,
  marginBottom: 12,
  height: 16,
  alignItems: 'center'
};

const dotStyle = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: COLORS.primary,
  display: 'inline-block',
  animation: 'leanbuddy-bounce 1.4s ease-in-out infinite'
};

const loadingTextStyle = {
  fontSize: 13,
  color: COLORS.primary,
  opacity: 0.6,
  fontWeight: 400
};

const copyrightStyle = {
  width: '100%',
  maxWidth: 480,
  padding: '16px 20px',
  textAlign: 'center'
};

const copyrightTextStyle = {
  fontSize: 11,
  color: COLORS.primary,
  opacity: 0.5,
  lineHeight: 1.7,
  letterSpacing: 0.2
};

// Error state styles (kept simple white card)
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
  border: `1px solid ${COLORS.brandLight}`
};
