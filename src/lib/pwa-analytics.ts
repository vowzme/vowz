/**
 * Lightweight PWA analytics.
 *
 * No third-party SDK. Each event is:
 *   1. Logged to `console.info` under a `[pwa-analytics]` prefix.
 *   2. Dispatched as a `CustomEvent("pwa:analytics")` on `window` so any
 *      future provider (GA, PostHog, Supabase edge fn) can subscribe.
 *   3. Buffered in `localStorage` (last 50 events) for debugging in the field.
 *
 * Safe to call from any browser context (dev, preview, prod) — never throws.
 */
export type PwaEventName =
  | "pwa_offline_fallback_shown"
  | "pwa_connectivity_lost"
  | "pwa_connectivity_recovered"
  | "pwa_update_prompt_shown"
  | "pwa_update_prompt_accepted";

export interface PwaEvent {
  name: PwaEventName;
  at: number;
  url: string;
  data?: Record<string, unknown>;
}

const BUFFER_KEY = "vowz.pwa.events";
const BUFFER_MAX = 50;

export function trackPwaEvent(name: PwaEventName, data?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const event: PwaEvent = {
    name,
    at: Date.now(),
    url: window.location.href,
    data,
  };
  try {
    console.info("[pwa-analytics]", name, data ?? {});
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent<PwaEvent>("pwa:analytics", { detail: event }));
  } catch {}
  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    const buf: PwaEvent[] = raw ? JSON.parse(raw) : [];
    buf.push(event);
    while (buf.length > BUFFER_MAX) buf.shift();
    localStorage.setItem(BUFFER_KEY, JSON.stringify(buf));
  } catch {}
}

/** Wires online/offline listeners so connectivity transitions are tracked
 *  even on cached SPA routes (not just the static /offline.html shell). */
let connectivityWired = false;
export function wireConnectivityAnalytics() {
  if (typeof window === "undefined" || connectivityWired) return;
  connectivityWired = true;
  window.addEventListener("offline", () => trackPwaEvent("pwa_connectivity_lost"));
  window.addEventListener("online", () => trackPwaEvent("pwa_connectivity_recovered"));
}