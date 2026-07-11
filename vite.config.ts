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
  plugins: [react(), iconCacheBust(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
