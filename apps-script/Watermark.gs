/**
 * Watermark.gs — Server-side watermarking
 *
 * Phase 0: stubs only
 * Phase 5: actual implementation
 *
 * Strategy:
 * - Static watermark: applied during PDF→PNG pre-render (one time, all users)
 * - Dynamic watermark: client-side overlay (per user, per session)
 *
 * Why client-side dynamic? Apps Script image manipulation is limited;
 * doing per-request server-side rendering would be too slow and expensive.
 */

/**
 * Apply a static watermark to a PNG file in Drive.
 * @param {string} fileId - Drive file ID of the PNG
 * @param {string} text - watermark text
 *
 * Phase 5: implement using a third-party service or pre-render with Python script
 */
function applyStaticWatermark(fileId, text) {
  throw new Error('Not implemented in Phase 0. Use manual conversion + watermark in Phase 0–4.');
}

/**
 * Generate the dynamic watermark text for a user.
 * Used by frontend to know what to overlay.
 */
function getDynamicWatermarkText(user) {
  const last4 = user.line_user_id ? user.line_user_id.slice(-4) : '????';
  const name = user.display_name || 'Unknown';
  return name + ' (' + last4 + ') • ' + new Date().toISOString().slice(0, 16);
}
