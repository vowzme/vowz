import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import {
  FALLBACK_TEMPLATES,
  CARD_THEMES,
  InvitationCardArtwork,
  CATEGORY_LABELS,
} from "@/lib/card-templates";

const DEMO = {
  partner1: "Aanya",
  partner2: "Rohan",
  date: "Saturday, 14 February 2026",
  time: "6:00 PM onwards",
  venue: "The Leela Palace, Udaipur",
  invitationLine: "Together with their families",
  message: "Two souls, one journey — join us as we say I do.",
};

/**
 * Compact invitation-card style chooser with live artwork previews.
 * Used inside the wedding-site wizard so couples pick a card design
 * while they build their site. Full catalogue lives at /card-gallery.
 */
export default function CardStylePicker({
  value,
  onChange,
  limit = 12,
}: {
  value?: string;
  onChange: (slug: string) => void;
  limit?: number;
}) {
  const templates = useMemo(() => {
    // One design per category first, then fill up to `limit` with the
    // base (non-occasion) designs so the row always feels varied.
    const base = FALLBACK_TEMPLATES.filter(
      (t) => !t.slug.includes("__") && CARD_THEMES[t.slug],
    );
    const seen = new Set<string>();
    const picked: typeof base = [];
    for (const cat of Object.keys(CATEGORY_LABELS)) {
      const first = base.find((t) => t.category === cat);
      if (first && !seen.has(first.slug)) { seen.add(first.slug); picked.push(first); }
    }
    for (const t of base) {
      if (picked.length >= limit) break;
      if (seen.has(t.slug)) continue;
      seen.add(t.slug);
      picked.push(t);
    }
    // Keep the chosen design visible even when it is outside the shortlist.
    if (value && !seen.has(value)) {
      const chosen = FALLBACK_TEMPLATES.find((t) => t.slug === value);
      if (chosen && CARD_THEMES[chosen.slug]) picked.unshift(chosen);
    }
    return picked;
  }, [limit, value]);

  return (
    <div className="mt-10">
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <p className="text-xs uppercase tracking-widest font-body text-muted-foreground">
            Invitation card style
          </p>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Optional — pick a matching card now and we'll open it ready to edit.
          </p>
        </div>
        <Link
          to="/card-gallery"
          className="shrink-0 text-xs font-body text-gold hover:underline inline-flex items-center gap-1"
        >
          Browse all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {templates.map((t) => {
          const theme = CARD_THEMES[t.slug];
          const selected = value === t.slug;
          return (
            <button
              key={t.slug}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? "" : t.slug)}
              className={`group text-left rounded-2xl border-2 overflow-hidden transition-all bg-card ${
                selected ? "border-gold shadow-md" : "border-transparent hover:border-gold/40"
              }`}
            >
              <div className="h-[180px] flex items-center justify-center overflow-hidden bg-muted/30">
                <div style={{ transform: "scale(0.42)", transformOrigin: "center" }}>
                  <InvitationCardArtwork data={DEMO} theme={theme} width={420} qrPosition="hidden" />
                </div>
              </div>
              <div className="p-2.5 flex items-center justify-between gap-2">
                <span
                  className={`font-display text-xs font-semibold line-clamp-1 ${
                    selected ? "text-gold" : "text-foreground"
                  }`}
                >
                  {t.name}
                </span>
                {selected && <Check className="w-4 h-4 text-gold shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
