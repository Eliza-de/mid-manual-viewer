/**
 * Logs.gs — Logging functions for AccessLogs, AuthLogs, AuditLogs
 *
 * All log writes are append-only.
 * Functions are fail-soft: log errors to Logger.log but never throw.
 */

const ACCESS_LOGS_SHEET = 'AccessLogs';
const AUTH_LOGS_SHEET = 'AuthLogs';
const AUDIT_LOGS_SHEET = 'AuditLogs';

// ========== Auth Logs ==========

/**
 * Log an authentication event.
 * @param {string} lineUserId
 * @param {string} action - register | login_success | login_fail | pin_change | logout | locked
 * @param {string} details - human-readable detail
 * @param {string} userAgent - optional
 */
function logAuth(lineUserId, action, details, userAgent) {
  try {
    const sheet = getSheet(AUTH_LOGS_SHEET);
    sheet.appendRow([
      Utilities.getUuid(),
      new Date().toISOString(),
      lineUserId || '',
      action,
      details || '',
      userAgent || ''
    ]);
  } catch (err) {
    Logger.log('logAuth failed: ' + err.toString());
  }
}

// ========== Access Logs ==========

/**
 * Log a document access event.
 */
function logAccess(lineUserId, documentId, action, pageNumber, userAgent, sessionId) {
  try {
    const sheet = getSheet(ACCESS_LOGS_SHEET);
    sheet.appendRow([
      Utilities.getUuid(),
      new Date().toISOString(),
      lineUserId || '',
      documentId || '',
      action,
      pageNumber || '',
      userAgent || '',
      sessionId || ''
    ]);
  } catch (err) {
    Logger.log('logAccess failed: ' + err.toString());
  }
}

// ========== Audit Logs ==========

/**
 * Log an admin action.
 */
function logAudit(actorLineUserId, action, target, details) {
  try {
    const sheet = getSheet(AUDIT_LOGS_SHEET);
    sheet.appendRow([
      Utilities.getUuid(),
      new Date().toISOString(),
      actorLineUserId || '',
      action,
      target || '',
      typeof details === 'object' ? JSON.stringify(details) : (details || '')
    ]);
  } catch (err) {
    Logger.log('logAudit failed: ' + err.toString());
  }
}

// ========== Query Logs (Phase 7 admin viewer) ==========

function getRecentAccessLogs(limit) {
  return getRecentLogs(ACCESS_LOGS_SHEET, limit || 100);
}

function getRecentAuthLogs(limit) {
  return getRecentLogs(AUTH_LOGS_SHEET, limit || 100);
}

function getRecentAuditLogs(limit) {
  return getRecentLogs(AUDIT_LOGS_SHEET, limit || 100);
}

function getRecentLogs(sheetName, limit) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return []; // only header

  const startRow = Math.max(2, lastRow - limit + 1);
  const numRows = lastRow - startRow + 1;
  const data = sheet.getRange(startRow, 1, numRows, sheet.getLastColumn()).getValues();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const result = data.map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
  // Most recent first
  return result.reverse();
}
