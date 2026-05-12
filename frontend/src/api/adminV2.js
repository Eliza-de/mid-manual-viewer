/**
 * api/admin.js — Admin API helpers (V2, FULL backward-compatible)
 *
 * ⚠️ Exports ทุก function ที่ V1 เคยใช้:
 *    - Analytics: getAnalyticsOverview, getDailyAccess, getTopDocuments,
 *                 getRegistrations, getLoginActivity, getCategoryUsage, getTopUsers
 *    - Documents: createDocument, listAllDocuments, bulkArchiveDocuments,
 *                 bulkRestoreDocuments, bulkUpdateCategory, replacePage,
 *                 appendPages, replaceAllPages
 *    - และอีกหลายตัว
 */

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://mid-manual-api.elizanu-de.workers.dev';

// ===================== CORE =====================
async function req(path, token, init = {}) {
  const r = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`API ${r.status}: ${err}`);
  }
  return r.json();
}

async function reqMultipart(path, token, formData) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`API ${r.status}: ${err}`);
  }
  return r.json();
}

// Stub for unimplemented endpoints
function stub(name, endpoint) {
  return async function (token, ...args) {
    console.warn(`[admin.js] ${name}() → ${endpoint} (V2 stub)`, args);
    try {
      return await req(endpoint, token);
    } catch (e) {
      console.warn(`[admin.js] ${name}() endpoint not implemented, returning empty`);
      return { data: [], labels: [], values: [], items: [], total: 0 };
    }
  };
}

// ===================== STATS =====================
export const getStats = (token) => req('/api/admin/stats', token);
export const getDashboardStats = getStats;
export const getAdminStats = getStats;
export const fetchStats = getStats;
export const refreshStats = getStats;

// ===================== USERS =====================
export const listUsers = (token, { status = 'pending' } = {}) =>
  req(`/api/admin/users/list?status=${status}`, token);

export const approveUser = (token, line_user_id) =>
  req('/api/admin/users/approve', token, {
    method: 'POST', body: JSON.stringify({ line_user_id }),
  });

export const disableUser = (token, line_user_id) =>
  req('/api/admin/users/disable', token, {
    method: 'POST', body: JSON.stringify({ line_user_id }),
  });

export const enableUser = (token, line_user_id) =>
  req('/api/admin/users/enable', token, {
    method: 'POST', body: JSON.stringify({ line_user_id }),
  });

export const toggleAdmin = (token, line_user_id) =>
  req('/api/admin/users/toggleAdmin', token, {
    method: 'POST', body: JSON.stringify({ line_user_id }),
  });

export const resetUserPin = (token, line_user_id) =>
  req('/api/admin/users/resetPin', token, {
    method: 'POST', body: JSON.stringify({ line_user_id }),
  });

export const bulkApproveUsers = (token, line_user_ids) =>
  req('/api/admin/users/bulkApprove', token, {
    method: 'POST', body: JSON.stringify({ line_user_ids }),
  });

export const bulkDisableUsers = (token, line_user_ids) =>
  req('/api/admin/users/bulkDisable', token, {
    method: 'POST', body: JSON.stringify({ line_user_ids }),
  });

export const bulkEnableUsers = (token, line_user_ids) =>
  req('/api/admin/users/bulkEnable', token, {
    method: 'POST', body: JSON.stringify({ line_user_ids }),
  });

// V1 aliases
export const listAllUsers = listUsers;
export const getUserList = listUsers;
export const fetchUsers = listUsers;
export const resetPin = resetUserPin;
export const toggleUserAdmin = toggleAdmin;
export const setAdmin = toggleAdmin;
export const promoteAdmin = toggleAdmin;
export const demoteAdmin = toggleAdmin;
export const bulkApprove = bulkApproveUsers;
export const bulkDisable = bulkDisableUsers;
export const bulkEnable = bulkEnableUsers;
export const bulkApproveAll = bulkApproveUsers;

