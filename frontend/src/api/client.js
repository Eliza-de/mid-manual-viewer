/**
 * API client for Apps Script Web App backend.
 *
 * IMPORTANT: Apps Script doPost requires text/plain content-type to avoid CORS preflight.
 * We send JSON.stringify body but with content-type: text/plain;charset=utf-8
 * Apps Script will still parse it via e.postData.contents.
 */

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

if (!APPS_SCRIPT_URL && import.meta.env.PROD) {
  console.error('VITE_APPS_SCRIPT_URL is not configured');
}

/**
 * Generic POST to Apps Script.
 * @param {string} action
 * @param {object} options { idToken, payload }
 */
async function post(action, { idToken, payload } = {}) {
  if (!APPS_SCRIPT_URL) {
    throw new Error('Backend URL not configured');
  }

  const body = {
    action,
    idToken: idToken || null,
    payload: payload || {},
    userAgent: navigator.userAgent
  };

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      // text/plain avoids CORS preflight
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow'
    });

    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message || 'Network error' };
  }
}

/**
 * GET ping (no auth, no token needed).
 */
export async function ping() {
  if (!APPS_SCRIPT_URL) return { ok: false, error: 'Backend URL not configured' };
  try {
    const res = await fetch(APPS_SCRIPT_URL + '?action=ping', {
      method: 'GET',
      redirect: 'follow'
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Test endpoint that requires a valid LIFF token.
 */
export async function whoami(idToken) {
  return post('whoami', { idToken });
}

/**
 * Phase 1+ endpoints (stubs for now)
 */
export async function checkRegistration(idToken) {
  return post('checkRegistration', { idToken });
}

export async function register(idToken, payload) {
  return post('register', { idToken, payload });
}

export async function setPin(idToken, payload) {
  return post('setPin', { idToken, payload });
}

export async function verifyPin(idToken, payload) {
  return post('verifyPin', { idToken, payload });
}

export async function getDocuments(idToken) {
  return post('getDocuments', { idToken });
}

export async function getPage(idToken, payload) {
  return post('getPage', { idToken, payload });
}
