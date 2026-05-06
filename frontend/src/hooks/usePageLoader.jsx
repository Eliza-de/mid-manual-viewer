/**
 * usePageLoader — load a document page with caching + prefetch
 *
 * Uses a ref-based LRU cache (max 10 pages) per document.
 * When page changes, also prefetches next page in background.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth.jsx';
import { getPage } from '../api/pages.js';
import { getIdToken } from '../api/liff.js';

const CACHE_MAX = 10;

export function usePageLoader(documentId, pageNumber, totalPages) {
  const auth = useAuth();
  const [data, setData] = useState(null);   // base64 string
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cache keyed by `${documentId}:${page}`
  const cacheRef = useRef(new Map());
  // Track LRU order
  const cacheOrderRef = useRef([]);

  const cacheKey = useCallback((doc, page) => doc + ':' + page, []);

  const cacheGet = useCallback((doc, page) => {
    const key = cacheKey(doc, page);
    if (cacheRef.current.has(key)) {
      // Move to end (most recently used)
      cacheOrderRef.current = cacheOrderRef.current.filter(k => k !== key);
      cacheOrderRef.current.push(key);
      return cacheRef.current.get(key);
    }
    return null;
  }, [cacheKey]);

  const cacheSet = useCallback((doc, page, value) => {
    const key = cacheKey(doc, page);
    if (cacheRef.current.size >= CACHE_MAX && !cacheRef.current.has(key)) {
      // Evict oldest
      const oldest = cacheOrderRef.current.shift();
      if (oldest) cacheRef.current.delete(oldest);
    }
    cacheRef.current.set(key, value);
    cacheOrderRef.current = cacheOrderRef.current.filter(k => k !== key);
    cacheOrderRef.current.push(key);
  }, [cacheKey]);

  const loadPage = useCallback(async (doc, page, isPrefetch) => {
    if (!auth.session) return null;

    // Cache hit
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
      const dataUri = 'data:' + r.mimeType + ';base64,' + r.data;
      cacheSet(doc, page, dataUri);
      return dataUri;
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

  // Prefetch next page
  useEffect(() => {
    if (!documentId || !pageNumber || !totalPages) return;
    const next = pageNumber + 1;
    if (next > totalPages) return;
    // Fire and forget
    loadPage(documentId, next, true);
  }, [documentId, pageNumber, totalPages, loadPage]);

  // Clear cache when document changes
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      cacheRef.current.clear();
      cacheOrderRef.current = [];
    };
  }, [documentId]);

  return { data, loading, error };
}
