/**
 * useAuth — Authentication state management
 *
 * Provides a single source of truth for auth state across the app.
 * Handles: LIFF init, registration check, session restoration, lock countdown.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { initLiff, getProfile, getIdToken } from '../api/liff.js';
import { checkRegistration, loadSession, clearSession } from '../api/auth.js';

// ========== Auth status enum ==========
// 'loading'        — initial state, LIFF initializing
// 'unregistered'   — no user record in DB
// 'pending'        — registered but waiting for admin approval
// 'disabled'       — account disabled
// 'needsPin'       — active, needs to set PIN (first login)
// 'needsLogin'     — active, has PIN, needs to enter it
// 'locked'         — too many failed PIN attempts
// 'authenticated' — has valid session
// 'error'          — initialization failed

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [profile, setProfile] = useState(null);       // from LIFF
  const [user, setUser] = useState(null);             // from backend checkRegistration
  const [session, setSession] = useState(null);       // active session
  const [error, setError] = useState(null);
  const [lockedUntil, setLockedUntil] = useState(null);

  const refresh = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      // 1. Init LIFF
      await initLiff();

      // 2. Get profile
      const liffProfile = await getProfile();
      setProfile(liffProfile);

      // 3. Try restore session from sessionStorage
      const existingSession = loadSession();
      if (existingSession) {
        setSession(existingSession);
        setUser(existingSession.user);
        setStatus('authenticated');
        return;
      }

      // 4. Check backend registration
      const idToken = getIdToken();
      if (!idToken) throw new Error('No ID token');

      const r = await checkRegistration(idToken);
      if (!r.ok) {
        setError(r.error);
        setStatus('error');
        return;
      }

      if (!r.registered) {
        setStatus('unregistered');
        return;
      }

      // Has user record
      setUser({
        displayName: r.displayName,
        department: r.department,
        isAdmin: r.isAdmin,
        status: r.status,
        hasPin: r.hasPin
      });

      if (r.status === 'pending') {
        setStatus('pending');
        return;
      }
      if (r.status === 'disabled') {
        setStatus('disabled');
        return;
      }
      // status === 'active'
      if (r.locked) {
        setLockedUntil(r.lockedUntil);
        setStatus('locked');
        return;
      }
      if (!r.hasPin) {
        setStatus('needsPin');
        return;
      }
      setStatus('needsLogin');
    } catch (err) {
      setError(err.message || 'Initialization error');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onLoginSuccess = useCallback((sessionData) => {
    setSession(sessionData);
    setUser(sessionData.user);
    setStatus('authenticated');
  }, []);

  const onLocked = useCallback((until) => {
    setLockedUntil(until);
    setStatus('locked');
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setStatus('needsLogin');
  }, []);

  const value = {
    status,
    profile,
    user,
    session,
    error,
    lockedUntil,
    refresh,
    onLoginSuccess,
    onLocked,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
