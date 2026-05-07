/**
 * Admin API client (Phases 7 + 8 + 9 + 10 + 11 + 12)
 */

import { post, postBlob } from './client.js';

// ===== Document Upload =====

export async function createDocument(idToken, sessionToken, doc, pages) {
  return post('/api/admin/documents/create', { idToken, sessionToken, payload: { ...doc, pages } });
}

// ===== Phase 11: Replace Pages =====

export async function replacePage(idToken, sessionToken, docId, pageNumber, base64Data) {
  return post('/api/admin/documents/replacePage', {
    idToken, sessionToken, payload: { id: docId, page_number: pageNumber, data: base64Data }
  });
}

export async function appendPages(idToken, sessionToken, docId, pages) {
  return post('/api/admin/documents/appendPages', { idToken, sessionToken, payload: { id: docId, pages } });
}

export async function replaceAllPages(idToken, sessionToken, docId, pages) {
  return post('/api/admin/documents/replaceAllPages', { idToken, sessionToken, payload: { id: docId, pages } });
}

// ===== Users =====

export async function listUsers(idToken, sessionToken, options = {}) {
  const payload = {};
  if (options.status) payload.status = options.status;
  if (options.search) payload.search = options.search;
  if (options.department) payload.department = options.department;
  return post('/api/admin/users/list', { idToken, sessionToken, payload });
}

export async function listDepartments(idToken, sessionToken) {
  return post('/api/admin/users/departments', { idToken, sessionToken });
}

export async function approveUser(idToken, sessionToken, lineUserId) {
  return post('/api/admin/users/approve', { idToken, sessionToken, payload: { line_user_id: lineUserId } });
}

export async function disableUser(idToken, sessionToken, lineUserId, reason = '') {
  return post('/api/admin/users/disable', { idToken, sessionToken, payload: { line_user_id: lineUserId, reason } });
}

export async function enableUser(idToken, sessionToken, lineUserId) {
  return post('/api/admin/users/enable', { idToken, sessionToken, payload: { line_user_id: lineUserId } });
}

export async function toggleAdmin(idToken, sessionToken, lineUserId) {
  return post('/api/admin/users/toggleAdmin', { idToken, sessionToken, payload: { line_user_id: lineUserId } });
}

export async function resetUserPin(idToken, sessionToken, lineUserId) {
  return post('/api/admin/users/resetPin', { idToken, sessionToken, payload: { line_user_id: lineUserId } });
}

// ===== Phase 9: Bulk Users =====

export async function bulkApproveUsers(idToken, sessionToken, lineUserIds) {
  return post('/api/admin/users/bulkApprove', { idToken, sessionToken, payload: { line_user_ids: lineUserIds } });
}

export async function bulkDisableUsers(idToken, sessionToken, lineUserIds, reason = '') {
  return post('/api/admin/users/bulkDisable', { idToken, sessionToken, payload: { line_user_ids: lineUserIds, reason } });
}

export async function bulkEnableUsers(idToken, sessionToken, lineUserIds) {
  return post('/api/admin/users/bulkEnable', { idToken, sessionToken, payload: { line_user_ids: lineUserIds } });
}

// ===== Documents =====

export async function listAllDocuments(idToken, sessionToken, options = {}) {
  const payload = {};
  if (options.status) payload.status = options.status;
  if (options.search) payload.search = options.search;
  if (options.category) payload.category = options.category;
  return post('/api/admin/documents/listAll', { idToken, sessionToken, payload });
}

export async function updateDocument(idToken, sessionToken, id, updates) {
  return post('/api/admin/documents/update', { idToken, sessionToken, payload: { id, updates } });
}

export async function archiveDocument(idToken, sessionToken, id) {
  return post('/api/admin/documents/archive', { idToken, sessionToken, payload: { id } });
}

export async function restoreDocument(idToken, sessionToken, id) {
  return post('/api/admin/documents/restore', { idToken, sessionToken, payload: { id } });
}

// ===== Phase 9: Bulk Documents =====

export async function bulkArchiveDocuments(idToken, sessionToken, documentIds) {
  return post('/api/admin/documents/bulkArchive', { idToken, sessionToken, payload: { document_ids: documentIds } });
}

export async function bulkRestoreDocuments(idToken, sessionToken, documentIds) {
  return post('/api/admin/documents/bulkRestore', { idToken, sessionToken, payload: { document_ids: documentIds } });
}

export async function bulkUpdateCategory(idToken, sessionToken, documentIds, category) {
  return post('/api/admin/documents/bulkUpdateCategory', { idToken, sessionToken, payload: { document_ids: documentIds, category } });
}

// ===== Logs =====

export async function getAuthLogs(idToken, sessionToken, options = {}) {
  return post('/api/admin/logs/auth', { idToken, sessionToken, payload: options });
}

export async function getAuditLogs(idToken, sessionToken, options = {}) {
  return post('/api/admin/logs/audit', { idToken, sessionToken, payload: options });
}

export async function getAccessLogs(idToken, sessionToken, options = {}) {
  return post('/api/admin/logs/access', { idToken, sessionToken, payload: options });
}

// ===== Phase 10: Export Logs to CSV =====

export async function exportAuthLogs(idToken, sessionToken, filters = {}) {
  return postBlob('/api/admin/logs/auth/export', {
    idToken, sessionToken, payload: filters
  }, 'auth-logs.csv');
}

export async function exportAuditLogs(idToken, sessionToken, filters = {}) {
  return postBlob('/api/admin/logs/audit/export', {
    idToken, sessionToken, payload: filters
  }, 'audit-logs.csv');
}

export async function exportAccessLogs(idToken, sessionToken, filters = {}) {
  return postBlob('/api/admin/logs/access/export', {
    idToken, sessionToken, payload: filters
  }, 'access-logs.csv');
}

// ===== Stats =====

export async function getStats(idToken, sessionToken) {
  return post('/api/admin/stats', { idToken, sessionToken });
}
