/**
 * MID Manual Viewer — Backend Web App
 * Phase 2: Document List
 *
 * เพิ่ม: getDocuments action
 * ลด: debug log ที่เคยเปิดไว้ตอนแก้บั๊ก Phase 1
 */

const APP_VERSION = '0.3.0';
const APP_NAME = 'MID Manual Viewer';

// ========== HTTP Entry Points ==========

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
  return jsonResponse({ ok: false, error: 'GET endpoints not supported. Use POST.' });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Invalid JSON' });
  }

  const action = body.action;
  const idToken = body.idToken;
  const sessionToken = body.sessionToken;
  const payload = body.payload || {};
  const userAgent = body.userAgent || '';

  if (!action) {
    return jsonResponse({ ok: false, error: 'Missing action' });
  }

  try {
    return routeAction(action, idToken, sessionToken, payload, userAgent);
  } catch (err) {
    Logger.log('doPost error: ' + err.toString() + '\n' + err.stack);
    return jsonResponse({
      ok: false,
      error: 'Internal error',
      detail: err.toString()
    });
  }
}

// ========== Action Router ==========

function routeAction(action, idToken, sessionToken, payload, userAgent) {
  // Public actions
  if (action === 'ping') {
    return jsonResponse({
      ok: true, message: 'pong', version: APP_VERSION,
      timestamp: new Date().toISOString()
    });
  }

  // All other actions require valid LIFF ID token
  const tokenResult = verifyLiffToken(idToken);
  if (!tokenResult.ok) {
    return jsonResponse({ ok: false, error: 'Authentication failed: ' + tokenResult.error });
  }
  const lineUserId = tokenResult.lineUserId;
  const profile = tokenResult.profile;

  switch (action) {
    case 'whoami':
      return handleWhoAmI(lineUserId, profile);
    case 'checkRegistration':
      return handleCheckRegistration(lineUserId, profile);

    // Phase 1
    case 'register':
      return handleRegister(lineUserId, profile, payload, userAgent);
    case 'setPin':
      return handleSetPin(lineUserId, profile, payload, userAgent);
    case 'verifyPin':
      return handleVerifyPin(lineUserId, profile, payload, userAgent);

    // Phase 2 — needs session token
    case 'getDocuments':
      return handleGetDocuments(lineUserId, sessionToken, payload, userAgent);

    // Phase 3+ stubs
    case 'getPage':
      return jsonResponse({ ok: false, error: 'Not implemented in Phase 2' });

    // Admin stubs
    case 'admin.listPendingUsers':
    case 'admin.approveUser':
    case 'admin.toggleAdmin':
    case 'admin.disableUser':
    case 'admin.listDocuments':
    case 'admin.createDocument':
    case 'admin.updateDocument':
    case 'admin.archiveDocument':
    case 'admin.getLogs':
      return jsonResponse({ ok: false, error: 'Admin actions not in Phase 2' });

    default:
      return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
  }
}

// ========== Helper: require valid session ==========

/**
 * Verify session token and ensure it matches the LIFF user.
 * Returns { ok, payload?, error? }
 */
function requireValidSession(lineUserId, sessionToken) {
  if (!sessionToken) {
    return { ok: false, error: 'No session token. Please login again.' };
  }
  const v = verifySessionToken(sessionToken);
  if (!v.ok) {
    return { ok: false, error: 'Session invalid: ' + v.error };
  }
  if (v.payload.uid !== lineUserId) {
    return { ok: false, error: 'Session user mismatch' };
  }
  return { ok: true, payload: v.payload };
}

// ========== Handlers ==========

function handleWhoAmI(lineUserId, profile) {
  return jsonResponse({
    ok: true,
    lineUserId: lineUserId,
    profile: profile,
    serverTime: new Date().toISOString(),
    version: APP_VERSION
  });
}

function handleCheckRegistration(lineUserId, profile) {
  const user = getUserByLineId(lineUserId);
  const bootstrapAdminId = getConfig('bootstrap_admin_line_id');

  if (!user) {
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
    isAdmin: !!user.is_admin,
    displayName: user.display_name,
    department: user.department,
    hasPin: !!user.pin_hash,
    locked: isUserLocked(user),
    lockedUntil: user.pin_locked_until || null
  });
}

