/**
 * AdminApp — Root component for /admin/*
 *
 * Routing logic:
 * - Not logged in → QrLogin
 * - Logged in → AdminLayout with sub-pages
 *
 * No LIFF — entirely independent of LINE LIFF SDK
 */

import { useState, useEffect } from 'react';
import { loadAdminSession, clearAdminSession, getSessionTimeRemaining } from './lib/adminSession';
import { adminMe, adminLogout } from './api/admin';
import QrLogin from './pages/QrLogin';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import DocumentManagement from './pages/DocumentManagement';
import Analytics from './pages/Analytics';
import LogViewer from './pages/LogViewer';
import NotificationSettings from './pages/NotificationSettings';

// ===== Theme =====
const MINT_DARK = '#1F4D3F';
const MINT_MID = '#5DBFA0';
const MINT_SOFT = '#DCEEE3';
const MINT_MUTED = '#6B8278';
const HEADER_GRADIENT = `linear-gradient(135deg, ${MINT_MID} 0%, ${MINT_DARK} 100%)`;

// ===== Pages =====
const PAGES = {
  dashboard: { label: 'Dashboard', icon: '📊', component: AdminDashboard },
  users:     { label: 'Users',     icon: '👥', component: UserManagement },
  documents: { label: 'Documents', icon: '📄', component: DocumentManagement },
  analytics: { label: 'Analytics', icon: '📈', component: Analytics },
  logs:      { label: 'Logs',      icon: '📋', component: LogViewer },
  notif:     { label: 'Notify',    icon: '🔔', component: NotificationSettings },
};

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Initial session check
  useEffect(() => {
    const local = loadAdminSession();
    if (!local) {
      setChecking(false);
      return;
    }

    // Verify with server
    (async () => {
      try {
        const r = await adminMe();
        if (r.ok && r.user) {
          setSession({ ...local, user: r.user });
        } else {
          clearAdminSession();
        }
      } catch (e) {
        // adminMe handles auth failure & clears session
        clearAdminSession();
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  // ===== Loading =====
  if (checking) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: MINT_SOFT,
      }}>
        <div style={{
          width: 40, height: 40,
          border: `3px solid ${MINT_SOFT}`,
          borderTopColor: MINT_MID,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ===== Not logged in =====
  if (!session) {
    return <QrLogin onLogin={() => {
      const reloaded = loadAdminSession();
      if (reloaded) setSession(reloaded);
    }} />;
  }

  // ===== Logged in =====
  const CurrentComponent = PAGES[currentPage]?.component || AdminDashboard;

  const handleLogout = async () => {
    if (!confirm('ออกจากระบบ?')) return;
    await adminLogout();
    setSession(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F8F6',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Top bar */}
      <div style={{
        background: HEADER_GRADIENT,
        color: '#fff',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(31, 77, 63, 0.12)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>
            🌿 Lean Buddy
          </div>
          <div style={{
            fontSize: 11, padding: '3px 8px',
            background: 'rgba(255,255,255,0.18)',
            borderRadius: 6, fontWeight: 500,
          }}>
            Admin Console
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right', fontSize: 12 }}>
            <div style={{ fontWeight: 600 }}>{session.user.displayName}</div>
            <div style={{ opacity: 0.75, fontSize: 10 }}>
              ⏱ {getSessionTimeRemaining()} เหลือ
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: 'none', color: '#fff',
              padding: '8px 14px', borderRadius: 8,
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}
            title="Logout"
          >
            ออก
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{
        background: '#fff',
        padding: '0 24px',
        borderBottom: '0.5px solid rgba(31, 77, 63, 0.08)',
        display: 'flex',
        gap: 4,
        overflowX: 'auto',
        position: 'sticky', top: 56, zIndex: 99,
      }}>
        {Object.entries(PAGES).map(([key, p]) => {
          const active = currentPage === key;
          return (
            <button
              key={key}
              onClick={() => setCurrentPage(key)}
              style={{
                padding: '14px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: active ? `3px solid ${MINT_MID}` : '3px solid transparent',
                color: active ? MINT_DARK : MINT_MUTED,
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
              }}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Page content */}
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        <CurrentComponent
          user={session.user}
          onNavigate={setCurrentPage}
        />
      </div>
    </div>
  );
}
