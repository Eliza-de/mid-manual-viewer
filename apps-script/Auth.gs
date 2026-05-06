/**
 * Auth.gs — Authentication functions
 * - LIFF ID Token verification with LINE API
 * - PIN hashing (HMAC-SHA256 + salt + iterations)
 * - PIN policy validation
 * - Session token issue/verify (HMAC-signed)
 */

// ========== LIFF ID Token Verification ==========

const LINE_VERIFY_URL = 'https://api.line.me/oauth2/v2.1/verify';

/**
 * Verify a LIFF ID token by calling LINE's verify endpoint.
 *
 * @param {string} idToken - JWT from liff.getIDToken()
 * @returns {{ok: boolean, lineUserId?: string, profile?: object, error?: string}}
 */
function verifyLiffToken(idToken) {
  if (!idToken) {
    return { ok: false, error: 'No ID token provided' };
  }

  const channelId = getConfig('line_channel_id');
  if (!channelId) {
    return { ok: false, error: 'line_channel_id not configured in Config sheet' };
  }

  try {
    const response = UrlFetchApp.fetch(LINE_VERIFY_URL, {
      method: 'post',
      contentType: 'application/x-www-form-urlencoded',
      payload: {
        id_token: idToken,
        client_id: channelId
      },
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    if (code !== 200) {
      Logger.log('LINE verify failed: HTTP ' + code + ' ' + response.getContentText());
      return { ok: false, error: 'LINE verification failed (HTTP ' + code + ')' };
    }

    const data = JSON.parse(response.getContentText());

    // Verify audience matches our channel
    if (data.aud !== channelId) {
      return { ok: false, error: 'Token audience mismatch' };
    }

    // Verify expiry (LINE checks this, but double-check)
    const now = Math.floor(Date.now() / 1000);
    if (data.exp && data.exp < now) {
      return { ok: false, error: 'Token expired' };
    }

    return {
      ok: true,
      lineUserId: data.sub,
      profile: {
        displayName: data.name || '',
        pictureUrl: data.picture || '',
        email: data.email || ''
      }
    };
  } catch (err) {
    Logger.log('verifyLiffToken error: ' + err.toString());
    return { ok: false, error: 'Verification error: ' + err.toString() };
  }
}

// ========== PIN Hashing ==========

const PIN_HASH_ITERATIONS = 10000;

/**
 * Hash a PIN with a random salt.
 * @param {string} pin - 6-digit PIN
 * @returns {{hash: string, salt: string}} both base64-encoded
 */
function hashPin(pin) {
  const saltBytes = generateRandomBytes(16);
  const salt = Utilities.base64Encode(saltBytes);
  const hash = computePinHash(pin, salt);
  return { hash: hash, salt: salt };
}

/**
 * Verify a PIN against stored hash and salt.
 * @returns {boolean}
 */
function verifyPinHash(pin, storedHash, storedSalt) {
  const computed = computePinHash(pin, storedSalt);
  return constantTimeEquals(computed, storedHash);
}

function computePinHash(pin, saltBase64) {
  const saltBytes = Utilities.base64Decode(saltBase64);
  let current = Utilities.computeHmacSha256Signature(pin, Utilities.newBlob(saltBytes).getBytes());

  for (let i = 1; i < PIN_HASH_ITERATIONS; i++) {
    // Convert byte array to string for next iteration's input
    current = Utilities.computeHmacSha256Signature(
      Utilities.base64Encode(current),
      Utilities.newBlob(saltBytes).getBytes()
    );
  }

  return Utilities.base64Encode(current);
}

function constantTimeEquals(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ========== PIN Policy ==========

/**
 * Validate PIN against policy rules.
 * @param {string} pin
 * @returns {{ok: boolean, error?: string}}
 */
function validatePinPolicy(pin) {
  if (typeof pin !== 'string') {
    return { ok: false, error: 'PIN must be a string' };
  }
  if (pin.length !== 6) {
    return { ok: false, error: 'PIN must be exactly 6 digits' };
  }
  if (!/^\d{6}$/.test(pin)) {
    return { ok: false, error: 'PIN must contain only digits' };
  }
  // All same digit (000000, 111111, ..., 999999)
  if (/^(\d)\1{5}$/.test(pin)) {
    return { ok: false, error: 'PIN cannot have all same digits' };
  }
  // Ascending sequence
  const ascending = '0123456789';
  for (let i = 0; i <= ascending.length - 6; i++) {
    if (pin === ascending.substring(i, i + 6)) {
      return { ok: false, error: 'PIN cannot be a sequence' };
    }
  }
  // Descending sequence
  const descending = '9876543210';
  for (let i = 0; i <= descending.length - 6; i++) {
    if (pin === descending.substring(i, i + 6)) {
      return { ok: false, error: 'PIN cannot be a sequence' };
    }
  }
  // Common weak PINs
  const weakPins = ['123123', '121212', '112233', '111222', '654321', '123321'];
  if (weakPins.indexOf(pin) >= 0) {
    return { ok: false, error: 'PIN is too common' };
  }
  return { ok: true };
}

// ========== User Lock Check ==========

function isUserLocked(user) {
  if (!user.pin_locked_until) return false;
  const lockUntil = new Date(user.pin_locked_until);
  return lockUntil > new Date();
}

// ========== Session Tokens (HMAC-signed) ==========

const SESSION_DEFAULT_TTL_MIN = 30;

/**
 * Issue a session token signed with the script's secret key.
 */
function issueSessionToken(lineUserId) {
  const ttlMin = Number(getConfig('session_ttl_minutes')) || SESSION_DEFAULT_TTL_MIN;
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    uid: lineUserId,
    iat: now,
    exp: now + (ttlMin * 60),
    ver: 1
  };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Utilities.base64EncodeWebSafe(payloadStr);
  const sig = signString(payloadB64);
  return payloadB64 + '.' + sig;
}

/**
 * Verify and decode a session token.
 * @returns {{ok: boolean, payload?: object, error?: string}}
 */
function verifySessionToken(token) {
  if (!token || typeof token !== 'string') {
    return { ok: false, error: 'No token' };
  }
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { ok: false, error: 'Malformed token' };
  }
  const [payloadB64, sig] = parts;
  const expectedSig = signString(payloadB64);
  if (!constantTimeEquals(sig, expectedSig)) {
    return { ok: false, error: 'Invalid signature' };
  }
  let payload;
  try {
    const payloadStr = Utilities.newBlob(Utilities.base64DecodeWebSafe(payloadB64)).getDataAsString();
    payload = JSON.parse(payloadStr);
  } catch (e) {
    return { ok: false, error: 'Invalid payload' };
  }
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    return { ok: false, error: 'Token expired' };
  }
  return { ok: true, payload: payload };
}