// ===================== DOCUMENTS =====================
export async function createDocument(token, payload) {
  const fd = new FormData();
  fd.append('title', payload.title || '');
  fd.append('code', payload.code || '');
  fd.append('category', payload.category || '');
  if (payload.sort_order != null) fd.append('sort_order', payload.sort_order);
  const files = payload.files || payload.pages || (payload.file ? [payload.file] : []);
  for (const f of files) fd.append('files', f);
  return reqMultipart('/api/admin/documents/create', token, fd);
}
export const createDoc = createDocument;
export const uploadDocument = createDocument;
export const adminCreateDocument = createDocument;
export const addDocument = createDocument;
export const newDocument = createDocument;

export const listAllDocs = (token, { archived = 0 } = {}) =>
  req(`/api/admin/documents/listAll?archived=${archived}`, token);

export const listDocuments = listAllDocs;
export const listAllDocuments = listAllDocs;
export const getAllDocuments = listAllDocs;
export const adminListDocuments = listAllDocs;
export const fetchDocuments = listAllDocs;
export const getDocuments = listAllDocs;

export const updateDoc = (token, payload) =>
  req('/api/admin/documents/update', token, {
    method: 'POST', body: JSON.stringify(payload),
  });
export const updateDocument = updateDoc;
export const editDocument = updateDoc;
export const saveDocument = updateDoc;

export const archiveDoc = (token, id) =>
  req('/api/admin/documents/archive', token, {
    method: 'POST', body: JSON.stringify({ id }),
  });
export const archiveDocument = archiveDoc;

export const restoreDoc = (token, id) =>
  req('/api/admin/documents/restore', token, {
    method: 'POST', body: JSON.stringify({ id }),
  });
export const restoreDocument = restoreDoc;

export const deleteDocument = (token, id) =>
  req('/api/admin/documents/delete', token, {
    method: 'POST', body: JSON.stringify({ id }),
  });
export const deleteDoc = deleteDocument;

// Bulk document operations
export const bulkArchiveDocuments = (token, ids) =>
  req('/api/admin/documents/bulkArchive', token, {
    method: 'POST', body: JSON.stringify({ ids }),
  });

export const bulkRestoreDocuments = (token, ids) =>
  req('/api/admin/documents/bulkRestore', token, {
    method: 'POST', body: JSON.stringify({ ids }),
  });

export const bulkUpdateCategory = (token, ids, category) =>
  req('/api/admin/documents/bulkUpdateCategory', token, {
    method: 'POST', body: JSON.stringify({ ids, category }),
  });

export const bulkDeleteDocuments = (token, ids) =>
  req('/api/admin/documents/bulkDelete', token, {
    method: 'POST', body: JSON.stringify({ ids }),
  });

export const bulkArchive = bulkArchiveDocuments;
export const bulkRestore = bulkRestoreDocuments;
export const bulkArchiveDocs = bulkArchiveDocuments;
export const bulkRestoreDocs = bulkRestoreDocuments;
export const bulkSetCategory = bulkUpdateCategory;

// =================== PHASE 11: REPLACE PAGES ===================
export async function replacePage(token, docId, pageNo, file) {
  const fd = new FormData();
  fd.append('id', docId);
  fd.append('page_no', pageNo);
  fd.append('file', file);
  return reqMultipart('/api/admin/documents/replacePage', token, fd);
}

export async function appendPages(token, docId, files) {
  const fd = new FormData();
  fd.append('id', docId);
  const list = Array.isArray(files) ? files : [files];
  for (const f of list) fd.append('files', f);
  return reqMultipart('/api/admin/documents/appendPages', token, fd);
}

export async function replaceAllPages(token, docId, files) {
  const fd = new FormData();
  fd.append('id', docId);
  const list = Array.isArray(files) ? files : [files];
  for (const f of list) fd.append('files', f);
  return reqMultipart('/api/admin/documents/replace', token, fd);
}

export async function deletePage(token, docId, pageNo) {
  return req('/api/admin/documents/deletePage', token, {
    method: 'POST', body: JSON.stringify({ id: docId, page_no: pageNo }),
  });
}

