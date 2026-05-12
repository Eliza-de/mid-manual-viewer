/**
 * main.jsx — UPDATED for Phase 17 path-based routing
 *
 * Logic:
 *   - URL starts with /admin → render AdminApp (no LIFF)
 *   - Otherwise → render existing LIFF App
 */

import React from 'react';
import ReactDOM from 'react-dom/client';


import App from './App';                   // existing LIFF app
import AdminApp from './admin/AdminApp';   // new Phase 17 admin

const path = window.location.pathname;
const isAdminPath = path === '/admin' ||
                    path === '/admin/' ||
                    path.startsWith('/admin/');

const Root = isAdminPath ? <AdminApp /> : <App />;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {Root}
  </React.StrictMode>
);