function signString(str) {
  const key = getSessionKey();
  const sig = Utilities.computeHmacSha256Signature(str, key);
  return Utilities.base64EncodeWebSafe(sig);
}

function getSessionKey() {
  const key = PropertiesService.getScriptProperties().getProperty('SESSION_HMAC_KEY');
  if (!key) {
    throw new Error('SESSION_HMAC_KEY not set. Run setupSecrets() first.');
  }
  return key;
}

// ========== Random Bytes ==========

function generateRandomBytes(n) {
  // Apps Script doesn't have a direct CSPRNG, but UUID + crypto operations are seeded
  // For salt generation, combine multiple sources of entropy
  const sources = [];
  for (let i = 0; i < n; i++) {
    const uuid = Utilities.getUuid();
    sources.push(uuid.charCodeAt(i % uuid.length) & 0xFF);
  }
  return sources;
}

// ========== One-time Setup ==========

/**
 * Run this once after deploying to set up the session HMAC key.
 * Stored in Script Properties (private to Apps Script project).
 */
function setupSecrets() {
  const existing = PropertiesService.getScriptProperties().getProperty('SESSION_HMAC_KEY');
  if (existing) {
    Logger.log('SESSION_HMAC_KEY already set. Length: ' + existing.length);
    return;
  }
  const key = Utilities.base64Encode(
    Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid()
  );
  PropertiesService.getScriptProperties().setProperty('SESSION_HMAC_KEY', key);
  Logger.log('SESSION_HMAC_KEY set successfully.');
}
