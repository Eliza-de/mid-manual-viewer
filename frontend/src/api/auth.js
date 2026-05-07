/**
 * Auth API client — Updated registration signature
 */

import { post } from './client.js';

// ========== Backend API calls ==========

export async function checkRegistration(idToken) {
  return post('/api/auth/check', { idToken });
}

export async function whoami(idToken) {
  return post('/api/auth/whoami', { idToken });
}

// NEW: register with full_name + nickname + login_code (PIN setup happens in setPin as before)
export async function register(idToken, { full_name, nickname, login_code }) {
  return post('/api/auth/register', {
    idToken,
    payload: { full_name, nickname, login_code }
  });
}

export async function setPin(idToken, pin) {
  return post('/api/auth/setPin', {
    idToken,
    payload: { pin }
  });
}

export async function verifyPin(idToken, pin) {
  return post('/api/auth/verifyPin', {
    idToken,
    payload: { pin }
  });
}

// ========== Session storage helpers ==========

const SESSION_KEY = 'mid_manual_session';

export function saveSession(token, expiresAt, user) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, expiresAt, user }));
  } catch (e) {
    console.warn('Cannot save session:', e);
  }
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}
