/**
 * main.jsx — path-based routing
 *
 * Logic:
 *   - URL starts with /admin → render AdminApp (no LIFF, lazy-loaded)
 *   - Otherwise → render the LIFF App
 *
 * AdminApp is lazy-loaded so QR-login + recharts + admin pages don't ship
 * inside the mobile LIFF bundle — they only download when a user hits /admin.
 */

import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import MemberApp from './MemberApp';

const AdminApp = lazy(() => import('./admin/AdminApp'));

const path = window.location.pathname;
const isAdminPath = path === '/admin' ||
                    path === '/admin/' ||
                    path.startsWith('/admin/');

// Member deep-link: ?view=member (also accepts /member path for symmetry)
const params = new URLSearchParams(window.location.search);
const isMemberView = params.get('view') === 'member' ||
                     path === '/member' ||
                     path === '/member/' ||
                     path.startsWith('/member/');

const AdminFallback = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: '#DCEEE3',
  }}>
    <div style={{
      width: 40, height: 40,
      border: '3px solid #DCEEE3',
      borderTopColor: '#5DBFA0',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const Root = isAdminPath
  ? <Suspense fallback={<AdminFallback />}><AdminApp /></Suspense>
  : isMemberView
    ? <MemberApp />
    : <App />;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {Root}
  </React.StrictMode>
);
