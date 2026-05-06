/**
 * useAntiCapture — global anti-capture defenses for the app
 *
 * Mounts:
 *   - Disables right-click context menu
 *   - Blocks Ctrl+S, Ctrl+P, F12, DevTools shortcuts
 *   - Detects tab visibility changes
 *   - Heuristic DevTools detection (size delta)
 *   - Blocks print
 *
 * Reports suspect activity via onSuspectActivity callback.
 *
 * Important: these are deterrents, not perfect. Phase 4 philosophy
 * is "make casual sharing inconvenient, deter intentional sharing
 * via forensic watermark."
 */

import { useEffect, useState, useRef } from 'react';

const DEVTOOLS_CHECK_INTERVAL_MS = 2000;
const DEVTOOLS_THRESHOLD = 160;

export function useAntiCapture({ enabled = true, onSuspectActivity } = {}) {
  const [tabHidden, setTabHidden] = useState(false);
  const [devtoolsOpen, setDevtoolsOpen] = useState(false);
  const reportRef = useRef(onSuspectActivity);

  useEffect(() => { reportRef.current = onSuspectActivity; }, [onSuspectActivity]);

  useEffect(() => {
    if (!enabled) return;

    const report = (type, detail) => {
      if (reportRef.current) {
        try { reportRef.current({ type, detail, timestamp: new Date().toISOString() }); }
        catch (_) {}
      }
    };

    // ---- 1. Block context menu ----
    const onContextMenu = (e) => {
      e.preventDefault();
      report('context_menu', null);
      return false;
    };

    // ---- 2. Block keyboard shortcuts ----
    const onKeyDown = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+S, Ctrl+P, Ctrl+Shift+S
      if (ctrl && (e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        report('shortcut', e.key);
        return false;
      }
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
      if (ctrl && e.shiftKey && /^[IJCijc]$/.test(e.key)) {
        e.preventDefault();
        report('devtools_shortcut', e.key);
        return false;
      }
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        report('devtools_shortcut', 'F12');
        return false;
      }
      // PrintScreen (Windows-only, may not fire reliably)
      if (e.key === 'PrintScreen') {
        report('printscreen', null);
        // We can't truly block PrintScreen but we can try to clear clipboard
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('').catch(() => {});
          }
        } catch (_) {}
      }
    };

    // ---- 3. Visibility change ----
    const onVisibility = () => {
      const hidden = document.hidden;
      setTabHidden(hidden);
      if (hidden) report('tab_hidden', null);
      else report('tab_visible', null);
    };

    // ---- 4. Block before print ----
    const onBeforePrint = (e) => {
      e.preventDefault();
      report('print_attempt', null);
      return false;
    };

    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeprint', onBeforePrint);

    // ---- 5. DevTools heuristic via size delta ----
    const checkDevtools = () => {
      const widthDelta = Math.max(0, window.outerWidth - window.innerWidth);
      const heightDelta = Math.max(0, window.outerHeight - window.innerHeight);
      const open = widthDelta > DEVTOOLS_THRESHOLD || heightDelta > DEVTOOLS_THRESHOLD;
      setDevtoolsOpen(prev => {
        if (open !== prev) {
          report(open ? 'devtools_opened' : 'devtools_closed',
            `wDelta=${widthDelta} hDelta=${heightDelta}`);
        }
        return open;
      });
    };
    const intervalId = setInterval(checkDevtools, DEVTOOLS_CHECK_INTERVAL_MS);

    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeprint', onBeforePrint);
      clearInterval(intervalId);
    };
  }, [enabled]);

  return { tabHidden, devtoolsOpen };
}
