/**
 * Admin API client (Phase 5)
 */

import { post } from './client.js';

/**
 * Create a new document with pages.
 *
 * @param {string} idToken
 * @param {string} sessionToken
 * @param {object} doc - { title, form_code, category, description, sort_order }
 * @param {Array<{filename: string, data: string}>} pages - base64 PNGs
 */
export async function createDocument(idToken, sessionToken, doc, pages) {
  return post('admin.createDocument', {
    idToken,
    sessionToken,
    payload: {
      ...doc,
      pages
    }
  });
}
