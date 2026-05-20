/**
 * Video API — LIFF mobile
 *
 * Worker mints a short-lived signed URL (30 min) for the video binary,
 * and (if a poster was uploaded) a separate signed URL for the poster.
 * The browser then fetches the video via HTTP Range against
 * /api/documents/:id/video.:ext directly.
 */

import { post } from './client.js';

/**
 * Response shape:
 *   { ok: true, documentId, url, exp, posterUrl, mime, duration_sec, size_bytes }
 *   { ok: false, error, needsLogin? }
 */
export async function getVideo(idToken, sessionToken, documentId) {
  return post('/api/documents/video', {
    idToken,
    sessionToken,
    payload: { documentId },
  });
}
