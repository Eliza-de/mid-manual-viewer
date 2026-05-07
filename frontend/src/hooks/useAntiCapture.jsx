/**
 * useAntiCapture — VERSION 2 (Phase 16: Anti-Capture Pro)
 * BUILD: 2026-05-07-V2-ANTICAPTURE
 *
 * Changes from V1:
 *   - Reports suspect activity to backend (D1 + LINE notify)
 *   - Auto-blur on visibility change
 *   - Window blur detection
 *   - Per-type client-side throttle (5s)
 *   - keepalive: true for reliable delivery
 *
 * Defenses (5 + extras):
 *   1. Tab visibility change         → blur + log
 *   2. Window blur (focus loss)      → blur + log
 *   3. PrintScreen key               → log + clear clipboard (HIGH)
 *   4. DevTools detection            → blur + log (HIGH)
 *   5. Print attempt (Ctrl+P, etc)   → block + log (HIGH)
 *   + Context menu (right-click)     → block + log
 *   + Keyboard shortcuts             → block + log
 */

import { useEffect, useState, useRef } from 'react';
import { useAuth } from './useAuth.jsx';
import { getIdToken } from '../api/liff.js';
import { reportCaptureAttempt } from '../api/anti_capture.js';

const DEVTOOLS_CHECK_INTERVAL_MS = 2000;
const DEVTOOLS_THRESHOLD = 160;
const CLIENT_THROTTLE_MS = 5000;  // max 1 report per type per 5s

export function useAntiCapture({
  enabled = true,
  documentId = null,
  pageNumber = null,
  onSuspectActivity
} = {}) {
  // V2 marker
  if (typeof window !== 'undefined' && !window.__anticapture_v2_loaded) {
    console.log('%c[useAntiCapture V2 LOADED]', 'background:#1F4D3F;color:#A4DFCB;padding:4px 8px;border-radius:4px');
    window.__anticapture_v2_loaded = true;
  }

  const auth = useAuth();
  const [tabHidden, setTabHidden] = useState(false);
  const [devtoolsOpen, setDevtoolsOpen] = useState(false);

  // Refs to avoid stale closures
  const reportRef = useRef(onSuspectActivity);
  const docIdRef = useRef(documentId);
  const pageRef = useRef(pageNumber);
  const sessionRef = useRef(auth.session);
  const lastReportsRef = useRef({});  // type -> last timestamp

  useEffect(() => { reportRef.current = onSuspectActivity; }, [onSuspectActivity]);
  useEffect(() => { docIdRef.current = documentId; }, [documentId]);
  useEffect(() => { pageRef.current = pageNumber; }, [pageNumber]);
  useEffect(() => { sessionRef.current = auth.session; }, [auth.session]);

  useEffect(() => {
    if (!enabled) return;

    // ============================================================
    // Throttled reporter — sends to backend + invokes local callback
    // ============================================================
    const reportToBackend = async (type, metadata = {}) => {
      // Local callback (always)
      if (reportRef.current) {
        try {
          reportRef.current({ type, metadata, timestamp: new Date().toISOString() });
        } catch (_) {}
      }

      // Skip backend report for visible (just informational)
      if (type === 'tab_visible') return;

      // Client-side throttle
      const now = Date.now();
      const lastTime = lastReportsRef.current[type] || 0;
      if (now - lastTime < CLIENT_THROTTLE_MS) return;
      lastReportsRef.current[type] = now;

      // Need session to report
      const session = sessionRef.current;
      if (!session?.token) return;

      try {
        await reportCaptureAttempt(getIdToken(), session.token, {
          type,
          document_id: docIdRef.current,
          page_number: pageRef.current,
          user_agent: navigator.userAgent.slice(0, 200),
          metadata
        });
      } catch (err) {
        // Silent fail — don't break user experience
        console.warn('[anti-capture] report failed:', err);
      }
    };

    // ============================================================
    // 1. CONTEXT MENU (right-click)
    // ============================================================
    const onContextMenu = (e) => {
      e.preventDefault();
      reportToBackend('context_menu');
      return false;
    };

    // ============================================================
    // 2. KEYBOARD SHORTCUTS
    // ============================================================
    const onKeyDown = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+S, Ctrl+P (Print)
      if (ctrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        reportToBackend('keyboard_shortcut', { key: 'Ctrl+S' });
        return false;
      }
      if (ctrl && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        reportToBackend('print_attempt', { key: 'Ctrl+P' });
        return false;
      }
      // Ctrl+Shift+I/J/C — DevTools
      if (ctrl && e.shiftKey && /^[IJCijc]$/.test(e.key)) {
        e.preventDefault();
        reportToBackend('devtools_opened', { trigger: 'shortcut', key: e.key });
        return false;
      }
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        reportToBackend('devtools_opened', { trigger: 'F12' });
        return false;
      }
    };

    // ============================================================
    // 3. PRINTSCREEN (keyup, can't truly block)
    // ============================================================
    const onKeyUp = (e) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        // Try to wipe clipboard
        try {
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText('').catch(() => {});
          }
        } catch (_) {}
        reportToBackend('print_screen');
      }
    };

    // ============================================================
    // 4. TAB VISIBILITY
    // ============================================================
    const onVisibility = () => {
      const hidden = document.hidden;
      setTabHidden(hidden);
      if (hidden) {
        reportToBackend('tab_hidden');
      } else {
        if (reportRef.current) {
          try {
            reportRef.current({ type: 'tab_visible', timestamp: new Date().toISOString() });
          } catch (_) {}
        }
      }
    };

    // ============================================================
    // 5. WINDOW BLUR
    // ============================================================
    const onWindowBlur = () => {
      setTabHidden(true);
      reportToBackend('window_blur');
    };
    const onWindowFocus = () => {
      setTabHidden(false);
    };

    // ============================================================
    // 6. PRINT (beforeprint event)
    // ============================================================
    const onBeforePrint = (e) => {
      e.preventDefault?.();
      reportToBackend('print_attempt', { trigger: 'beforeprint' });
      return false;
    };

    // ============================================================
    // 7. DEVTOOLS HEURISTIC (size delta)
    // ============================================================
    const checkDevtools = () => {
      const widthDelta = Math.max(0, window.outerWidth - window.innerWidth);
      const heightDelta = Math.max(0, window.outerHeight - window.innerHeight);
      const open = widthDelta > DEVTOOLS_THRESHOLD || heightDelta > DEVTOOLS_THRESHOLD;
      setDevtoolsOpen(prev => {
        if (open !== prev) {
          if (open) {
            reportToBackend('devtools_opened', {
              trigger: 'size_delta',
              wDelta: widthDelta,
              hDelta: heightDelta
            });
          }
        }
        return open;
      });
    };

    // ============================================================
    // Mount listeners
    // ============================================================
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('beforeprint', onBeforePrint);

    const intervalId = setInterval(checkDevtools, DEVTOOLS_CHECK_INTERVAL_MS);

    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('beforeprint', onBeforePrint);
      clearInterval(intervalId);
    };
  }, [enabled]);

  return { tabHidden, devtoolsOpen };
}
