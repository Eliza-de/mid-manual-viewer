/**
 * Pages API (Phase E — Cloudflare Workers)
 */

import { post } from './client.js';

/**
 * Fetch a single page as base64 PNG.
 */
export async function getPage(idToken, sessionToken, documentId, pageNumber) {
  return post('/api/documents/page', {
    idToken,
    sessionToken,
    payload: { documentId, pageNumber }
  });
}
