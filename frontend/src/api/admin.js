/**
 * Admin API (Phase E — Cloudflare Workers)
 */

import { post } from './client.js';

/**
 * Create a new document with pages.
 */
export async function createDocument(idToken, sessionToken, doc, pages) {
  return post('/api/admin/documents/create', {
    idToken,
    sessionToken,
    payload: {
      ...doc,
      pages
    }
  });
}
