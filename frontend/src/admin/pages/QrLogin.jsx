/**
 * QR Login Page — Admin Desktop Entry Point
 *
 * Flow:
 * 1. On mount: call /api/admin/qr/init → get pairCode + liffUrl
 * 2. Render QR code from liffUrl
 * 3. Long-poll /api/admin/qr/poll every 2s
 * 4. On status === 'success': save session → redirect to /admin/dashboard
 * 5. On expired: show refresh button
 */

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { qrInit, qrPoll } from '../api/admin';
import { saveAdminSession } from '../lib/adminSession';

// ===== Theme tokens =====
const MINT_PRIMARY = '#A4DFCB';
const MINT_DARK = '#1F4D3F';
const MINT_MID = '#5DBFA0';
const MINT_MUTED = '#6B8278';
const MINT_SOFT = '#DCEEE3';
const ACCENT_ORANGE = '#E8965B';
const ERROR_RED = '#EF4444';
const HEADER_GRADIENT = `linear-gradient(135deg, ${MINT_MID} 0%, ${MINT_DARK} 100%)`;

const POLL_INTERVAL_MS = 2000;

export default function QrLogin({ onLogin }) {
  const [state, setState] = useState({
    loading: true,
    pairCode: null,
    liffUrl: null,
    expiresAt: null,
    error: null,
    status: 'init',          // init | waiting | success | expired | error
  });
  const [secondsLeft, setSecondsLeft] = useState(0);
  const pollRef = useRef(null);
  const tickRef = useRef(null);
  const mountedRef = useRef(true);

  // ===== Initialize pair =====
  const initialize = async () => {
    setState((s) => ({ ...s, loading: true, error: null, status: 'init' }));
    stopPolling();
    try {
      const r = await qrInit();
      if (!r.ok) throw new Error(r.error || 'init failed');
      if (!mountedRef.current) return;
      setState({
        loading: false,
        pairCode: r.pairCode,
        liffUrl: r.liffUrl,
        expiresAt: r.expiresAt,
        error: null,
        status: 'waiting',
      });
      startPolling(r.pairCode);
      startCountdown(r.expiresAt);
    } catch (e) {
      console.error('[QrLogin] init error', e);
      if (!mountedRef.current) return;
      setState({
        loading: false,
        pairCode: null,
        liffUrl: null,
        expiresAt: null,
        error: e.message,
        status: 'error',
      });
    }
  };

  const startPolling = (pairCode) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const r = await qrPoll(pairCode);
        if (!mountedRef.current) return;
        if (!r.ok) return;

        if (r.status === 'pending') {
          // continue polling
          return;
        }
        if (r.status === 'success' && r.adminToken && r.user) {
          stopPolling();
          stopCountdown();
          saveAdminSession({
            adminToken: r.adminToken,
            expiresAt: r.expiresAt,
            user: r.user,
          });
          setState((s) => ({ ...s, status: 'success' }));
          setTimeout(() => {
            if (onLogin) onLogin();
            else window.location.href = '/admin/dashboard';
          }, 500);
        } else if (r.status === 'expired') {
          stopPolling();
          stopCountdown();
          setState((s) => ({ ...s, status: 'expired' }));
        } else if (r.status === 'consumed') {
          // Someone else (or another tab) finished it
          stopPolling();
          stopCountdown();
          setState((s) => ({ ...s, status: 'expired', error: 'QR code นี้ถูกใช้แล้ว' }));
        }
      } catch (e) {
        console.error('[QrLogin] poll error', e);
      }
    }, POLL_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startCountdown = (expiresAt) => {
    stopCountdown();
    const tick = () => {
      const remain = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remain);
      if (remain <= 0) stopCountdown();
    };
    tick();
    tickRef.current = setInterval(tick, 1000);
  };

  const stopCountdown = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  // ===== Lifecycle =====
  useEffect(() => {
    mountedRef.current = true;
    initialize();
    return () => {
      mountedRef.current = false;
      stopPolling();
      stopCountdown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Render =====
  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${MINT_SOFT} 0%, #fff 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 10px 40px rgba(31, 77, 63, 0.12)',
          width: '100%',
          maxWidth: 480,
          overflow: 'hidden',
          border: `0.5px solid rgba(31, 77, 63, 0.08)`,
        }}
      >
        {/* Header */}
        <div
          style={{
            background: HEADER_GRADIENT,
            padding: '24px 28px',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6, fontWeight: 500 }}>
            🌿 Lean Buddy By Med-healthup
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>
            Admin Console
          </div>
          <div style={{ fontSize: 13, opacity: 0.78, marginTop: 4 }}>
            Sign in via LINE QR Code
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '32px 28px' }}>
          {state.loading && <LoadingView />}
          {state.status === 'error' && <ErrorView error={state.error} onRetry={initialize} />}
          {state.status === 'waiting' && state.liffUrl && (
            <WaitingView
              liffUrl={state.liffUrl}
              secondsLeft={secondsLeft}
              onRefresh={initialize}
            />
          )}
          {state.status === 'expired' && (
            <ExpiredView
              message={state.error || 'QR code หมดอายุแล้ว'}
              onRefresh={initialize}
            />
          )}
          {state.status === 'success' && <SuccessView />}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 28px',
            borderTop: '0.5px solid rgba(31, 77, 63, 0.08)',
            background: '#FAFCFB',
            fontSize: 11,
            color: MINT_MUTED,
            textAlign: 'center',
            letterSpacing: '0.2px',
          }}
        >
          เฉพาะ Admin เท่านั้น · v1.0 Phase 17
        </div>
      </div>
    </div>
  );
}

