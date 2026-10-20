/**
 * API configuration for backend integration.
 *
 * In development the browser calls the same-origin `/api` path, which Vite
 * proxies to the backend (see vite.config.ts). This avoids cross-origin
 * requests, which the backend does not currently allow.
 *
 * Production builds may override the base URL through VITE_API_BASE_URL (see
 * frontend/.env.example). Frontend environment variables are bundled into the
 * client, so they must never contain secrets.
 */
const DEFAULT_API_BASE_URL = "/api";

const configuredBaseUrl = (
  import.meta.env.VITE_API_BASE_URL as string | undefined
)?.trim();

export const API_BASE_URL: string = import.meta.env.DEV
  ? DEFAULT_API_BASE_URL
  : configuredBaseUrl || DEFAULT_API_BASE_URL;
