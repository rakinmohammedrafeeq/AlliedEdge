import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

const backendTarget = process.env.VITE_BACKEND_TARGET || "http://localhost:8080";

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: backendTarget,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
        // OAuth2 login flows are served by the backend, not the Vite dev server.
        "/oauth2": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/login/oauth2": {
          target: backendTarget,
          changeOrigin: true,
        },
        // Some Spring Security endpoints (e.g., form login) live under /login
        "/login": {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
