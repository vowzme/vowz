import { Crown, Eye, Wand2 } from "lucide-react";
import { ThemeDemo } from "@/components/ThemeDemo";
import { LazyOnVisible } from "@/components/LazyOnVisible";
import { LUXE_THEMES } from "@/lib/theme-luxe";
import { ARCHETYPE_LABELS, type WeddingTheme } from "@/lib/wedding-themes";

/** LUXE signature collection band — shown first on /themes. */
export function LuxeBand({
  onOpen,
  onPreview,
  onStart,
  starting,
}: {
  onOpen: (t: WeddingTheme) => void;
  onPreview: (t: WeddingTheme) => void;
  onStart: (t: WeddingTheme) => void;
  starting?: boolean;
}) {
  return (
    <section id="luxe" className="mb-16 scroll-mt-24 rounded-3xl border border-gold/30 bg-gradient-to-b from-gold/10 to-transparent p-4 sm:p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
            <Crown className="h-3 w-3" /> LUXE collection
          </span>
          <h2 className="mt-3 font-display text-2xl font-semibold text-foreground sm:text-4xl">25 signature LUXE designs</h2>
          <p className="mt-1 max-w-2xl font-body text-sm text-muted-foreground">
            Every LUXE design has its own layout, palette and typography — across Hindu, South Indian, Bengali, Sikh, Marwari, Muslim, Christian, modern, beach, Kerala and boho weddings. Included in your current plan.
          </p>
        </div>
        <span className="font-body text-xs text-muted-foreground">{LUXE_THEMES.length} designs · 25 layouts</span>
      </header>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {LUXE_THEMES.map((t) => (
          <div key={t.id} className="group rounded-2xl">
            <button
              type="button"
              onClick={() => onOpen(t)}
              className="relative block w-full rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              aria-label={`Preview and customize ${t.name}`}
            >
              <span className="absolute left-2 top-2 z-20 inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary shadow">
                <Crown className="h-2.5 w-2.5" /> LUXE
              </span>
              <div data-testid="theme-demo-card" data-theme-id={t.id} className="overflow-hidden rounded-xl ring-1 ring-gold/40 transition-transform group-hover:-translate-y-1">
                <LazyOnVisible minHeight={220} fallback={<div aria-hidden className="w-full animate-pulse rounded-xl" style={{ height: 220, background: t.colors.surface }} />}>
                  <ThemeDemo theme={t} compact />
                </LazyOnVisible>
              </div>
              <div className="px-1 pt-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-foreground">{t.name}</h3>
                  <span className="text-[10px] uppercase tracking-widest text-gold">{t.archetype ? ARCHETYPE_LABELS[t.archetype] : ""}</span>
                </div>
                <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">{t.tradition}</p>
                <p className="mt-1 line-clamp-2 font-body text-sm text-muted-foreground">{t.description}</p>
              </div>
            </button>
            <div className="mt-3 grid grid-cols-2 gap-2 px-1">
              <button type="button" onClick={() => onPreview(t)} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-border/60 bg-background px-3 py-2 font-body text-xs text-foreground hover:bg-muted/40">
                <Eye className="h-3.5 w-3.5" /> Preview
              </button>
              <button type="button" onClick={() => onStart(t)} disabled={starting} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-3 py-2 font-body text-xs text-gold hover:bg-gold/20 disabled:opacity-60">
                <Wand2 className="h-3.5 w-3.5" /> {starting ? "Starting…" : "Use design"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
