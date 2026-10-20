import { existsSync } from "node:fs";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

/**
 * The browser must not call the backend container or port directly: the
 * backend has no CORS middleware. Instead, the browser calls same-origin
 * `/api` and Vite proxies it to the backend.
 *
 * Docker Compose runs the backend under the `backend` service name, while a
 * host-run dev server reaches it through the published localhost port.
 */
const DOCKER_PROXY_TARGET = "http://backend:3000";
const HOST_PROXY_TARGET = "http://localhost:3000";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const proxyTarget =
    env.VITE_API_PROXY_TARGET ||
    (existsSync("/.dockerenv") ? DOCKER_PROXY_TARGET : HOST_PROXY_TARGET);

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
