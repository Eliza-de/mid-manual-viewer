/**
 * API client for Cloudflare Workers backend.
 *
 * Phase E: switched from Apps Script to REST paths.
 * Phase 10: added postBlob() for CSV downloads.
 *
 * Env vars (set in Vite + Cloudflare Pages):
 *   VITE_API_URL = https://mid-manual-api.elizanu-de.workers.dev
 */

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL && import.meta.env.PROD) {
  console.error('VITE_API_URL is not configured');
}

/**
 * POST to a Workers endpoint, expects JSON response.
 */
export async function post(path, body = {}) {
  if (!API_URL) return { ok: false, error: 'Backend URL not configured' };

  const requestBody = { ...body, userAgent: navigator.userAgent };

  try {
    const res = await fetch(API_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await res.json().catch(() => null);
    if (data) return data;

    return { ok: false, error: 'HTTP ' + res.status, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message || 'Network error' };
  }
}

/**
 * POST to a Workers endpoint and download response as a file.
 * Used for CSV exports.
 *
 * Returns { ok: true } on success, { ok: false, error } on failure.
 * For non-2xx responses, attempts to parse JSON error body.
 */
export async function postBlob(path, body, fallbackFilename = 'download.csv') {
  if (!API_URL) return { ok: false, error: 'Backend URL not configured' };

  const requestBody = { ...body, userAgent: navigator.userAgent };

  try {
    const res = await fetch(API_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      // Try parse JSON error
      try {
        const err = await res.json();
        return { ok: false, error: err.error || `HTTP ${res.status}`, needsLogin: err.needsLogin };
      } catch {
        return { ok: false, error: `HTTP ${res.status}` };
      }
    }

    // Extract filename from Content-Disposition header
    const cd = res.headers.get('Content-Disposition') || '';
    const m = cd.match(/filename="?([^";]+)"?/);
    const filename = (m && m[1]) || fallbackFilename;

    const blob = await res.blob();

    // Trigger browser download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return { ok: true, filename, size: blob.size };
  } catch (err) {
    return { ok: false, error: err.message || 'Network error' };
  }
}

/**
 * GET request — for public endpoints like health check.
 */
export async function get(path) {
  if (!API_URL) return { ok: false, error: 'Backend URL not configured' };

  try {
    const res = await fetch(API_URL + path, { method: 'GET' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Health check.
 */
export async function ping() {
  return get('/api/health');
}
