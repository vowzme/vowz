import { Crown, Eye, Wand2 } from "lucide-react";
import { ThemeDemo } from "@/components/ThemeDemo";
import { LazyOnVisible } from "@/components/LazyOnVisible";
import { LUXE_THEMES } from "@/lib/theme-luxe";
import { ARCHETYPE_LABELS, type WeddingTheme } from "@/lib/wedding-themes";
import hindu from "@/assets/showcase/couple-hindu.jpg";
import beach from "@/assets/showcase/couple-beach.jpg";
import christian from "@/assets/showcase/couple-christian.jpg";
import modern from "@/assets/showcase/couple-modern.jpg";
import muslim from "@/assets/showcase/couple-muslim.jpg";
import garden from "@/assets/showcase/venue-garden.jpg";

const FAMILY_PHOTO: Record<string, string> = {
  "royal-rajput": hindu, "south-indian-temple": hindu, "bengali-alpona": hindu,
  "punjabi-anand-karaj": hindu, "marwari-haveli": hindu,
  "nikah-emerald": muslim, "walima-rose": muslim,
  "christian-chapel": christian, "modern-minimal": modern,
  "goa-beach": beach, "kerala-backwaters": beach, "boho-destination": garden,
};

/** LUXE designs — shown first on /themes as equal-size tiles, same style as the other categories. */
export function LuxeBand({
  onOpen, onPreview, onStart, starting,
}: {
  onOpen: (t: WeddingTheme) => void;
  onPreview: (t: WeddingTheme) => void;
  onStart: (t: WeddingTheme) => void;
  starting?: boolean;
}) {
  return (
    <section id="luxe" className="mb-14 scroll-mt-24">
      <header className="mb-5">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">LUXE designs</h2>
        <p className="text-sm text-muted-foreground font-body mt-1 max-w-xl">
          {LUXE_THEMES.length} signature looks, each with its own layout — included in your current plan.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {LUXE_THEMES.map((t) => {
          const photo = FAMILY_PHOTO[t.family ?? ""] ?? garden;
          return (
            <div key={t.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gold/20 bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-elegant">
              <button
                type="button"
                onClick={() => onOpen(t)}
                className="relative block h-64 sm:h-60 w-full overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                aria-label={`Preview and customize ${t.name}`}
              >
                <img src={photo} alt="" loading="lazy" className="absolute inset-0 h-full w-full scale-110 object-cover blur-[2px] transition-transform duration-700 group-hover:scale-125" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${t.colors.bg}cc 0%, ${t.colors.bg}66 45%, ${t.colors.bg}ee 100%)` }} />
                <span className="absolute left-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-primary shadow">
                  <Crown className="h-2.5 w-2.5" /> LUXE
                </span>
                <div data-testid="theme-demo-card" data-theme-id={t.id} className="absolute inset-x-4 top-9 bottom-4 flex items-center overflow-hidden rounded-xl shadow-2xl ring-1 ring-gold/50 transition-transform duration-500 group-hover:-translate-y-1" style={{ background: t.heroGradient }}>
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
                <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground line-clamp-1">{t.tradition}</p>
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
          );
        })}
      </div>
    </section>
  );
}
