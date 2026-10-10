/**
 * API configuration for future backend integration.
 *
 * The base URL is provided through the VITE_API_BASE_URL environment variable
 * (see frontend/.env.example) with a safe local development default. No
 * authentication, token refresh, or feature-specific requests are implemented
 * yet.
 *
 * Frontend environment variables are bundled into the client, so they must
 * never contain secrets.
 */
const DEFAULT_API_BASE_URL = "http://localhost:3000/api";

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  DEFAULT_API_BASE_URL;
