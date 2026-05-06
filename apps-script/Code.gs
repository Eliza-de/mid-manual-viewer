/**
 * MID Manual Viewer — Backend Web App
 * Phase 0: Foundation
 *
 * Entry point for all HTTP requests.
 * Routes actions to handlers in other .gs files.
 *
 * Endpoints:
 *   GET  ?action=ping              → health check, no auth
 *   POST { action, idToken, ... }  → all other actions
 */

// ========== Constants ==========
const APP_VERSION = '0.1.0';
const APP_NAME = 'MID Manual Viewer';

// ========== HTTP Entry Points ==========

/**
 * GET handler — only used for ping/health check.
 * All real actions go through doPost.
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';

  if (action === 'ping') {
    return jsonResponse({
      ok: true,
      message: 'pong',
      version: APP_VERSION,
      app: APP_NAME,
      timestamp: new Date().toISOString()
    });
  }

  return jsonResponse({
    ok: false,
    error: 'GET endpoints not supported. Use POST.'
  });
}

/**
 * POST handler — all authenticated actions.
 * Expected request body (JSON):
 *   {
 *     "action": "register" | "login" | "getDocuments" | ...,
 *     "idToken": "eyJ...",   // LIFF ID token (required for most actions)
 *     "payload": { ... }      // action-specific data
 *   }
 */
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Invalid JSON' });
  }

  const action = body.action;
  const idToken = body.idToken;
  const payload = body.payload || {};

  if (!action) {
    return jsonResponse({ ok: false, error: 'Missing action' });
  }

  try {
    return routeAction(action, idToken, payload);
  } catch (err) {
    Logger.log('doPost error: ' + err.toString() + '\n' + err.stack);
    return jsonResponse({
      ok: false,
      error: 'Internal error',
      // Don't expose stack in production; for Phase 0 keep for debugging
      detail: err.toString()
    });
  }
}

// ========== Action Router ==========

function routeAction(action, idToken, payload) {
  // Public actions (no token required)
  if (action === 'ping') {
    return jsonResponse({
      ok: true,
      message: 'pong',
      version: APP_VERSION,
      timestamp: new Date().toISOString()
    });
  }

  // All other actions require a valid LIFF ID token
  const tokenResult = verifyLiffToken(idToken);
  if (!tokenResult.ok) {
    return jsonResponse({
      ok: false,
      error: 'Authentication failed: ' + tokenResult.error
    });
  }

  const lineUserId = tokenResult.lineUserId;
  const profile = tokenResult.profile;

  // Phase 0: only "checkRegistration" implemented
  // Other actions added in later phases
  switch (action) {
    case 'checkRegistration':
      return handleCheckRegistration(lineUserId, profile);

    case 'whoami':
      return handleWhoAmI(lineUserId, profile);

    // ========== Phase 1+ stubs ==========
    case 'register':
      return jsonResponse({ ok: false, error: 'Not implemented in Phase 0' });
    case 'setPin':
      return jsonResponse({ ok: false, error: 'Not implemented in Phase 0' });
    case 'verifyPin':
      return jsonResponse({ ok: false, error: 'Not implemented in Phase 0' });
    case 'getDocuments':
      return jsonResponse({ ok: false, error: 'Not implemented in Phase 0' });
    case 'getPage':
      return jsonResponse({ ok: false, error: 'Not implemented in Phase 0' });

    // ========== Admin stubs ==========
    case 'admin.listPendingUsers':
    case 'admin.approveUser':
    case 'admin.toggleAdmin':
    case 'admin.disableUser':
    case 'admin.listDocuments':
    case 'admin.createDocument':
    case 'admin.updateDocument':
    case 'admin.archiveDocument':
    case 'admin.getLogs':
      return jsonResponse({ ok: false, error: 'Admin actions not in Phase 0' });

    default:
      return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
  }
}

// ========== Phase 0 Handlers ==========

/**
 * Check if a LINE user is registered in the system.
 * Returns user status without exposing other users' data.
 */
function handleCheckRegistration(lineUserId, profile) {
  const user = getUserByLineId(lineUserId);
  const bootstrapAdminId = getConfig('bootstrap_admin_line_id');

  if (!user) {
    // Check if this is the bootstrap admin
    const isBootstrapAdmin = bootstrapAdminId && bootstrapAdminId === lineUserId;

    return jsonResponse({
      ok: true,
      registered: false,
      isBootstrapAdmin: !!isBootstrapAdmin,
      lineUserId: lineUserId,
      profile: profile
    });
  }

  return jsonResponse({
    ok: true,
    registered: true,
    status: user.status,
    isAdmin: user.is_admin === true || user.is_admin === 'TRUE',
    displayName: user.display_name,
    department: user.department,
    hasPin: !!user.pin_hash,
    locked: isUserLocked(user)
  });
}

/**
 * Simple endpoint to confirm token verification works end-to-end.
 * Used in Phase 0 smoke test.
 */
function handleWhoAmI(lineUserId, profile) {
  return jsonResponse({
    ok: true,
    lineUserId: lineUserId,
    profile: profile,
    serverTime: new Date().toISOString(),
    version: APP_VERSION
  });
}

// ========== Helpers ==========

/**
 * Build a JSON HTTP response.
 * Apps Script Web Apps don't need explicit CORS headers — they're allowed by default.
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