// ========== Phase 1: Register / setPin / verifyPin ==========

function handleRegister(lineUserId, profile, payload, userAgent) {
  const existing = getUserByLineId(lineUserId);
  if (existing) {
    return jsonResponse({
      ok: false,
      error: 'User already registered. Status: ' + existing.status
    });
  }

  const department = (payload.department || '').toString().trim();
  const employeeCode = (payload.employee_code || '').toString().trim();

  if (!department) return jsonResponse({ ok: false, error: 'กรุณาระบุแผนก' });
  if (department.length > 100) return jsonResponse({ ok: false, error: 'ชื่อแผนกยาวเกินไป' });
  if (employeeCode && employeeCode.length > 50) return jsonResponse({ ok: false, error: 'รหัสพนักงานยาวเกินไป' });

  const bootstrapAdminId = getConfig('bootstrap_admin_line_id');
  const isBootstrapAdmin = bootstrapAdminId && bootstrapAdminId === lineUserId;

  const allowSelfReg = getConfig('allow_self_register');
  if (allowSelfReg === 'false' && !isBootstrapAdmin) {
    return jsonResponse({ ok: false, error: 'ระบบปิดการลงทะเบียนเอง' });
  }

  const now = new Date().toISOString();
  const created = createUser({
    id: Utilities.getUuid(),
    line_user_id: lineUserId,
    display_name: profile.displayName || '',
    picture_url: profile.pictureUrl || '',
    department: department,
    employee_code: employeeCode,
    is_admin: isBootstrapAdmin,
    status: isBootstrapAdmin ? 'active' : 'pending'
  });

  if (isBootstrapAdmin) {
    updateUserFields(lineUserId, {
      approved_at: now,
      approved_by: 'BOOTSTRAP'
    });
    logAudit(lineUserId, 'bootstrap_admin_promoted', lineUserId, { department });
  }

  logAuth(lineUserId, 'register', 'department=' + department, userAgent);

  return jsonResponse({
    ok: true,
    status: created.status,
    isAdmin: !!created.is_admin,
    displayName: created.display_name,
    autoApproved: isBootstrapAdmin
  });
}

function handleSetPin(lineUserId, profile, payload, userAgent) {
  const user = getUserByLineId(lineUserId);
  if (!user) return jsonResponse({ ok: false, error: 'User not registered' });
  if (user.status !== 'active') {
    return jsonResponse({
      ok: false,
      error: user.status === 'pending' ? 'รออนุมัติจาก admin' : 'บัญชีไม่สามารถใช้งานได้'
    });
  }
  if (user.pin_hash) {
    return jsonResponse({ ok: false, error: 'PIN ถูกตั้งไว้แล้ว' });
  }

  const pin = (payload.pin || '').toString();
  const policy = validatePinPolicy(pin);
  if (!policy.ok) return jsonResponse({ ok: false, error: policy.error });

  const hashed = hashPin(pin);
  const now = new Date().toISOString();

  updateUserFields(lineUserId, {
    pin_hash: hashed.hash,
    pin_salt: hashed.salt,
    pin_attempts: 0,
    pin_locked_until: '',
    pin_changed_at: now,
    last_login_at: now
  });

  const sessionToken = issueSessionToken(lineUserId);
  const ttlMin = Number(getConfig('session_ttl_minutes')) || 30;
  const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000).toISOString();

  logAuth(lineUserId, 'pin_set', 'PIN set on first login', userAgent);

  return jsonResponse({
    ok: true,
    sessionToken: sessionToken,
    expiresAt: expiresAt,
    user: {
      displayName: user.display_name,
      department: user.department,
      isAdmin: !!user.is_admin
    }
  });
}

