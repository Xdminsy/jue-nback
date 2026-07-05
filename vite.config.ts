import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
const base = process.env.BASE_PATH ?? (repository ? `/${repository}/` : "/");

export default defineConfig({
  base,
  esbuild: {
    target: "es2019"
  },
  build: {
    target: "es2019",
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll("\\", "/");
          if (!normalizedId.includes("node_modules")) {
            return undefined;
          }

          if (
            normalizedId.includes("/react/") ||
            normalizedId.includes("/react-dom/") ||
            normalizedId.includes("/react-router-dom/") ||
            normalizedId.includes("/@remix-run/") ||
            normalizedId.includes("/scheduler/")
          ) {
            return "react-vendor";
          }

          if (normalizedId.includes("/lucide-react/") || normalizedId.includes("/@radix-ui/")) {
            return "ui-vendor";
          }

          if (
            normalizedId.includes("/dexie/") ||
            normalizedId.includes("/i18next/") ||
            normalizedId.includes("/react-i18next/") ||
            normalizedId.includes("/zod/") ||
            normalizedId.includes("/zustand/")
          ) {
            return "app-vendor";
          }

          return "vendor";
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-icon.svg"],
      manifest: {
        name: "Jue N-Back",
        short_name: "N-Back",
        description: "Offline-first n-back training for desktop and mobile.",
        lang: "zh-CN",
        theme_color: "#137a72",
        background_color: "#f7f4ed",
        display: "standalone",
        orientation: "portrait",
        start_url: ".",
        scope: ".",
        icons: [
          {
            src: "pwa-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        navigateFallback: "index.html"
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
    exclude: ["e2e/**", "node_modules/**", "dist/**"]
  }
});
