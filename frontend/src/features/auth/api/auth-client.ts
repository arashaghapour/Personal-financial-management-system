import { ApiError } from "../../../lib/api/client";

import { refreshTokens } from "./auth.api";
import { tokenStorage } from "../token-storage";

/**
 * Centralized access-token attachment and refresh handling.
 *
 * - Access tokens are attached as `Authorization: Bearer <token>`.
 * - A 401 from the backend triggers a single refresh attempt; the failed
 *   request is retried once with the new access token.
 * - Concurrent requests share the same in-flight refresh (single-flight), so
 *   the refresh endpoint is never called more than once for an expiry window.
 * - If the refresh itself fails, the local session is cleared and the request
 *   fails. At most one refresh plus one retry happens per request, so
 *   requests can never enter an infinite refresh loop.
 *
 * The backend rotates refresh tokens (the used token is revoked), so the new
 * refresh token from every refresh response must replace the stored one.
 */

let onSessionExpired: () => void = () => {};

/** Registers the handler invoked when the session can no longer be restored. */
export const setSessionExpiredHandler = (handler: () => void): void => {
  onSessionExpired = handler;
};

let refreshInFlight: Promise<boolean> | null = null;

const runRefresh = async (): Promise<boolean> => {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    tokenStorage.clear();
    onSessionExpired();

    return false;
  }

  try {
    const tokens = await refreshTokens({ refreshToken });

    tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);

    return true;
  } catch {
    tokenStorage.clear();
    onSessionExpired();

    return false;
  }
};

/**
 * Refreshes the session when a refresh token is available. Concurrent callers
 * share the same in-flight request.
 */
export const refreshSession = (): Promise<boolean> => {
  if (!refreshInFlight) {
    refreshInFlight = runRefresh().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
};

const isUnauthorized = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 401;

const unauthorizedError = (): ApiError =>
  new ApiError(401, "Authentication required", "UNAUTHORIZED");

/**
 * Runs a request that requires an access token, transparently refreshing the
 * session once when the current access token is missing or expired.
 */
export const requestWithAuth = async <T>(
  makeRequest: (accessToken: string) => Promise<T>,
): Promise<T> => {
  const accessToken = tokenStorage.getAccessToken();

  if (accessToken) {
    try {
      return await makeRequest(accessToken);
    } catch (error) {
      if (!isUnauthorized(error)) {
        throw error;
      }

      // The access token is expired or invalid: fall through to refresh.
    }
  }

  const refreshed = await refreshSession();

  if (!refreshed) {
    throw unauthorizedError();
  }

  const newAccessToken = tokenStorage.getAccessToken();

  if (!newAccessToken) {
    throw unauthorizedError();
  }

  // Single retry with the fresh token. A failure here surfaces to the caller
  // without triggering another refresh, which prevents refresh loops.
  return makeRequest(newAccessToken);
};
