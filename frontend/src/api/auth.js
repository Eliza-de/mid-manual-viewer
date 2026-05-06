/**
 * Auth API client — wraps backend register/setPin/verifyPin endpoints
 */

import { post } from './client.js';

export async function register(idToken, { department, employee_code }) {
  return post('register', {
    idToken,
    payload: { department, employee_code }
  });
}

export async function setPin(idToken, pin) {
  return post('setPin', {
    idToken,
    payload: { pin }
  });
}

export async function verifyPin(idToken, pin) {
  return post('verifyPin', {
    idToken,
    payload: { pin }
  });
}

export async function checkRegistration(idToken) {
  return post('checkRegistration', { idToken });
}

// ========== Session storage helpers ==========

const SESSION_KEY = 'mid_manual_session';

export function saveSession(token, expiresAt, user) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      token,
      expiresAt,
      user
    }));
  } catch (e) {
    // sessionStorage might be unavailable in some browser modes
    console.warn('Cannot save session:', e);
  }
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Check expiry
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      clearSession();
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}
