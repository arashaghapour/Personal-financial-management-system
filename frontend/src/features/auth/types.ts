/**
 * Authentication types mirroring the backend contract
 * (see docs/OpenAPI.yml and backend/src/modules/auth/auth.types.ts).
 */

/** Public user information returned by the backend (never includes password hashes). */
export type PublicUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
};

/** POST /api/auth/register request body. */
export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

/** POST /api/auth/login request body. */
export type LoginRequest = {
  email: string;
  password: string;
};

/** POST /api/auth/refresh request body. */
export type RefreshRequest = {
  refreshToken: string;
};

/** POST /api/auth/logout request body. */
export type LogoutRequest = {
  refreshToken: string;
};

/** POST /api/auth/register response. */
export type RegisterResponse = {
  user: PublicUser;
};

/** POST /api/auth/login response. */
export type LoginResponse = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

/** POST /api/auth/refresh response. */
export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};
