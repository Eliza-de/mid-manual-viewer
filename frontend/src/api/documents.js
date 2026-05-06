/**
 * Documents API (Phase E — Cloudflare Workers)
 */

import { post } from './client.js';

/**
 * Fetch documents, optionally filtered by category.
 */
export async function getDocuments(idToken, sessionToken, category) {
  return post('/api/documents/list', {
    idToken,
    sessionToken,
    payload: category ? { category } : {}
  });
}
