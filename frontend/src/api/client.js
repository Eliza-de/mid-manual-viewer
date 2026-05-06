/**
 * API client for Apps Script Web App backend.
 * Phase 2: forwards sessionToken to backend.
 */

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

if (!APPS_SCRIPT_URL && import.meta.env.PROD) {
  console.error('VITE_APPS_SCRIPT_URL is not configured');
}

export async function post(action, { idToken, sessionToken, payload } = {}) {
  if (!APPS_SCRIPT_URL) {
    return { ok: false, error: 'Backend URL not configured' };
  }

  const body = {
    action,
    idToken: idToken || null,
    sessionToken: sessionToken || null,
    payload: payload || {},
    userAgent: navigator.userAgent
  };

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
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

export async function whoami(idToken) {
  return post('whoami', { idToken });
}
