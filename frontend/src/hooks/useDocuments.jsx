/**
 * useDocuments — fetch and cache documents per category
 *
 * Cache strategy:
 * - Per-category cache in module-level Map
 * - 5-minute TTL
 * - Refetch on demand (force=true)
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth.jsx';
import { getDocuments } from '../api/documents.js';
import { getIdToken } from '../api/liff.js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();   // category → { docs, fetchedAt }

export function useDocuments(category) {
  const auth = useAuth();
  const [docs, setDocs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocs = useCallback(async (force) => {
    if (!auth.session) {
      setError('ยังไม่ได้ login');
      return;
    }

    // Use cache if available and not stale
    if (!force) {
      const cached = cache.get(category);
      if (cached && (Date.now() - cached.fetchedAt < CACHE_TTL_MS)) {
        setDocs(cached.docs);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const idToken = getIdToken();
      const r = await getDocuments(idToken, auth.session.token, category);

      if (!r.ok) {
        // If session invalid, force re-login
        if (r.needsLogin) {
          auth.logout();
          return;
        }
        setError(r.error || 'โหลดข้อมูลไม่สำเร็จ');
        setLoading(false);
        return;
      }

      cache.set(category, { docs: r.documents, fetchedAt: Date.now() });
      setDocs(r.documents);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }, [category, auth.session, auth.logout]);

  useEffect(() => {
    fetchDocs(false);
  }, [fetchDocs]);

  return {
    docs,
    loading,
    error,
    refetch: () => fetchDocs(true)
  };
}

/**
 * Clear all cached documents (e.g. after logout)
 */
export function clearDocumentsCache() {
  cache.clear();
}
