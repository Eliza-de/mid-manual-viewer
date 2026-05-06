import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID;

let initialized = false;
let initPromise = null;

/**
 * Initialize LIFF SDK. Idempotent — safe to call multiple times.
 */
export async function initLiff() {
  if (initialized) return;
  if (initPromise) return initPromise;

  if (!LIFF_ID) {
    throw new Error('VITE_LIFF_ID not configured');
  }

  initPromise = liff.init({ liffId: LIFF_ID })
    .then(() => {
      initialized = true;
    });

  return initPromise;
}

/**
 * Returns true if running inside the LINE in-app browser.
 */
export function isInLineClient() {
  try {
    return liff.isInClient();
  } catch {
    return false;
  }
}

/**
 * Returns true if user is logged in to LINE.
 */
export function isLoggedIn() {
  try {
    return liff.isLoggedIn();
  } catch {
    return false;
  }
}

/**
 * Trigger LINE login (only relevant outside LINE in-app browser).
 */
export function login() {
  liff.login();
}

/**
 * Logout from LIFF.
 */
export function logout() {
  liff.logout();
}

/**
 * Get the LINE user profile.
 * @returns {Promise<{userId: string, displayName: string, pictureUrl?: string, statusMessage?: string}>}
 */
export async function getProfile() {
  if (!initialized) await initLiff();
  return liff.getProfile();
}

/**
 * Get the LIFF ID Token (JWT) for backend verification.
 * @returns {string|null}
 */
export function getIdToken() {
  try {
    return liff.getIDToken();
  } catch {
    return null;
  }
}

/**
 * Close the LIFF window (returns to LINE chat).
 */
export function closeWindow() {
  if (isInLineClient()) {
    liff.closeWindow();
  }
}
