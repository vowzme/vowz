import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Split the shared vendor code out of the single 1 MB entry chunk so the
    // browser can download them in parallel and keep them cached between
    // releases (app code changes far more often than React/Radix/Supabase).
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id))
            return "vendor-react";
          if (id.includes("framer-motion") || id.includes("motion-dom") || id.includes("motion-utils"))
            return "vendor-motion";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("@tanstack")) return "vendor-query";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("date-fns")) return "vendor-date";
          // Everything else keeps Rollup's automatic per-route splitting so
          // heavy one-off libraries (PDF, charts, canvas) stay lazy.
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
}));
