/**
 * AdminDashboard — Phase 17 STUB
 *
 * TODO: Replace with V2 page from src/pages/AdminDashboard.jsx
 * (Adapt API calls: apiCall → adminAdminDashboard* from ../api/admin)
 */

import { useState, useEffect } from 'react';

const MINT_DARK = '#1F4D3F';
const MINT_MID = '#5DBFA0';
const MINT_SOFT = '#DCEEE3';
const MINT_MUTED = '#6B8278';
const ACCENT_ORANGE = '#E8965B';
const HEADER_GRADIENT = `linear-gradient(135deg, ${MINT_MID} 0%, ${MINT_DARK} 100%)`;

export default function AdminDashboard({ user, onNavigate }) {
  return (
    <div>
      {/* Header */}
      <div style={{
        background: '#fff',
        borderRadius: 14,
        padding: 24,
        marginBottom: 20,
        boxShadow: '0 1px 3px rgba(31, 77, 63, 0.06)',
        border: '0.5px solid rgba(31, 77, 63, 0.08)',
      }}>
        <h1 style={{
          margin: 0,
          fontSize: 24,
          fontWeight: 700,
          color: MINT_DARK,
          letterSpacing: '-0.3px',
        }}>
          📊 Dashboard
        </h1>
        <p style={{
          margin: '8px 0 0',
          fontSize: 14,
          color: MINT_MUTED,
        }}>
          ภาพรวมระบบและสถิติ
        </p>
      </div>

      {/* Coming Soon Card */}
      <div style={{
        background: '#fff',
        borderRadius: 14,
        padding: 48,
        textAlign: 'center',
        border: '0.5px solid rgba(31, 77, 63, 0.08)',
        boxShadow: '0 1px 3px rgba(31, 77, 63, 0.06)',
      }}>
        <div style={{
          width: 80,
          height: 80,
          margin: '0 auto 20px',
          borderRadius: '50%',
          background: HEADER_GRADIENT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          color: '#fff',
        }}>
          🚧
        </div>

        <div style={{
          fontSize: 18,
          color: MINT_DARK,
          fontWeight: 700,
          marginBottom: 8,
        }}>
          Coming Soon
        </div>

        <div style={{
          fontSize: 14,
          color: MINT_MUTED,
          marginBottom: 24,
          maxWidth: 480,
          margin: '0 auto 24px',
          lineHeight: 1.6,
        }}>
          หน้านี้จะถูก replace ด้วย V2 page จาก <code style={{
            background: MINT_SOFT,
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 12,
            color: MINT_DARK,
          }}>src/pages/AdminDashboard.jsx</code>
        </div>

        {/* Features list */}
        <div style={{
          background: MINT_SOFT,
          borderRadius: 10,
          padding: '14px 20px',
          maxWidth: 480,
          margin: '0 auto 24px',
          textAlign: 'left',
          fontSize: 13,
          color: MINT_DARK,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            📋 Features ที่จะมี:
          </div>
          <div style={{ color: MINT_MUTED }}>
            Stats cards, recent activity, quick actions
          </div>
        </div>

        {/* Logged-in user verification */}
        {user && (
          <div style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: '#fff',
            border: `1px solid ${MINT_SOFT}`,
            borderRadius: 10,
            fontSize: 12,
            color: MINT_MUTED,
          }}>
            <div style={{ fontWeight: 600, color: MINT_DARK, marginBottom: 2 }}>
              ✅ QR Login Working
            </div>
            <div>Logged in as: <strong style={{ color: MINT_DARK }}>{user.displayName}</strong></div>
            {user.department && <div>Department: {user.department}</div>}
            <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>
              LINE ID: {user.lineUserId?.slice(0, 12)}...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
