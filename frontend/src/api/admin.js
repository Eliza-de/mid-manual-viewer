/**
 * Admin API client (Phase 7 + Phase 8/12 Search)
 */

import { post } from './client.js';

// ===== Document Upload =====

export async function createDocument(idToken, sessionToken, doc, pages) {
  return post('/api/admin/documents/create', {
    idToken, sessionToken,
    payload: { ...doc, pages }
  });
}

// ===== Users =====

export async function listUsers(idToken, sessionToken, options = {}) {
  // options: { status, search, department }
  const payload = {};
  if (options.status) payload.status = options.status;
  if (options.search) payload.search = options.search;
  if (options.department) payload.department = options.department;

  return post('/api/admin/users/list', {
    idToken, sessionToken, payload
  });
}

export async function listDepartments(idToken, sessionToken) {
  return post('/api/admin/users/departments', {
    idToken, sessionToken
  });
}

export async function approveUser(idToken, sessionToken, lineUserId) {
  return post('/api/admin/users/approve', {
    idToken, sessionToken, payload: { line_user_id: lineUserId }
  });
}

export async function disableUser(idToken, sessionToken, lineUserId, reason = '') {
  return post('/api/admin/users/disable', {
    idToken, sessionToken, payload: { line_user_id: lineUserId, reason }
  });
}

export async function enableUser(idToken, sessionToken, lineUserId) {
  return post('/api/admin/users/enable', {
    idToken, sessionToken, payload: { line_user_id: lineUserId }
  });
}

export async function toggleAdmin(idToken, sessionToken, lineUserId) {
  return post('/api/admin/users/toggleAdmin', {
    idToken, sessionToken, payload: { line_user_id: lineUserId }
  });
}

export async function resetUserPin(idToken, sessionToken, lineUserId) {
  return post('/api/admin/users/resetPin', {
    idToken, sessionToken, payload: { line_user_id: lineUserId }
  });
}

// ===== Documents =====

export async function listAllDocuments(idToken, sessionToken, options = {}) {
  // options: { status, search, category }
  const payload = {};
  if (options.status) payload.status = options.status;
  if (options.search) payload.search = options.search;
  if (options.category) payload.category = options.category;

  return post('/api/admin/documents/listAll', {
    idToken, sessionToken, payload
  });
}

export async function updateDocument(idToken, sessionToken, id, updates) {
  return post('/api/admin/documents/update', {
    idToken, sessionToken, payload: { id, updates }
  });
}

export async function archiveDocument(idToken, sessionToken, id) {
  return post('/api/admin/documents/archive', {
    idToken, sessionToken, payload: { id }
  });
}

export async function restoreDocument(idToken, sessionToken, id) {
  return post('/api/admin/documents/restore', {
    idToken, sessionToken, payload: { id }
  });
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

// ===== Stats =====

export async function getStats(idToken, sessionToken) {
  return post('/api/admin/stats', { idToken, sessionToken });
}
