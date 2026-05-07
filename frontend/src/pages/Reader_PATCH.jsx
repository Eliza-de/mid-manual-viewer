/**
 * MINIMAL CHANGE in src/pages/Reader.jsx
 *
 * In the Reader component body, REPLACE the useAntiCapture call:
 *
 *   FROM:
 *     const { tabHidden } = useAntiCapture({
 *       enabled: true,
 *       onSuspectActivity: (event) => {
 *         if (event.type !== 'tab_visible') {
 *           console.warn('[anti-capture]', event);
 *         }
 *       }
 *     });
 *
 *   TO:
 */

const { tabHidden } = useAntiCapture({
  enabled: true,
  documentId: doc?.id || null,         // NEW: pass document id
  pageNumber: page,                    // NEW: pass current page
  onSuspectActivity: (event) => {
    if (event.type !== 'tab_visible') {
      console.warn('[anti-capture]', event);
    }
  }
});
