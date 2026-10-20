import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { AuthContext } from "./auth-context";
import type { AuthStatus } from "./auth-context";

import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "./api/auth.api";

import {
  requestWithAuth,
  setSessionExpiredHandler,
} from "./api/auth-client";

import { tokenStorage } from "./token-storage";

import type { LoginRequest, PublicUser, RegisterRequest } from "./types";

const noop = (): void => {};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<PublicUser | null>(null);

  // When a request fails because the session can no longer be restored
  // (expired access token and an unusable refresh token), clear the React
  // state so the application consistently shows the unauthenticated view.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setStatus("unauthenticated");
    });

    return () => {
      setSessionExpiredHandler(noop);
    };
  }, []);

  // Restore the session when the application starts.
  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const hasStoredTokens = Boolean(
        tokenStorage.getAccessToken() ?? tokenStorage.getRefreshToken(),
      );

      if (!hasStoredTokens) {
        setUser(null);
        setStatus("unauthenticated");

        return;
      }

      try {
        const currentUser = await requestWithAuth((accessToken) =>
          getCurrentUser(accessToken),
        );

        if (!active) {
          return;
        }

        setUser(currentUser);
        setStatus("authenticated");
      } catch {
        tokenStorage.clear();

        if (!active) {
          return;
        }

        setUser(null);
        setStatus("unauthenticated");
      }
    };

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const result = await loginRequest(credentials);

    tokenStorage.setTokens(result.accessToken, result.refreshToken);

    setUser(result.user);
    setStatus("authenticated");
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    await registerRequest(data);
  }, []);

  const logout = useCallback(async () => {
    try {
      // The refresh token is read at request time so the token that is
      // revoked server-side is always the currently valid one, even if the
      // access token was refreshed first.
      await requestWithAuth((accessToken) =>
        logoutRequest(accessToken, {
          refreshToken: tokenStorage.getRefreshToken() ?? "",
        }),
      );
    } catch {
      // The local session is cleared regardless of the API result, so a
      // failed logout never leaves the UI appearing authenticated.
    } finally {
      tokenStorage.clear();

      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ status, user, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