function handleVerifyPin(lineUserId, profile, payload, userAgent) {
  const user = getUserByLineId(lineUserId);
  if (!user) return jsonResponse({ ok: false, error: 'User not registered' });
  if (user.status === 'disabled') {
    return jsonResponse({ ok: false, error: 'บัญชีถูกระงับ', status: 'disabled' });
  }
  if (user.status === 'pending') {
    return jsonResponse({ ok: false, error: 'รออนุมัติจาก admin', status: 'pending' });
  }
  if (!user.pin_hash) {
    return jsonResponse({ ok: false, error: 'ยังไม่ได้ตั้ง PIN', status: 'needsPin' });
  }
  if (isUserLocked(user)) {
    return jsonResponse({
      ok: false,
      error: 'บัญชีถูก lock',
      lockedUntil: user.pin_locked_until,
      status: 'locked'
    });
  }

  const pin = (payload.pin || '').toString();
  if (!/^\d{6}$/.test(pin)) {
    return jsonResponse({ ok: false, error: 'PIN ต้องเป็นตัวเลข 6 หลัก' });
  }

  const ok = verifyPinHash(pin, user.pin_hash, user.pin_salt);

  if (!ok) {
    const maxAttempts = Number(getConfig('max_pin_attempts')) || 5;
    const lockoutMin = Number(getConfig('pin_lockout_minutes')) || 15;
    const newAttempts = (Number(user.pin_attempts) || 0) + 1;

    if (newAttempts >= maxAttempts) {
      const lockUntil = new Date(Date.now() + lockoutMin * 60 * 1000).toISOString();
      updateUserFields(lineUserId, {
        pin_attempts: 0,
        pin_locked_until: lockUntil
      });
      logAuth(lineUserId, 'locked', 'attempts=' + newAttempts, userAgent);
      return jsonResponse({
        ok: false,
        error: 'ใส่ PIN ผิดครบ ' + maxAttempts + ' ครั้ง บัญชีถูก lock ' + lockoutMin + ' นาที',
        lockedUntil: lockUntil,
        status: 'locked'
      });
    }

    updateUserField(lineUserId, 'pin_attempts', newAttempts);
    logAuth(lineUserId, 'login_fail', 'attempt ' + newAttempts + '/' + maxAttempts, userAgent);
    return jsonResponse({
      ok: false,
      error: 'PIN ไม่ถูกต้อง',
      attemptsRemaining: maxAttempts - newAttempts
    });
  }

  const now = new Date().toISOString();
  updateUserFields(lineUserId, {
    pin_attempts: 0,
    pin_locked_until: '',
    last_login_at: now
  });

  const sessionToken = issueSessionToken(lineUserId);
  const ttlMin = Number(getConfig('session_ttl_minutes')) || 30;
  const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000).toISOString();

  logAuth(lineUserId, 'login_success', '', userAgent);

  return jsonResponse({
    ok: true,
    sessionToken: sessionToken,
    expiresAt: expiresAt,
    user: {
      displayName: user.display_name,
      department: user.department,
      isAdmin: !!user.is_admin
    }
  });
}

// ========== Phase 2: Get Documents ==========

function handleGetDocuments(lineUserId, sessionToken, payload, userAgent) {
  // Verify session
  const session = requireValidSession(lineUserId, sessionToken);
  if (!session.ok) {
    return jsonResponse({ ok: false, error: session.error, needsLogin: true });
  }

  // Verify user still active
  const user = getUserByLineId(lineUserId);
  if (!user) return jsonResponse({ ok: false, error: 'User not found' });
  if (user.status !== 'active') {
    return jsonResponse({ ok: false, error: 'Account not active' });
  }

  // Get documents (filter by category if provided)
  const category = (payload.category || '').toString();
  let docs;
  if (category) {
    if (['full_book', 'topic', 'summary'].indexOf(category) < 0) {
      return jsonResponse({ ok: false, error: 'Invalid category' });
    }
    docs = getDocumentsByCategory(category);
  } else {
    docs = getActiveDocuments();
  }

  // Strip sensitive fields before returning
  const safe = docs.map(function(d) {
    return {
      id: d.id,
      title: d.title,
      form_code: d.form_code,
      category: d.category,
      description: d.description,
      page_count: Number(d.page_count) || 0,
      updated_at: d.updated_at
    };
  });

  return jsonResponse({
    ok: true,
    documents: safe,
    count: safe.length
  });
}

// ========== Helpers ==========

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
