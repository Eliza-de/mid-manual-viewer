/**
 * usePageLoader — load a document page URL with caching + lazy prefetch
 *
 * 2026-05-13 — switched from base64 data URIs to short-lived signed URLs
 *              minted by the worker. Browser fetches the PNG itself and the
 *              edge cache handles repeat hits.
 *
 * Behavior:
 *   - Per-document LRU cache (max 10 page URLs)
 *   - URL TTL is 5 min; we treat them as immutable until cache eviction
 *   - Prefetch next page after 300ms idle (cancelled on rapid page change)
 *     to avoid hammering the worker when users flip pages quickly.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth.jsx';
import { getPage } from '../api/pages.js';
import { getIdToken } from '../api/liff.js';

const CACHE_MAX = 10;
const PREFETCH_DELAY_MS = 300;

export function usePageLoader(documentId, pageNumber, totalPages) {
  const auth = useAuth();
  const [data, setData] = useState(null);     // URL string (used as <img src>)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cache keyed by `${documentId}:${page}` → URL string
  const cacheRef = useRef(new Map());
  const cacheOrderRef = useRef([]);

  const cacheKey = useCallback((doc, page) => doc + ':' + page, []);

  const cacheGet = useCallback((doc, page) => {
    const key = cacheKey(doc, page);
    if (cacheRef.current.has(key)) {
      cacheOrderRef.current = cacheOrderRef.current.filter((k) => k !== key);
      cacheOrderRef.current.push(key);
      return cacheRef.current.get(key);
    }
    return null;
  }, [cacheKey]);

  const cacheSet = useCallback((doc, page, value) => {
    const key = cacheKey(doc, page);
    if (cacheRef.current.size >= CACHE_MAX && !cacheRef.current.has(key)) {
      const oldest = cacheOrderRef.current.shift();
      if (oldest) cacheRef.current.delete(oldest);
    }
    cacheRef.current.set(key, value);
    cacheOrderRef.current = cacheOrderRef.current.filter((k) => k !== key);
    cacheOrderRef.current.push(key);
  }, [cacheKey]);

  const loadPage = useCallback(async (doc, page, isPrefetch) => {
    if (!auth.session) return null;

    const cached = cacheGet(doc, page);
    if (cached) return cached;

    if (!isPrefetch) {
      setLoading(true);
      setError(null);
    }

    try {
      const idToken = getIdToken();
      const r = await getPage(idToken, auth.session.token, doc, page);
      if (!r.ok) {
        if (r.needsLogin) {
          auth.logout();
          return null;
        }
        if (!isPrefetch) {
          setError(r.error || 'โหลดหน้าไม่สำเร็จ');
          setLoading(false);
        }
        return null;
      }
      // New backend returns signed URL; legacy fallback for base64.
      const url = r.url || (r.data ? `data:${r.mimeType || 'image/png'};base64,${r.data}` : null);
      if (!url) {
        if (!isPrefetch) {
          setError('Backend ไม่ส่ง URL กลับมา');
          setLoading(false);
        }
        return null;
      }
      cacheSet(doc, page, url);
      return url;
    } catch (err) {
      if (!isPrefetch) {
        setError(err.message || 'เกิดข้อผิดพลาด');
        setLoading(false);
      }
      return null;
    }
  }, [auth.session, auth.logout, cacheGet, cacheSet]);

  // Load current page
  useEffect(() => {
    if (!documentId || !pageNumber) {
      setData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const result = await loadPage(documentId, pageNumber, false);
      if (cancelled) return;
      if (result) {
        setData(result);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [documentId, pageNumber, loadPage]);

  // Lazy prefetch next page — debounced so rapid page-changes don't pile up
  // network requests on the worker.
  useEffect(() => {
    if (!documentId || !pageNumber || !totalPages) return;
    const next = pageNumber + 1;
    if (next > totalPages) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      // If the URL is already cached we skip the request entirely
      const key = documentId + ':' + next;
      if (cacheRef.current.has(key)) return;
      loadPage(documentId, next, true);
    }, PREFETCH_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [documentId, pageNumber, totalPages, loadPage]);

  // Clear cache when document changes
  useEffect(() => {
    return () => {
      cacheRef.current.clear();
      cacheOrderRef.current = [];
    };
  }, [documentId]);

  return { data, loading, error };
}
