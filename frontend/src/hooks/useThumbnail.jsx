/**
 * useThumbnail — load page 1 of a document as a signed-URL thumbnail.
 *
 * Module-level cache shared across all DocumentCards so navigating away
 * and back doesn't re-mint URLs while they're still valid.
 *
 * Signed URLs have a 5-minute TTL (worker side); we drop entries from the
 * cache slightly earlier to avoid handing out a URL that's about to expire.
 *
 * `enabled` lets the caller gate the network request on IntersectionObserver
 * visibility — pass false until the card scrolls into view.
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth.jsx';
import { getPage } from '../api/pages.js';
import { getIdToken } from '../api/liff.js';

const CACHE_TTL_MS = 4 * 60 * 1000;
const cache = new Map();
const inflight = new Map();

export function useThumbnail(documentId, enabled = true) {
  const auth = useAuth();
  const [url, setUrl] = useState(() => {
    const hit = documentId ? cache.get(documentId) : null;
    if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) return hit.url;
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => { cancelledRef.current = true; };
  }, []);

  useEffect(() => {
    if (!enabled || !documentId || !auth.session) return;

    const cached = cache.get(documentId);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      setUrl(cached.url);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const existing = inflight.get(documentId);
    const promise = existing || (async () => {
      const idToken = getIdToken();
      const r = await getPage(idToken, auth.session.token, documentId, 1);
      if (!r.ok) {
        const err = new Error(r.error || 'thumbnail load failed');
        err.needsLogin = r.needsLogin;
        throw err;
      }
      const u = r.url || (r.data ? `data:${r.mimeType || 'image/png'};base64,${r.data}` : null);
      if (!u) throw new Error('no url in response');
      cache.set(documentId, { url: u, fetchedAt: Date.now() });
      return u;
    })();

    if (!existing) inflight.set(documentId, promise);

    promise
      .then((u) => {
        if (cancelled || cancelledRef.current) return;
        setUrl(u);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled || cancelledRef.current) return;
        if (e.needsLogin) auth.logout();
        setError(e.message);
        setLoading(false);
      })
      .finally(() => {
        if (inflight.get(documentId) === promise) inflight.delete(documentId);
      });

    return () => { cancelled = true; };
  }, [documentId, enabled, auth.session, auth.logout]);

  return { url, loading, error };
}

export function clearThumbnailCache() {
  cache.clear();
  inflight.clear();
}
