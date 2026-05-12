/**
 * Admin API Client — Phase 17
 *
 * Different from LIFF api.js:
 * - Sends { adminToken, payload } instead of { idToken, sessionToken, payload }
 * - On 401 with needsLogin: true → clears session + redirects to /admin (QR login)
 */

import { getAdminToken, clearAdminSession } from '../lib/adminSession';

const API_BASE = import.meta.env.VITE_API_BASE_URL ||
                 'https://mid-manual-api.elizanu-de.workers.dev';

/**
 * Generic admin API call
 */
async function adminCall(path, payload = {}) {
  const adminToken = getAdminToken();
  if (!adminToken) {
    handleAuthFailure();
    throw new Error('Not logged in');
  }

  const url = `${API_BASE}${path}`;
  let resp;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminToken, payload })
    });
  } catch (e) {
    throw new Error('Network error: ' + e.message);
  }

  let data;
  try {
    data = await resp.json();
  } catch {
    throw new Error(`API error ${resp.status}: invalid JSON`);
  }

  if (!resp.ok || data.ok === false) {
    if (resp.status === 401 && data.needsLogin) {
      handleAuthFailure();
      throw new Error('Session expired');
    }
    throw new Error(data.error || `API error ${resp.status}`);
  }

  return data;
}

function handleAuthFailure() {
  clearAdminSession();
  if (window.location.pathname !== '/admin' && !window.location.pathname.endsWith('/admin/')) {
    window.location.href = '/admin';
  }
}

// ============================================
// QR Login (no admin token needed)
// ============================================

export async function qrInit() {
  const resp = await fetch(`${API_BASE}/api/admin/qr/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  return resp.json();
}

export async function qrPoll(pairCode) {
  const resp = await fetch(`${API_BASE}/api/admin/qr/poll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pairCode })
  });
  return resp.json();
}

// ============================================
// Session
// ============================================

export async function adminMe() {
  return adminCall('/api/admin/qr/me');
}

export async function adminLogout() {
  try {
    await adminCall('/api/admin/qr/logout');
  } catch {}
  clearAdminSession();
}

// ============================================
// Admin API endpoints (existing routes)
// ============================================

// Users
export const adminUsersList    = (p) => adminCall('/api/admin/users/list', p);
export const adminUsersUpdate  = (p) => adminCall('/api/admin/users/update', p);
export const adminUsersApprove = (p) => adminCall('/api/admin/users/approve', p);
export const adminUsersReject  = (p) => adminCall('/api/admin/users/reject', p);
export const adminUsersExport  = (p) => adminCall('/api/admin/users/export', p);

// Documents
export const adminDocsList     = (p) => adminCall('/api/admin/documents/list', p);
export const adminDocsUpload   = (p) => adminCall('/api/admin/documents/upload', p);
export const adminDocsDelete   = (p) => adminCall('/api/admin/documents/delete', p);
export const adminDocsUpdate   = (p) => adminCall('/api/admin/documents/update', p);
export const adminDocsReplace  = (p) => adminCall('/api/admin/documents/replace', p);

// Logs
export const adminLogsList     = (p) => adminCall('/api/admin/logs/list', p);
export const adminLogsExport   = (p) => adminCall('/api/admin/logs/export', p);

// Stats / Analytics
export const adminStats        = (p) => adminCall('/api/admin/stats', p);
export const adminAnalytics    = (p) => adminCall('/api/admin/analytics', p);

// Notifications
export const adminNotifGet     = (p) => adminCall('/api/admin/notifications/get', p);
export const adminNotifUpdate  = (p) => adminCall('/api/admin/notifications/update', p);
export const adminNotifTest    = (p) => adminCall('/api/admin/notifications/test', p);