// ===== Sub-views =====

function LoadingView() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div
        style={{
          width: 40, height: 40,
          border: `3px solid ${MINT_SOFT}`,
          borderTopColor: MINT_MID,
          borderRadius: '50%',
          margin: '0 auto',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ marginTop: 16, color: MINT_MUTED, fontSize: 13 }}>
        กำลังสร้าง QR code...
      </div>
    </div>
  );
}

function WaitingView({ liffUrl, secondsLeft, onRefresh }) {
  return (
    <>
      {/* QR Code */}
      <div
        style={{
          background: '#fff',
          border: `1px solid ${MINT_SOFT}`,
          borderRadius: 12,
          padding: 20,
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <QRCodeSVG
          value={liffUrl}
          size={220}
          fgColor={MINT_DARK}
          bgColor="#fff"
          level="M"
          includeMargin={false}
        />
      </div>

      {/* Instructions */}
      <div style={{ marginBottom: 20 }}>
        <ol style={{ paddingLeft: 24, margin: 0, color: '#333', fontSize: 14, lineHeight: 1.8 }}>
          <li>เปิดแอป <strong>LINE</strong> บนมือถือ</li>
          <li>ใช้ <strong>QR scan</strong> สแกน QR code ด้านบน</li>
          <li>กดยืนยันใน LIFF (ต้องเป็น Admin)</li>
          <li>กลับมาที่หน้านี้ — จะเข้าระบบอัตโนมัติ</li>
        </ol>
      </div>

      {/* Countdown */}
      <div
        style={{
          background: MINT_SOFT,
          borderRadius: 10,
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 12, color: MINT_DARK, fontWeight: 500 }}>
          QR code หมดอายุใน
        </div>
        <div style={{ fontSize: 16, color: MINT_DARK, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(secondsLeft)}
        </div>
      </div>

      {/* Status pulse */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: 12,
          color: MINT_MUTED,
          padding: '8px 0',
        }}
      >
        <span
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: MINT_MID,
            animation: 'pulse 1.4s ease-in-out infinite',
          }}
        />
        <span>กำลังรอ scan...</span>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
      </div>

      <button
        onClick={onRefresh}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: '#fff',
          color: MINT_DARK,
          border: `1px solid ${MINT_SOFT}`,
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          marginTop: 8,
        }}
      >
        🔄 สร้าง QR code ใหม่
      </button>
    </>
  );
}

function ExpiredView({ message, onRefresh }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⏰</div>
      <div style={{ fontSize: 16, color: MINT_DARK, fontWeight: 600, marginBottom: 8 }}>
        {message}
      </div>
      <div style={{ fontSize: 13, color: MINT_MUTED, marginBottom: 20 }}>
        กดปุ่มด้านล่างเพื่อสร้าง QR code ใหม่
      </div>
      <button
        onClick={onRefresh}
        style={{
          padding: '12px 32px',
          background: HEADER_GRADIENT,
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(93, 191, 160, 0.3)',
        }}
      >
        สร้าง QR Code ใหม่
      </button>
    </div>
  );
}

function ErrorView({ error, onRetry }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 16, color: ERROR_RED, fontWeight: 600, marginBottom: 8 }}>
        เกิดข้อผิดพลาด
      </div>
      <div
        style={{
          fontSize: 12, color: MINT_MUTED, marginBottom: 20,
          padding: '8px 12px', background: '#FEE',
          borderRadius: 8, fontFamily: 'monospace',
          wordBreak: 'break-all',
        }}
      >
        {error}
      </div>
      <button
        onClick={onRetry}
        style={{
          padding: '12px 32px',
          background: HEADER_GRADIENT,
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        ลองใหม่
      </button>
    </div>
  );
}

function SuccessView() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div
        style={{
          width: 64, height: 64, margin: '0 auto 16px',
          borderRadius: '50%',
          background: MINT_MID,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, color: '#fff',
          animation: 'pop 0.4s ease-out',
        }}
      >
        ✓
      </div>
      <style>{`@keyframes pop { from { transform: scale(0); } to { transform: scale(1); } }`}</style>
      <div style={{ fontSize: 18, color: MINT_DARK, fontWeight: 600, marginBottom: 4 }}>
        เข้าสู่ระบบสำเร็จ
      </div>
      <div style={{ fontSize: 13, color: MINT_MUTED }}>
        กำลังนำคุณเข้าสู่ Admin Console...
      </div>
    </div>
  );
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