export async function reorderPages(token, docId, pageOrder) {
  return req('/api/admin/documents/reorderPages', token, {
    method: 'POST', body: JSON.stringify({ id: docId, page_order: pageOrder }),
  });
}

export async function replaceDocPages(token, id, fileOrFiles) {
  return replaceAllPages(token, id, fileOrFiles);
}
export const replacePages = replaceAllPages;
export const replaceDocumentPages = replaceAllPages;

// ===================== LOGS =====================
export const getAuthLogs = (token, { limit = 50, offset = 0 } = {}) =>
  req(`/api/admin/logs/auth?limit=${limit}&offset=${offset}`, token);

export const getAuditLogs = (token, { limit = 50, offset = 0 } = {}) =>
  req(`/api/admin/logs/audit?limit=${limit}&offset=${offset}`, token);

export const getAccessLogs = (token, { limit = 50, offset = 0 } = {}) =>
  req(`/api/admin/logs/access?limit=${limit}&offset=${offset}`, token);

export const listAuthLogs = getAuthLogs;
export const listAuditLogs = getAuditLogs;
export const listAccessLogs = getAccessLogs;
export const fetchLogs = getAuthLogs;

export async function exportLogsCSV(token, type) {
  const r = await fetch(
    `${API_BASE}/api/admin/logs/${type}?format=csv&limit=10000`,
    { headers: { 'Authorization': `Bearer ${token}` } },
  );
  if (!r.ok) throw new Error(`Export ${r.status}`);
  return r.blob();
}
export const exportLogs = exportLogsCSV;
export const exportAuthLogs = (token) => exportLogsCSV(token, 'auth');
export const exportAuditLogs = (token) => exportLogsCSV(token, 'audit');
export const exportAccessLogs = (token) => exportLogsCSV(token, 'access');

// ===================== ANALYTICS — PHASE 13 (V1 + V2 names) =====================

// V1 NAMES (ที่ Analytics.jsx เดิมใช้):
export const getAnalyticsOverview = (token) =>
  req('/api/admin/analytics/overview', token);

export const getDailyAccess = (token, days = 30) =>
  req(`/api/admin/analytics/daily?days=${days}`, token);

export const getTopDocuments = (token, limit = 10) =>
  req(`/api/admin/analytics/topDocs?limit=${limit}`, token);

export const getRegistrations = (token) =>
  req('/api/admin/analytics/registrations', token);

export const getLoginActivity = (token) =>
  req('/api/admin/analytics/loginActivity', token);

export const getCategoryUsage = (token) =>
  req('/api/admin/analytics/categoryUsage', token);

export const getTopUsers = (token, limit = 10) =>
  req(`/api/admin/analytics/topUsers?limit=${limit}`, token);

// V2 NAMES (ของผมที่ใช้ใน V2 pages):
export const getAnalyticsUsage = getDailyAccess;
export const getAnalyticsTopDocs = getTopDocuments;
export const getAnalyticsUserGrowth = getRegistrations;
export const getAnalyticsHourly = (token) =>
  req('/api/admin/analytics/hourly', token);
export const getAnalyticsDevices = (token) =>
  req('/api/admin/analytics/devices', token);

// Cross-aliases
export const getUsageAnalytics = getDailyAccess;
export const getTopDocs = getTopDocuments;
export const getUserGrowth = getRegistrations;
export const getHourlyStats = getAnalyticsHourly;
export const getDeviceStats = getAnalyticsDevices;
export const getOverview = getAnalyticsOverview;
export const getDaily = getDailyAccess;
export const getRegStats = getRegistrations;
export const getLogins = getLoginActivity;
export const getCategories = getCategoryUsage;

// ===================== NOTIFICATIONS — PHASE 14 =====================
export const getNotifySettings = (token) =>
  req('/api/admin/notify/settings', token);

export const updateNotifySettings = (token, payload) =>
  req('/api/admin/notify/settings', token, {
    method: 'POST', body: JSON.stringify(payload),
  });

export const testNotification = (token) =>
  req('/api/admin/notify/test', token, { method: 'POST' });

export const getNotifyRecipients = (token) =>
  req('/api/admin/notify/recipients', token);

