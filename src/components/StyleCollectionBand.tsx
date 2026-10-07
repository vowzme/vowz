import { useState } from "react";
import { Eye, Wand2 } from "lucide-react";
import { ThemeDemo } from "@/components/ThemeDemo";
import { LazyOnVisible } from "@/components/LazyOnVisible";
import { STYLE_COLLECTIONS, STYLE_OF, STYLE_THEMES, type StyleCollection } from "@/lib/theme-styles";
import { ARCHETYPE_LABELS, type WeddingTheme } from "@/lib/wedding-themes";

/** Browse-by-style band on /themes: Floral, Botanical, Rustic, Classic, Modern, Regency. */
export function StyleCollectionBand({
  onOpen, onPreview, onStart, starting,
}: {
  onOpen: (t: WeddingTheme) => void;
  onPreview: (t: WeddingTheme) => void;
  onStart: (t: WeddingTheme) => void;
  starting?: boolean;
}) {
  const [tab, setTab] = useState<StyleCollection | "All">("All");
  const list = tab === "All" ? STYLE_THEMES : STYLE_THEMES.filter((t) => STYLE_OF[t.id] === tab);

  return (
    <section id="styles" className="mb-14 scroll-mt-24">
      <header className="mb-4">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">Browse by style</h2>
        <p className="text-sm text-muted-foreground font-body mt-1 max-w-xl">
          {STYLE_THEMES.length} designs for any tradition: floral, botanical, rustic, classic, modern and regency.
        </p>
      </header>
      <div role="tablist" aria-label="Design style" className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {(["All", ...STYLE_COLLECTIONS] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={tab === s}
            onClick={() => setTab(s)}
            className={`shrink-0 min-h-10 rounded-full border px-4 text-sm font-body transition-colors ${tab === s ? "border-gold bg-gold text-primary" : "border-border bg-background text-foreground hover:border-gold/60"}`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <div key={t.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-elegant">
            <button
              type="button"
              onClick={() => onOpen(t)}
              className="relative block h-64 sm:h-60 w-full overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              style={{ background: t.colors.light === t.colors.ink ? t.colors.surface : t.colors.light }}
              aria-label={`Preview and customize ${t.name}`}
            >
              <span className="absolute left-3 top-3 z-20 rounded-full bg-background/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-foreground shadow">
                {STYLE_OF[t.id]}
              </span>
              <div data-testid="theme-demo-card" data-theme-id={t.id} className="absolute inset-x-4 top-9 bottom-4 flex items-center overflow-hidden rounded-xl shadow-xl ring-1 ring-border transition-transform duration-500 group-hover:-translate-y-1" style={{ background: t.heroGradient }}>
                <LazyOnVisible minHeight={260} fallback={<div aria-hidden className="h-full w-full animate-pulse" style={{ background: t.colors.surface }} />}>
                  <div className="pointer-events-none w-full">
                    <ThemeDemo theme={t} compact />
                  </div>
                </LazyOnVisible>
              </div>
            </button>
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-lg font-semibold text-foreground line-clamp-1">{t.name}</h3>
                <span className="shrink-0 text-[10px] uppercase tracking-widest text-gold">{t.archetype ? ARCHETYPE_LABELS[t.archetype] : ""}</span>
              </div>
              <p className="mt-1 min-h-[2.5rem] line-clamp-2 font-body text-sm text-muted-foreground">{t.description}</p>
              <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
                <button type="button" onClick={() => onPreview(t)} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-border/60 bg-background px-3 py-2 font-body text-xs text-foreground hover:bg-muted/40">
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                <button type="button" onClick={() => onStart(t)} disabled={starting} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md bg-gold px-3 py-2 font-body text-xs font-semibold text-primary hover:bg-gold/90 disabled:opacity-60">
                  <Wand2 className="h-3.5 w-3.5" /> {starting ? "Starting…" : "Use design"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
