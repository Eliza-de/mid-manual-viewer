/**
 * Pages API
 *
 * Phase E — Cloudflare Workers
 * 2026-05-13 — switched from base64 JSON to signed-URL binary delivery.
 *              Worker mints a short-lived HMAC-signed GET URL and the
 *              browser fetches the PNG directly (no Worker CPU on the bytes).
 */

import { post } from './client.js';

/**
 * Request a signed URL for a specific page.
 *
 * Response shape:
 *   { ok: true, page, totalPages, documentId, url, exp }
 *   { ok: false, error, needsLogin? }
 */
export async function getPage(idToken, sessionToken, documentId, pageNumber) {
  return post('/api/documents/page', {
    idToken,
    sessionToken,
    payload: { documentId, pageNumber },
  });
}
