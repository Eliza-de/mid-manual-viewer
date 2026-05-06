/**
 * Auth API client (Phase E — Cloudflare Workers)
 *
 * Backend functions: REST paths to Workers
 * Session helpers: sessionStorage management (frontend-only)
 */

import { post } from './client.js';

// ========== Backend API calls ==========

export async function checkRegistration(idToken) {
  return post('/api/auth/check', { idToken });
}

export async function whoami(idToken) {
  return post('/api/auth/whoami', { idToken });
}

export async function register(idToken, { department, employee_code }) {
  return post('/api/auth/register', {
    idToken,
    payload: { department, employee_code }
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

// ========== Session storage helpers (frontend-only) ==========

const SESSION_KEY = 'mid_manual_session';

export function saveSession(token, expiresAt, user) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      token,
      expiresAt,
      user
    }));
  } catch (e) {
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
