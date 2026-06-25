import { supabase } from "@/integrations/supabase/client";

export type TemplateEventType = "open" | "preview" | "use";

function getVisitorId(): string {
  try {
    let v = sessionStorage.getItem("ss_visitor_id");
    if (!v) { v = crypto.randomUUID(); sessionStorage.setItem("ss_visitor_id", v); }
    return v;
  } catch { return "anon"; }
}

// Lightweight per-session dedupe so a single page render doesn't fire 10 events.
const fired = new Set<string>();

export async function trackTemplateEvent(slug: string, type: TemplateEventType) {
  const key = `${slug}:${type}`;
  if (fired.has(key) && type !== "use") return;
  fired.add(key);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await (supabase as any).from("template_events").insert({
      template_slug: slug,
      event_type: type,
      user_id: user?.id ?? null,
      visitor_id: getVisitorId(),
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