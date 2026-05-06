/**
 * Documents API client
 */

import { post } from './client.js';

/**
 * Fetch documents, optionally filtered by category.
 * @param {string} idToken
 * @param {string} sessionToken
 * @param {string} [category] - 'full_book' | 'topic' | 'summary'
 */
export async function getDocuments(idToken, sessionToken, category) {
  return post('getDocuments', {
    idToken,
    sessionToken,
    payload: category ? { category } : {}
  });
}
