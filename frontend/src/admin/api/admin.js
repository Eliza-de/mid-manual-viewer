/**
 * Admin API Client — Phase 17 + V2 admin pages
 *
 * Different from LIFF api.js:
 * - Sends { adminToken, payload } instead of { idToken, sessionToken, payload }
 * - On 401 with needsLogin: true → clears session + redirects to /admin (QR login)
 */

import { getAdminToken, clearAdminSession } from '../lib/adminSession';

const API_BASE = import.meta.env.VITE_API_BASE_URL ||
                 'https://mid-manual-api.elizanu-de.workers.dev';

/**
 * Generic admin API call (JSON in, JSON out)
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

/**
 * Multipart admin call — for file uploads.
 * adminToken goes into FormData; backend reads from form field.
 */
async function adminMultipart(path, formData) {
  const adminToken = getAdminToken();
  if (!adminToken) {
    handleAuthFailure();
    throw new Error('Not logged in');
  }
  formData.append('adminToken', adminToken);

  let resp;
  try {
    resp = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      body: formData
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

/**
 * Blob download (CSV export) — adminToken goes in body as JSON.
 */
async function adminDownload(path, payload = {}, filename = 'export.csv') {
  const adminToken = getAdminToken();
  if (!adminToken) {
    handleAuthFailure();
    throw new Error('Not logged in');
  }

  const resp = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminToken, payload })
  });

  if (!resp.ok) {
    if (resp.status === 401) {
      handleAuthFailure();
      throw new Error('Session expired');
    }
    throw new Error(`Export error ${resp.status}`);
  }

  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
// Stats
// ============================================

export const getStats = () => adminCall('/api/admin/stats');

// ============================================
// Users
// ============================================

export const listUsers          = (opts = {}) => adminCall('/api/admin/users/list', opts);
export const approveUser        = (line_user_id) => adminCall('/api/admin/users/approve', { line_user_id });
export const disableUser        = (line_user_id, reason = '') => adminCall('/api/admin/users/disable', { line_user_id, reason });
export const enableUser         = (line_user_id) => adminCall('/api/admin/users/enable', { line_user_id });
export const toggleAdmin        = (line_user_id) => adminCall('/api/admin/users/toggleAdmin', { line_user_id });
export const resetUserPin       = (line_user_id) => adminCall('/api/admin/users/resetPin', { line_user_id });
export const bulkApproveUsers   = (line_user_ids) => adminCall('/api/admin/users/bulkApprove', { line_user_ids });
export const bulkDisableUsers   = (line_user_ids, reason = '') => adminCall('/api/admin/users/bulkDisable', { line_user_ids, reason });
export const bulkEnableUsers    = (line_user_ids) => adminCall('/api/admin/users/bulkEnable', { line_user_ids });

// ============================================
// Documents
// ============================================

export const listAllDocuments    = (opts = {}) => adminCall('/api/admin/documents/listAll', opts);
export const updateDocument      = (id, updates) => adminCall('/api/admin/documents/update', { id, updates });
export const archiveDocument     = (id) => adminCall('/api/admin/documents/archive', { id });
export const restoreDocument     = (id) => adminCall('/api/admin/documents/restore', { id });
export const deleteDocument      = (id) => adminCall('/api/admin/documents/delete', { id });
export const bulkArchiveDocuments  = (document_ids) => adminCall('/api/admin/documents/bulkArchive', { document_ids });
export const bulkRestoreDocuments  = (document_ids) => adminCall('/api/admin/documents/bulkRestore', { document_ids });
export const bulkUpdateCategory    = (document_ids, category) => adminCall('/api/admin/documents/bulkUpdateCategory', { document_ids, category });

// Multipart uploads
export async function createDocument(doc, files) {
  const fd = new FormData();
  fd.append('title', doc.title || '');
  fd.append('form_code', doc.form_code || doc.code || '');
  fd.append('category', doc.category || '');
  if (doc.description != null) fd.append('description', doc.description);
  if (doc.sort_order != null) fd.append('sort_order', doc.sort_order);
  const list = Array.isArray(files) ? files : (files ? [files] : []);
  for (const f of list) fd.append('files', f);
  return adminMultipart('/api/admin/documents/create', fd);
}

export async function replacePage(docId, pageNumber, file) {
  const fd = new FormData();
  fd.append('id', docId);
  fd.append('page_number', pageNumber);
  fd.append('file', file);
  return adminMultipart('/api/admin/documents/replacePage', fd);
}

export async function appendPages(docId, files) {
  const fd = new FormData();
  fd.append('id', docId);
  const list = Array.isArray(files) ? files : [files];
  for (const f of list) fd.append('files', f);
  return adminMultipart('/api/admin/documents/appendPages', fd);
}

export async function replaceAllPages(docId, files) {
  const fd = new FormData();
  fd.append('id', docId);
  const list = Array.isArray(files) ? files : [files];
  for (const f of list) fd.append('files', f);
  return adminMultipart('/api/admin/documents/replaceAllPages', fd);
}

// ============================================
// Logs
// ============================================

export const getAuthLogs   = (opts = {}) => adminCall('/api/admin/logs/auth', opts);
export const getAuditLogs  = (opts = {}) => adminCall('/api/admin/logs/audit', opts);
export const getAccessLogs = (opts = {}) => adminCall('/api/admin/logs/access', opts);

export const exportAuthLogs   = (filters = {}) => adminDownload('/api/admin/logs/auth/export', filters, 'auth-logs.csv');
export const exportAuditLogs  = (filters = {}) => adminDownload('/api/admin/logs/audit/export', filters, 'audit-logs.csv');
export const exportAccessLogs = (filters = {}) => adminDownload('/api/admin/logs/access/export', filters, 'access-logs.csv');

// ============================================
// Analytics
// ============================================

export const getAnalyticsOverview = (days = 30) => adminCall('/api/admin/analytics/overview', { days });
export const getDailyAccess       = (days = 30) => adminCall('/api/admin/analytics/dailyAccess', { days });
export const getTopDocuments      = (days = 30, limit = 10) => adminCall('/api/admin/analytics/topDocuments', { days, limit });
export const getRegistrations     = (days = 30) => adminCall('/api/admin/analytics/registrations', { days });
export const getLoginActivity     = (days = 7)  => adminCall('/api/admin/analytics/loginActivity', { days });
export const getCategoryUsage     = (days = 30) => adminCall('/api/admin/analytics/categoryUsage', { days });
export const getTopUsers          = (days = 30, limit = 10) => adminCall('/api/admin/analytics/topUsers', { days, limit });

// ============================================
// Notifications
// ============================================

export const getNotificationSettings   = ()        => adminCall('/api/admin/notifications/settings');
export const updateNotificationSettings = (updates) => adminCall('/api/admin/notifications/update', updates);
export const testNotification          = ()        => adminCall('/api/admin/notifications/test');
export const getNotificationRecipients = ()        => adminCall('/api/admin/notifications/recipients');
