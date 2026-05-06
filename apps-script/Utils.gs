/**
 * Utils.gs — Shared utilities
 */

/**
 * Get a sheet by name from the active spreadsheet.
 * Throws if sheet not found.
 */
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error('Sheet not found: ' + name);
  }
  return sheet;
}

/**
 * Get the spreadsheet ID — useful for logging.
 */
function getSpreadsheetId() {
  return SpreadsheetApp.getActiveSpreadsheet().getId();
}

/**
 * Format a Date as ISO 8601 string.
 */
function toIsoString(date) {
  return (date instanceof Date ? date : new Date(date)).toISOString();
}

/**
 * Safe JSON parse.
 */
function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

/**
 * Get user agent from request event (best effort).
 * Apps Script doesn't expose all headers, but we can grab from postData if frontend sends it.
 */
function getUserAgentFromRequest(e) {
  try {
    if (e && e.postData) {
      const body = JSON.parse(e.postData.contents);
      return body.userAgent || '';
    }
  } catch (_) {}
  return '';
}
