/**
 * Admin Session — Frontend (pure JS, no TypeScript)
 *
 * Manages adminToken in localStorage
 *
 * AdminSessionData shape (documented):
 * {
 *   adminToken: string,
 *   expiresAt: number,        // unix ms
 *   user: {
 *     lineUserId: string,
 *     displayName: string,
 *     nickname?: string,
 *     fullName?: string,
 *     department?: string,
 *     isAdmin: boolean
 *   }
 * }
 */

const STORAGE_KEY = 'lean_buddy_admin_session';

export function saveAdminSession(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[adminSession] save failed', e);
  }
}

export function loadAdminSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);

    // Expired locally? clear it
    if (!data.expiresAt || data.expiresAt < Date.now()) {
      clearAdminSession();
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function getAdminToken() {
  const s = loadAdminSession();
  return s?.adminToken || null;
}

export function isAdminLoggedIn() {
  return !!loadAdminSession();
}

/**
 * Human-readable time remaining
 */
export function getSessionTimeRemaining() {
  const s = loadAdminSession();
  if (!s) return '';
  const remainingMs = s.expiresAt - Date.now();
  if (remainingMs <= 0) return 'หมดอายุแล้ว';

  const hours = Math.floor(remainingMs / 3600_000);
  const minutes = Math.floor((remainingMs % 3600_000) / 60_000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
