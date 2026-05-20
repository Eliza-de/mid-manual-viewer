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
    if (resp.status === 401) {
      console.warn('[admin] 401 on', path, '— backend อาจยังไม่รองรับ adminToken บน path นี้', data);
      throw new Error(data.error || `Backend ปฏิเสธ adminToken บน ${path} (401)`);
    }
    throw new Error(data.error || `API error ${resp.status}`);
  }

  return data;
}

/**
 * Encode a File/Blob to base64 (no data: prefix).
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

async function filesToBase64Pages(files) {
  const list = Array.isArray(files) ? files : [files];
  const out = [];
  for (const f of list) {
    if (!f) continue;
    const data = await fileToBase64(f);
    out.push({ data });
  }
  return out;
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
export const deleteUser         = (line_user_id) => adminCall('/api/admin/users/delete', { line_user_id });
export const updateUser         = (line_user_id, fields) => adminCall('/api/admin/users/update', { line_user_id, fields });
export const bulkApproveUsers   = (line_user_ids) => adminCall('/api/admin/users/bulkApprove', { line_user_ids });
export const bulkDisableUsers   = (line_user_ids, reason = '') => adminCall('/api/admin/users/bulkDisable', { line_user_ids, reason });
export const bulkEnableUsers    = (line_user_ids) => adminCall('/api/admin/users/bulkEnable', { line_user_ids });
export const bulkDeleteUsers    = (line_user_ids) => adminCall('/api/admin/users/bulkDelete', { line_user_ids });

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
export const bulkDeleteDocuments   = (document_ids) => adminCall('/api/admin/documents/bulkDelete', { document_ids });
export const bulkUpdateCategory    = (document_ids, category) => adminCall('/api/admin/documents/bulkUpdateCategory', { document_ids, category });

// File uploads — backend expects base64 in JSON, NOT multipart.
export async function createDocument(doc, files) {
  const pages = await filesToBase64Pages(files);
  return adminCall('/api/admin/documents/create', {
    title: doc.title || '',
    form_code: doc.form_code || doc.code || '',
    category: doc.category || '',
    description: doc.description || '',
    sort_order: doc.sort_order != null ? Number(doc.sort_order) : 999,
    pages,
  });
}

/**
 * Create a video-review document.
 *
 * @param doc        { title, form_code, description, sort_order, category }
 *                   category is forced to 'summary' (server also validates)
 * @param videoFile  File (mp4 or webm), max 50 MB
 * @param posterFile File (jpg/png/webp), optional, max 2 MB
 * @param duration   number (seconds), computed client-side from <video>.duration
 */
export async function createVideoDocument(doc, videoFile, posterFile, duration) {
  if (!videoFile) throw new Error('Missing video file');
  const videoData = await fileToBase64(videoFile);
  let poster = null;
  if (posterFile) {
    const posterData = await fileToBase64(posterFile);
    poster = { data: posterData, mime: posterFile.type || 'image/jpeg' };
  }
  return adminCall('/api/admin/documents/createVideo', {
    title: doc.title || '',
    form_code: doc.form_code || '',
    category: 'summary',
    description: doc.description || '',
    sort_order: doc.sort_order != null ? Number(doc.sort_order) : 999,
    video: {
      data: videoData,
      mime: videoFile.type || 'video/mp4',
      size: videoFile.size,
      duration: Math.max(0, Math.floor(Number(duration) || 0)),
    },
    poster,
  });
}

export async function replacePage(docId, pageNumber, file) {
  const data = await fileToBase64(file);
  return adminCall('/api/admin/documents/replacePage', {
    id: docId,
    page_number: Number(pageNumber),
    data,
  });
}

export async function appendPages(docId, files) {
  const pages = await filesToBase64Pages(files);
  return adminCall('/api/admin/documents/appendPages', {
    id: docId,
    pages,
  });
}

export async function replaceAllPages(docId, files) {
  const pages = await filesToBase64Pages(files);
  return adminCall('/api/admin/documents/replaceAllPages', {
    id: docId,
    pages,
  });
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
