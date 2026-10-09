type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
let deferred: BIPEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as BIPEvent; emit(); });
  window.addEventListener("appinstalled", () => { deferred = null; localStorage.setItem("vowz_app_installed", "1"); emit(); });
}

export const subscribeInstall = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); };
export const canPromptInstall = () => !!deferred;
export const isStandalone = () =>
  typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true);
export const isIOS = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
export const isInIframe = () => { try { return window.self !== window.top; } catch { return true; } };

/** Shows the browser's install dialog. Resolves true when the user accepts. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null; emit();
  return outcome === "accepted";
}

export const waitForInstalled = (ms = 15000) =>
  new Promise<boolean>((res) => {
    const t = setTimeout(() => res(false), ms);
    window.addEventListener("appinstalled", () => { clearTimeout(t); res(true); }, { once: true });
  });
