import { supabase } from "@/integrations/supabase/client";

/**
 * Lightweight, privacy-friendly tracking for the marketing/product side of the
 * platform (landing, pricing, sign-up...). No cookies, no third parties — just
 * an anonymous random ID kept in the browser so we can count people instead of
 * page loads.
 */

const VISITOR_KEY = "vowz_visitor_id";
const SESSION_KEY = "vowz_session_id";

function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export function getPlatformVisitorId(): string {
  try {
    let v = localStorage.getItem(VISITOR_KEY);
    if (!v) {
      v = randomId();
      localStorage.setItem(VISITOR_KEY, v);
    }
    return v;
  } catch {
    return "anon";
  }
}

function getSessionId(): string {
  try {
    let s = sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s = randomId();
      sessionStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return "anon";
  }
}

// Avoid duplicate rows when React re-renders / StrictMode double-invokes.
const fired = new Set<string>();

export type PlatformEventType =
  | "page_view"
  | "signup_started"
  | "signup_completed"
  | "cta_click"
  | "themes_view"
  | "theme_pick"
  | "theme_site_created";

export async function trackPlatformEvent(
  eventType: PlatformEventType,
  opts: { path?: string; meta?: Record<string, unknown>; dedupeKey?: string } = {},
) {
  if (opts.dedupeKey) {
    if (fired.has(opts.dedupeKey)) return;
    fired.add(opts.dedupeKey);
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const { data } = await supabase.auth.getSession();
    await (supabase as any).from("platform_events").insert({
      visitor_id: getPlatformVisitorId(),
      session_id: getSessionId(),
      user_id: data.session?.user?.id ?? null,
      event_type: eventType,
      path: opts.path ?? window.location.pathname,
      referrer: document.referrer || null,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      meta: opts.meta ?? null,
    });
  } catch {
    // tracking must never break the page
  }
}
