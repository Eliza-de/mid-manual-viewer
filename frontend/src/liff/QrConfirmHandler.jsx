/**
 * QR Confirm Handler — runs in LIFF after admin scans QR
 *
 * When LIFF URL has ?pair=xxx:
 *   1. Block normal LIFF UI
 *   2. Call /api/admin/qr/confirm with LIFF idToken
 *   3. Show success/fail message
 *   4. Tell user to return to desktop
 *
 * Must be called AFTER LIFF init + user is logged in (LIFF auto-login if needed)
 */

import { useState, useEffect } from 'react';
import { apiCall } from '../api';   // existing LIFF api client

// Theme tokens
const MINT_DARK = '#1F4D3F';
const MINT_MID = '#5DBFA0';
const MINT_SOFT = '#DCEEE3';
const MINT_MUTED = '#6B8278';
const ACCENT_ORANGE = '#E8965B';
const ERROR_RED = '#EF4444';
const HEADER_GRADIENT = `linear-gradient(135deg, ${MINT_MID} 0%, ${MINT_DARK} 100%)`;

export default function QrConfirmHandler({ pairCode }) {
  const [state, setState] = useState({
    status: 'confirming',   // confirming | success | error
    error: null,
    displayName: null,
  });

  useEffect(() => {
    let canceled = false;

    (async () => {
      try {
        const r = await apiCall('/api/admin/qr/confirm', { pairCode });
        if (canceled) return;
        if (r.ok) {
          setState({ status: 'success', error: null, displayName: r.displayName });
        } else {
          throw new Error(r.error || 'Confirm failed');
        }
      } catch (e) {
        if (canceled) return;
        setState({ status: 'error', error: e.message, displayName: null });
      }
    })();

    return () => { canceled = true; };
  }, [pairCode]);

  return (
    <div style={{
      minHeight: '100vh',
      background: MINT_SOFT,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 10px 30px rgba(31, 77, 63, 0.1)',
        overflow: 'hidden',
        border: '0.5px solid rgba(31, 77, 63, 0.08)',
      }}>
        {/* Header */}
        <div style={{
          background: HEADER_GRADIENT,
          color: '#fff',
          padding: '20px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>
            🌿 Lean Buddy
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            Desktop Login
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '40px 28px', textAlign: 'center' }}>
          {state.status === 'confirming' && (
            <>
              <div style={{
                width: 48, height: 48,
                border: `4px solid ${MINT_SOFT}`,
                borderTopColor: MINT_MID,
                borderRadius: '50%',
                margin: '0 auto 20px',
                animation: 'spin 0.8s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 16, color: MINT_DARK, fontWeight: 600 }}>
                กำลังยืนยัน...
              </div>
              <div style={{ fontSize: 13, color: MINT_MUTED, marginTop: 8 }}>
                กรุณารอสักครู่
              </div>
            </>
          )}

          {state.status === 'success' && (
            <>
              <div style={{
                width: 72, height: 72,
                borderRadius: '50%',
                background: MINT_MID,
                color: '#fff',
                fontSize: 38,
                margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pop 0.4s ease-out',
              }}>
                ✓
              </div>
              <style>{`@keyframes pop { from { transform: scale(0); } to { transform: scale(1); } }`}</style>

              <div style={{ fontSize: 18, color: MINT_DARK, fontWeight: 700, marginBottom: 6 }}>
                เข้าสู่ระบบสำเร็จ
              </div>
              {state.displayName && (
                <div style={{ fontSize: 13, color: MINT_MUTED, marginBottom: 24 }}>
                  ผู้ใช้: <strong style={{ color: MINT_DARK }}>{state.displayName}</strong>
                </div>
              )}

              <div style={{
                padding: '14px 16px',
                background: MINT_SOFT,
                borderRadius: 10,
                fontSize: 13,
                color: MINT_DARK,
                lineHeight: 1.6,
                marginTop: 16,
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  📱 กลับไปที่ Desktop
                </div>
                <div>
                  หน้า browser บนคอมพิวเตอร์จะเข้าสู่ Admin Console อัตโนมัติ
                </div>
              </div>

              <div style={{
                fontSize: 11,
                color: MINT_MUTED,
                marginTop: 16,
              }}>
                ปิดหน้าต่างนี้ได้ทันที
              </div>
            </>
          )}

          {state.status === 'error' && (
            <>
              <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
              <div style={{ fontSize: 18, color: ERROR_RED, fontWeight: 700, marginBottom: 8 }}>
                ไม่สามารถเข้าสู่ระบบได้
              </div>
              <div style={{
                fontSize: 13,
                color: '#666',
                padding: '12px 16px',
                background: '#FEE',
                borderRadius: 10,
                marginTop: 12,
                textAlign: 'left',
              }}>
                {state.error}
              </div>

              <div style={{
                fontSize: 12,
                color: MINT_MUTED,
                marginTop: 20,
                lineHeight: 1.6,
              }}>
                สาเหตุที่เป็นไปได้:
                <ul style={{ textAlign: 'left', paddingLeft: 20, marginTop: 8 }}>
                  <li>QR code หมดอายุ (เกิน 5 นาที)</li>
                  <li>QR code ถูกใช้ไปแล้ว</li>
                  <li>คุณไม่ใช่ Admin</li>
                </ul>
              </div>

              <div style={{ marginTop: 20, fontSize: 12, color: MINT_MUTED }}>
                กรุณาสร้าง QR code ใหม่บน Desktop
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
