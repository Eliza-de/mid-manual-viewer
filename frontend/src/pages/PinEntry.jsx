/**
 * PinEntry — VERSION 2 REDESIGN (Lean Buddy mint sage)
 * BUILD: 2026-05-07-V2-PINENTRY
 *
 * Single-step PIN entry with mint sage glass-morphism design.
 */

import { useState } from 'react';
import { Typography, Alert, Avatar, Statistic } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import PinPad from '../components/PinPad.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { verifyPin, saveSession } from '../api/auth.js';
import { getIdToken } from '../api/liff.js';
import { COLORS } from '../brand.js';

const { Text } = Typography;
const { Countdown } = Statistic;

export default function PinEntry() {
  // ⚡ NEW VERSION MARKER — this log appears in browser console
  if (typeof window !== 'undefined' && !window.__pinentry_v2_loaded) {
    console.log('%c[PinEntry V2 LOADED]', 'background:#1F4D3F;color:#A4DFCB;padding:4px 8px;border-radius:4px');
    window.__pinentry_v2_loaded = true;
  }

  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [errorShake, setErrorShake] = useState(0);
  const [resetSignal] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(null);

  const isLocked = auth.status === 'locked';
  const lockUntil = auth.lockedUntil ? new Date(auth.lockedUntil).getTime() : null;

  async function onComplete(pin) {
    setBusy(true);
    setError(null);
    try {
      const idToken = getIdToken();
      const r = await verifyPin(idToken, pin);
      if (!r.ok) {
        if (r.status === 'locked') {
          auth.onLocked(r.lockedUntil);
          setBusy(false);
          return;
        }
        setError(r.error || 'PIN ไม่ถูกต้อง');
        if (typeof r.attemptsRemaining === 'number') {
          setAttemptsLeft(r.attemptsRemaining);
        }
        setErrorShake(s => s + 1);
        setBusy(false);
        return;
      }
      saveSession(r.sessionToken, r.expiresAt, r.user);
      auth.onLoginSuccess({
        token: r.sessionToken,
        expiresAt: r.expiresAt,
        user: r.user
      });
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
      setErrorShake(s => s + 1);
      setBusy(false);
    }
  }

  // Locked state
  if (isLocked && lockUntil) {
    return (
      <div style={pageStyle}>
        <div style={lockedCardStyle}>
          <LockOutlined style={{ fontSize: 48, color: '#EF4444' }} />
          <div style={lockedTitleStyle}>บัญชีถูก lock</div>
          <Text type="secondary" style={{ fontSize: 13, textAlign: 'center', display: 'block' }}>
            ใส่ PIN ผิดครบจำนวนครั้งที่กำหนด<br />
            กรุณารอ:
          </Text>
          <Countdown
            value={lockUntil}
            format="mm:ss"
            valueStyle={{ color: '#EF4444', fontSize: 36, fontWeight: 600 }}
            onFinish={auth.refresh}
          />
          <a onClick={auth.refresh} style={{ color: COLORS.primary, fontSize: 13 }}>ลองใหม่</a>
        </div>
      </div>
    );
  }

  // Get user info
  const displayName = auth.profile?.displayName || auth.user?.fullName || 'ผู้ใช้งาน';
  const department = auth.user?.department || '';
  const isAdmin = !!auth.user?.isAdmin;
  const initials = (displayName || 'U').split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={titleStyle}>ใส่ PIN เพื่อเข้าใช้งาน</div>

        {auth.profile && (
          <div style={userCardStyle}>
            {auth.profile.pictureUrl ? (
              <Avatar src={auth.profile.pictureUrl} size={44} />
            ) : (
              <div style={avatarFallbackStyle}>{initials}</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={userNameStyle}>{displayName}</div>
              <div style={userMetaRowStyle}>
                {isAdmin && <span style={roleTagStyle}>Admin</span>}
                {department && <span style={departmentStyle}>{department}</span>}
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert
            type="error"
            showIcon
            message={error}
            description={attemptsLeft !== null && attemptsLeft > 0
              ? `เหลืออีก ${attemptsLeft} ครั้ง` : null
            }
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 12, borderRadius: 12 }}
          />
        )}

        <PinPad
          onComplete={onComplete}
          busy={busy}
          errorShake={errorShake}
          resetSignal={resetSignal}
          hint="PIN 6 หลัก"
        />
      </div>
    </div>
  );
}

// ===== Styles =====

const pageStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  width: '100vw',
  height: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  background: `linear-gradient(180deg, #F0F9F3 0%, ${COLORS.bgSoft} 50%, #DCEEE3 100%)`,
  overflow: 'auto'
};

const cardStyle = {
  width: '100%',
  maxWidth: 380,
  background: 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '0.5px solid rgba(31, 77, 63, 0.1)',
  borderRadius: 20,
  padding: '24px 20px',
  boxShadow: '0 4px 24px rgba(31, 77, 63, 0.08)'
};

const titleStyle = {
  textAlign: 'center',
  fontSize: 16,
  fontWeight: 600,
  color: COLORS.primary,
  marginBottom: 18
};

const userCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  background: 'rgba(255, 255, 255, 0.7)',
  border: '0.5px solid rgba(31, 77, 63, 0.08)',
  borderRadius: 14,
  marginBottom: 16
};

const avatarFallbackStyle = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  background: `linear-gradient(135deg, #5DBFA0, ${COLORS.primary})`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: 600,
  fontSize: 16,
  flexShrink: 0
};

const userNameStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: COLORS.primary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const userMetaRowStyle = {
  marginTop: 4,
  display: 'flex',
  gap: 8,
  alignItems: 'center'
};

const roleTagStyle = {
  background: '#DCEEE3',
  color: COLORS.primary,
  padding: '1px 8px',
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 0.3
};

const departmentStyle = {
  fontSize: 11,
  color: '#6B8278'
};

const lockedCardStyle = {
  width: '100%',
  maxWidth: 380,
  background: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '0.5px solid rgba(239, 68, 68, 0.2)',
  borderRadius: 20,
  padding: '32px 24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  boxShadow: '0 4px 24px rgba(239, 68, 68, 0.1)'
};

const lockedTitleStyle = {
  fontSize: 18,
  fontWeight: 600,
  color: '#EF4444',
  margin: 0
};
