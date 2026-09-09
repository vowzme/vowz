import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { RITUALS, DEFAULT_RITUAL_SETS, type RitualFaith } from "@/lib/rituals";

/**
 * "Rituals & Traditions" — an explainer couples switch on so guests who have
 * never attended this kind of wedding know what happens and what to wear.
 */
export function ritualIdsFor(data: any): string[] {
  const faith = (data?.faith || "hindu") as RitualFaith;
  const ids: string[] = Array.isArray(data?.rituals) && data.rituals.length
    ? data.rituals
    : DEFAULT_RITUAL_SETS[faith] || DEFAULT_RITUAL_SETS.common;
  return ids;
}

export default function RitualsSection({ data, accent }: { data: any; accent: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const ids = ritualIdsFor(data);
  const items = ids.map((id) => RITUALS.find((r) => r.id === id)).filter(Boolean) as typeof RITUALS;
  if (!items.length) return null;

  return (
    <section className="py-14 px-4" aria-label="Rituals and traditions">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-display text-3xl font-bold text-center text-foreground mb-2">
          {data?.heading || "Rituals & Traditions"}
        </h2>
        <div className="w-12 h-0.5 mx-auto mb-3" style={{ backgroundColor: accent }} />
        <p className="font-body text-center text-muted-foreground max-w-xl mx-auto mb-8">
          {data?.description || "A short guide to each ceremony — what happens, how long it takes, and what to wear."}
        </p>

        <div className="space-y-3">
          {items.map((r) => {
            const isOpen = open === r.id;
            return (
              <div key={r.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : r.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <span className="text-xl" aria-hidden>{r.emoji}</span>
                  <span className="flex-1">
                    <span className="block font-display text-lg text-foreground">{r.name}</span>
                    <span className="block font-body text-sm text-muted-foreground">{r.short}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-0 space-y-2 font-body text-sm">
                    {r.alt && <p className="text-muted-foreground italic">Also called: {r.alt}</p>}
                    <p className="text-foreground/90">{r.description}</p>
                    <p className="text-foreground/90"><strong>For guests:</strong> {r.guestTip}</p>
                    {r.dress && <p className="text-foreground/90"><strong>What to wear:</strong> {r.dress}</p>}
                    {r.duration && <p className="text-muted-foreground">Usually about {r.duration}.</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
