/**
 * Anti-Capture API client — Phase 16 (FIXED)
 */

// Mid-Manual API base URL (Cloudflare Worker)
const API_BASE = 'https://mid-manual-api.elizanu-de.workers.dev';

/**
 * Report a capture attempt to the backend.
 * Uses keepalive: true so it sends even if user closes tab.
 */
export async function reportCaptureAttempt(idToken, sessionToken, payload) {
  try {
    const res = await fetch(`${API_BASE}/api/anti-capture/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idToken,
        sessionToken,
        payload
      }),
      keepalive: true
    });

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }

    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