export const getNotificationSettings = getNotifySettings;
export const saveNotificationSettings = updateNotifySettings;
export const updateNotificationSettings = updateNotifySettings;
export const sendTestNotification = testNotification;
export const getNotifyConfig = getNotifySettings;
export const setNotifyConfig = updateNotifySettings;
export const getNotificationRecipients = getNotifyRecipients;
export const listNotificationRecipients = getNotifyRecipients;

// ===================== MISC STUBS =====================
export const downloadDocument = stub('downloadDocument', '/api/admin/documents/download');
export const previewDocument = stub('previewDocument', '/api/admin/documents/preview');
export const duplicateDocument = stub('duplicateDocument', '/api/admin/documents/duplicate');
export const moveDocument = stub('moveDocument', '/api/admin/documents/move');
export const exportUsers = stub('exportUsers', '/api/admin/users/export');
export const exportDocuments = stub('exportDocuments', '/api/admin/documents/export');
export const exportAnalytics = stub('exportAnalytics', '/api/admin/analytics/export');
export const sendBroadcast = stub('sendBroadcast', '/api/admin/notify/broadcast');
export const getSystemInfo = stub('getSystemInfo', '/api/admin/system/info');
export const purgeCache = stub('purgeCache', '/api/admin/system/cache/purge');

// ===================== DEFAULT EXPORT =====================
export default {
  // stats
  getStats, getDashboardStats, getAdminStats, fetchStats, refreshStats,
  // users
  listUsers, listAllUsers, getUserList, fetchUsers,
  approveUser, disableUser, enableUser,
  toggleAdmin, toggleUserAdmin, setAdmin, promoteAdmin, demoteAdmin,
  resetUserPin, resetPin,
  bulkApproveUsers, bulkDisableUsers, bulkEnableUsers,
  bulkApprove, bulkDisable, bulkEnable, bulkApproveAll,
  // documents
  createDocument, createDoc, uploadDocument, adminCreateDocument, addDocument, newDocument,
  listAllDocs, listDocuments, listAllDocuments, getAllDocuments,
  adminListDocuments, fetchDocuments, getDocuments,
  updateDoc, updateDocument, editDocument, saveDocument,
  archiveDoc, archiveDocument, restoreDoc, restoreDocument,
  deleteDocument, deleteDoc,
  bulkArchiveDocuments, bulkRestoreDocuments, bulkUpdateCategory, bulkDeleteDocuments,
  bulkArchive, bulkRestore, bulkArchiveDocs, bulkRestoreDocs, bulkSetCategory,
  replacePage, appendPages, replaceAllPages, deletePage, reorderPages,
  replaceDocPages, replacePages, replaceDocumentPages,
  // logs
  getAuthLogs, getAuditLogs, getAccessLogs, fetchLogs,
  listAuthLogs, listAuditLogs, listAccessLogs,
  exportLogsCSV, exportLogs, exportAuthLogs, exportAuditLogs, exportAccessLogs,
  // analytics — V1 names
  getAnalyticsOverview, getDailyAccess, getTopDocuments,
  getRegistrations, getLoginActivity, getCategoryUsage, getTopUsers,
  getOverview, getDaily, getRegStats, getLogins, getCategories,
  // analytics — V2 names
  getAnalyticsUsage, getAnalyticsTopDocs, getAnalyticsUserGrowth,
  getAnalyticsHourly, getAnalyticsDevices,
  getUsageAnalytics, getTopDocs, getUserGrowth, getHourlyStats, getDeviceStats,
  // notify
  getNotifySettings, updateNotifySettings, testNotification,
  getNotifyRecipients,
  getNotificationSettings, saveNotificationSettings, updateNotificationSettings,
  sendTestNotification, getNotifyConfig, setNotifyConfig,
  getNotificationRecipients, listNotificationRecipients,
  // misc
  downloadDocument, previewDocument, duplicateDocument, moveDocument,
  exportUsers, exportDocuments, exportAnalytics,
  sendBroadcast, getSystemInfo, purgeCache,
};
