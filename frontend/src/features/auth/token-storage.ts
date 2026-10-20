/**
 * Token storage for the authenticated session.
 *
 * The backend returns access and refresh tokens in the JSON response body
 * (verified: no cookies are used), so the frontend persists them in
 * localStorage to support session restoration across reloads. Tokens are
 * never rendered in the UI, logged, or included in error messages.
 */

const ACCESS_TOKEN_KEY = "fm.auth.accessToken";
const REFRESH_TOKEN_KEY = "fm.auth.refreshToken";

const safeGet = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable (e.g. private mode); the session then only
    // lives in memory for the current page.
  }
};

const safeRemove = (key: string): void => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures; clearing is best-effort.
  }
};

export const tokenStorage = {
  getAccessToken(): string | null {
    return safeGet(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return safeGet(REFRESH_TOKEN_KEY);
  },

  setTokens(accessToken: string, refreshToken: string): void {
    safeSet(ACCESS_TOKEN_KEY, accessToken);
    safeSet(REFRESH_TOKEN_KEY, refreshToken);
  },

  clear(): void {
    safeRemove(ACCESS_TOKEN_KEY);
    safeRemove(REFRESH_TOKEN_KEY);
  },
};
