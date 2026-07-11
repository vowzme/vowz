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
      // "prompt" keeps the new SW in `waiting` so we can show a reload toast
      // via src/pwa/register.ts. `skipWaiting` is disabled below for the same
      // reason; the toast's Reload button posts SKIP_WAITING when the user
      // opts in.
      registerType: "prompt",
      injectRegister: null,
      filename: "sw.js",
      strategies: "generateSW",
      devOptions: { enabled: false },
      manifest: false, // we ship our own manifest.webmanifest
      workbox: {
        skipWaiting: false,
        clientsClaim: true,
        importScripts: ["/sw-extras.js"],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Guarantee the offline fallback is in the precache manifest even if
        // globPatterns misses it (PWABuilder verifies an offline response).
        additionalManifestEntries: [
          { url: "/offline.html", revision: null },
          { url: "/", revision: null },
        ],
        // Disable vite-plugin-pwa's default NavigationRoute (index.html) so our
        // NetworkFirst nav handler below runs and can fall back to offline.html
        // when the network is unreachable. Cast to `any` because the plugin
        // typings default to `string` but workbox-build accepts null to disable.
        navigateFallback: null as unknown as string,
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
              plugins: [
                {
                  // Belt-and-suspenders: if the strategy still errors (e.g. the
                  // SW returned a non-OK response while offline), serve the
                  // precached offline shell so PWABuilder's offline check sees
                  // a valid 200 response.
                  handlerDidError: async () => {
                    const cache = await caches.open("html");
                    return (
                      (await cache.match("/offline.html")) ||
                      (await caches.match("/offline.html")) ||
                      Response.error()
                    );
                  },
                },
              ],
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
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
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
