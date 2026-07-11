/**
 * PWA service worker registration.
 *
 * Registers `/sw.js` only in production browsers on the real domain.
 * Never registers in Lovable preview, dev servers, iframes, or when the
 * URL carries `?sw=off` (kill switch). See docs/pwabuilder-android.md.
 *
 * When a new SW is installed and waiting, shows a sonner toast prompting
 * the user to reload so the fresh offline cache and app shell take effect.
 */
import { toast } from "sonner";
import { trackPwaEvent, wireConnectivityAnalytics } from "@/lib/pwa-analytics";

const SW_PATH = "/sw.js";

function isRefusedContext(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true; // cross-origin iframe access throws — treat as refused
  }
  const { hostname, search } = window.location;
  if (new URLSearchParams(search).has("sw") && new URLSearchParams(search).get("sw") === "off") return true;
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (hostname.startsWith("id-preview--") || hostname.startsWith("preview--")) return true;
  if (hostname === "lovableproject.com" || hostname.endsWith(".lovableproject.com")) return true;
  if (hostname === "lovableproject-dev.com" || hostname.endsWith(".lovableproject-dev.com")) return true;
  if (hostname === "beta.lovable.dev" || hostname.endsWith(".beta.lovable.dev")) return true;
  return false;
}

async function unregisterMatching() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs
      .filter((r) => r.active?.scriptURL.endsWith(SW_PATH) || r.installing?.scriptURL.endsWith(SW_PATH) || r.waiting?.scriptURL.endsWith(SW_PATH))
      .map((r) => r.unregister()),
  );
}

export async function registerPwa() {
  if (!("serviceWorker" in navigator)) return;
  wireConnectivityAnalytics();
  if (isRefusedContext()) {
    await unregisterMatching();
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
    watchForUpdate(reg);
  } catch (err) {
    console.warn("[pwa] service worker registration failed", err);
  }
}

function promptReload(worker: ServiceWorker) {
  trackPwaEvent("pwa_update_prompt_shown");
  toast("Update available", {
    description: "A new version of Vowz is ready. Reload to get the latest.",
    duration: Infinity,
    action: {
      label: "Reload",
      onClick: () => {
        trackPwaEvent("pwa_update_prompt_accepted");
        // Ask the waiting SW to activate; reload once it takes control.
        worker.postMessage({ type: "SKIP_WAITING" });
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => window.location.reload(),
          { once: true },
        );
      },
    },
  });
}

function watchForUpdate(reg: ServiceWorkerRegistration) {
  // Case 1: A waiting worker was already present at registration time.
  if (reg.waiting && navigator.serviceWorker.controller) {
    promptReload(reg.waiting);
  }
  // Case 2: An update is found — wait for it to install, then prompt.
  reg.addEventListener("updatefound", () => {
    const installing = reg.installing;
    if (!installing) return;
    installing.addEventListener("statechange", () => {
      if (installing.state === "installed" && navigator.serviceWorker.controller) {
        promptReload(installing);
      }
    });
  });
  // Poll periodically so long-lived tabs pick up new releases.
  setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
}