/**
 * Page (image) API client
 */

import { post } from './client.js';

/**
 * Fetch a single page as base64 PNG.
 */
export async function getPage(idToken, sessionToken, documentId, pageNumber) {
  return post('getPage', {
    idToken,
    sessionToken,
    payload: { documentId, pageNumber }
  });
}
