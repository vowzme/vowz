import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/400-italic.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cinzel/400.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/great-vibes/400.css";
import "@fontsource/dm-serif-display/400.css";
import "@fontsource/lato/400.css";
import { registerPwa } from "./pwa/register";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker (production, non-preview only — see src/pwa/register.ts)
registerPwa();
