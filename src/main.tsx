import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Latin-only subsets: the full packages ship cyrillic/greek/vietnamese
// @font-face blocks that bloat the critical CSS for no benefit here.
import "@fontsource/playfair-display/latin-400.css";
import "@fontsource/playfair-display/latin-400-italic.css";
import "@fontsource/playfair-display/latin-700.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-600.css";

createRoot(document.getElementById("root")!).render(<App />);

/**
 * Decorative/template fonts (used by wedding site themes and invitation
 * cards, never by the landing page) load after first paint so they don't
 * compete with the hero render.
 */
const loadThemeFonts = () => {
  void Promise.all([
    import("@fontsource/cormorant-garamond/latin-400.css"),
    import("@fontsource/cormorant-garamond/latin-600.css"),
    import("@fontsource/cinzel/latin-400.css"),
    import("@fontsource/cinzel/latin-700.css"),
    import("@fontsource/great-vibes/latin-400.css"),
    import("@fontsource/dm-serif-display/latin-400.css"),
    import("@fontsource/lato/latin-400.css"),
  ]);
};

if (typeof window !== "undefined") {
  if ("requestIdleCallback" in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void })
      .requestIdleCallback(loadThemeFonts);
  } else {
    setTimeout(loadThemeFonts, 1200);
  }
}

/**
 * The installable-app layer was removed in favour of a real native app.
 * Visitors who previously installed the web app still carry an old service
 * worker and its caches, which would keep serving stale builds forever, so
 * tear both down once on load.
 */
if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  void navigator.serviceWorker
    .getRegistrations()
    .then((regs) => Promise.all(regs.map((r) => r.unregister())))
    .then(async () => {
      if (typeof caches === "undefined") return;
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    })
    .catch(() => {});
}
