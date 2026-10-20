import { apiRequest } from "../../../lib/api/client";

import type {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  PublicUser,
  RefreshRequest,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
} from "../types";

/**
 * Authentication API functions.
 *
 * All functions use the configured API base URL through the shared request
 * client. Components must not make raw HTTP requests independently; token
 * attachment and refresh behavior live in ./auth-client.ts.
 */

export const register = (
  data: RegisterRequest,
): Promise<RegisterResponse> =>
  apiRequest<RegisterResponse>("/auth/register", {
    method: "POST",
    body: data,
  });

export const login = (data: LoginRequest): Promise<LoginResponse> =>
  apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: data,
  });

export const refreshTokens = (
  data: RefreshRequest,
): Promise<RefreshResponse> =>
  apiRequest<RefreshResponse>("/auth/refresh", {
    method: "POST",
    body: data,
  });

export const getCurrentUser = (
  accessToken: string,
): Promise<PublicUser> =>
  apiRequest<PublicUser>("/auth/me", {
    accessToken,
  });

export const logout = (
  accessToken: string,
  data: LogoutRequest,
): Promise<void> =>
  apiRequest<void>("/auth/logout", {
    method: "POST",
    accessToken,
    body: data,
  });
