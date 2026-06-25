import { supabase } from "@/integrations/supabase/client";

export type TemplateEventType = "open" | "preview" | "use" | "render" | "download";

function getVisitorId(): string {
  try {
    let v = sessionStorage.getItem("ss_visitor_id");
    if (!v) { v = crypto.randomUUID(); sessionStorage.setItem("ss_visitor_id", v); }
    return v;
  } catch { return "anon"; }
}

// Lightweight per-session dedupe so a single page render doesn't fire 10 events.
const fired = new Set<string>();

export async function trackTemplateEvent(
  slug: string,
  type: TemplateEventType,
  meta?: Record<string, unknown>,
) {
  // Dedupe only passive events; user-driven actions always fire.
  const dedupable = type === "open" || type === "preview";
  const key = `${slug}:${type}`;
  if (dedupable && fired.has(key)) return;
  if (dedupable) fired.add(key);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await (supabase as any).from("template_events").insert({
      template_slug: slug,
      event_type: type,
      user_id: user?.id ?? null,
      visitor_id: getVisitorId(),
      meta: meta ?? null,
    });
  } catch {
    // analytics must never throw
  }
}

export interface TemplatePopularity {
  template_slug: string;
  score: number;
  opens: number;
  previews: number;
  uses: number;
}

export async function fetchTemplatePopularity(): Promise<Record<string, number>> {
  try {
    const { data } = await (supabase as any).rpc("get_template_popularity");
    const map: Record<string, number> = {};
    for (const row of (data ?? []) as TemplatePopularity[]) {
      map[row.template_slug] = Number(row.score) || 0;
    }
    return map;
  } catch {
    return {};
  }
}