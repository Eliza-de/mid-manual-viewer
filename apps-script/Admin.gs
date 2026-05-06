/**
 * Admin.gs — Admin-only endpoints
 *
 * Phase 0: stubs only
 * Phase 7: full implementation
 *
 * Every admin function MUST first verify is_admin via assertAdmin()
 */

/**
 * Throws if the given lineUserId is not an active admin.
 */
function assertAdmin(lineUserId) {
  const user = getUserByLineId(lineUserId);
  if (!user) {
    throw new Error('Not registered');
  }
  if (user.status !== 'active') {
    throw new Error('Account not active');
  }
  if (!user.is_admin) {
    throw new Error('Admin privilege required');
  }
  return user;
}

// ========== User Management (Phase 7) ==========

function adminListPendingUsers(actorLineUserId) {
  assertAdmin(actorLineUserId);
  return { ok: true, users: getUsersByStatus('pending') };
}

function adminApproveUser(actorLineUserId, targetLineUserId) {
  assertAdmin(actorLineUserId);
  // Phase 7 implementation
  throw new Error('Not implemented in Phase 0');
}

function adminToggleAdmin(actorLineUserId, targetLineUserId, makeAdmin) {
  assertAdmin(actorLineUserId);
  // Phase 7 implementation
  throw new Error('Not implemented in Phase 0');
}

function adminDisableUser(actorLineUserId, targetLineUserId) {
  assertAdmin(actorLineUserId);
  // Phase 7 implementation
  throw new Error('Not implemented in Phase 0');
}

// ========== Document Management (Phase 7) ==========

function adminListAllDocuments(actorLineUserId) {
  assertAdmin(actorLineUserId);
  // Phase 7 implementation
  throw new Error('Not implemented in Phase 0');
}

function adminCreateDocument(actorLineUserId, docData) {
  assertAdmin(actorLineUserId);
  // Phase 7 implementation
  throw new Error('Not implemented in Phase 0');
}

function adminUpdateDocument(actorLineUserId, docId, updates) {
  assertAdmin(actorLineUserId);
  // Phase 7 implementation
  throw new Error('Not implemented in Phase 0');
}

function adminArchiveDocument(actorLineUserId, docId) {
  assertAdmin(actorLineUserId);
  // Phase 7 implementation
  throw new Error('Not implemented in Phase 0');
}

// ========== Log Viewer (Phase 7) ==========

function adminGetLogs(actorLineUserId, logType, limit) {
  assertAdmin(actorLineUserId);
  switch (logType) {
    case 'access':
      return { ok: true, logs: getRecentAccessLogs(limit) };
    case 'auth':
      return { ok: true, logs: getRecentAuthLogs(limit) };
    case 'audit':
      return { ok: true, logs: getRecentAuditLogs(limit) };
    default:
      return { ok: false, error: 'Unknown log type' };
  }
}
