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
import { registerPwa } from "./pwa/register";

createRoot(document.getElementById("root")!).render(<App />);

// Fade out the boot splash once the app has painted.
const dismissBootSplash = () => {
  const splash = document.getElementById("boot-splash");
  if (!splash) return;
  splash.classList.add("is-hidden");
  window.setTimeout(() => splash.remove(), 600);
};
requestAnimationFrame(() => window.setTimeout(dismissBootSplash, 450));

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

// Register service worker (production, non-preview only — see src/pwa/register.ts)
registerPwa();
