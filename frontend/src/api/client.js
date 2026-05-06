/**
 * API client for Cloudflare Workers backend.
 *
 * Phase E: switched from Apps Script (action-based) to REST paths.
 *
 * Env vars (set in Vite + Cloudflare Pages):
 *   VITE_API_URL = https://mid-manual-api.elizanu-de.workers.dev
 */

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL && import.meta.env.PROD) {
  console.error('VITE_API_URL is not configured');
}

/**
 * POST to a Workers endpoint.
 *
 * @param {string} path - e.g. '/api/auth/check'
 * @param {object} body - request body (idToken, sessionToken, payload)
 */
export async function post(path, body = {}) {
  if (!API_URL) {
    return { ok: false, error: 'Backend URL not configured' };
  }

  // Forward common fields if present
  const requestBody = {
    ...body,
    userAgent: navigator.userAgent
  };

  try {
    const res = await fetch(API_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    // Try to parse JSON even on non-2xx (Workers returns JSON for errors)
    const data = await res.json().catch(() => null);

    if (data) return data;

    return {
      ok: false,
      error: 'HTTP ' + res.status,
      status: res.status
    };
  } catch (err) {
    return { ok: false, error: err.message || 'Network error' };
  }
}

/**
 * GET endpoint (used for /api/health, /api/db-test, etc.)
 */
export async function get(path) {
  if (!API_URL) return { ok: false, error: 'Backend URL not configured' };

  try {
    const res = await fetch(API_URL + path, {
      method: 'GET'
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Health check — replaces old ping().
 */
export async function ping() {
  return get('/api/health');
}
