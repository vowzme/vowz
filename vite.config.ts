import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Rewrites `?v=<any>` on apple-touch-icon, apple-touch-startup-image, mask-icon,
 * icon, and manifest links to a fresh build-time version so iOS/Android refetch
 * icons and splash screens after every release. Only runs in build.
 */
function iconCacheBust() {
  const version = Date.now().toString(36);
  return {
    name: "icon-cache-bust",
    apply: "build" as const,
    transformIndexHtml(html: string) {
      return html.replace(
        /(href="\/(?:icons|splash|manifest\.webmanifest|favicon[^"]*)[^"?]*)(\?v=[^"]*)?"/g,
        (_m, p1) => `${p1}?v=${version}"`,
      );
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    iconCacheBust(),
    // Emits /sw.js at build time — needed for PWABuilder / Play Store TWA
    // installability. Registration is done manually from src/pwa/register.ts
    // (see skill/pwa: NEVER register in dev/preview/iframe).
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      filename: "sw.js",
      strategies: "generateSW",
      devOptions: { enabled: false },
      manifest: false, // we ship our own manifest.webmanifest
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//, /^\/functions\//],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "html",
              networkTimeoutSeconds: 3,
              // When both network and cache miss (true offline + uncached route),
              // Workbox serves this precached page instead of a browser error.
              precacheFallback: { fallbackURL: "/offline.html" },
            },
          },
          {
            urlPattern: /\.(?:js|css|woff2)$/,
            handler: "CacheFirst",
            options: { cacheName: "static-assets", expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          {
            urlPattern: /\/(icons|splash)\//,
            handler: "CacheFirst",
            options: { cacheName: "pwa-icons", expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
