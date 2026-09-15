import { Crown, Eye, Lock, Wand2 } from "lucide-react";
import { WEDDING_THEMES, type WeddingTheme } from "@/lib/wedding-themes";
import { ThemeDemo } from "@/components/ThemeDemo";
import { LazyOnVisible } from "@/components/LazyOnVisible";
import BuyLuxeButton from "@/components/BuyLuxeButton";

export const LUXE_THEMES = WEDDING_THEMES.filter((t) => t.tier === "luxe");

interface Props {
  hasLuxe: boolean;
  onPreview: (t: WeddingTheme) => void;
  onUse: (t: WeddingTheme) => void;
  onUnlocked?: () => void;
  busy?: boolean;
}

/**
 * Gold-badged LUXE band shown above the standard theme categories.
 * Previewing is open to everyone; applying a design needs the one-time unlock.
 */
export default function LuxeCollectionSection({ hasLuxe, onPreview, onUse, onUnlocked, busy }: Props) {
  if (LUXE_THEMES.length === 0) return null;

  return (
    <section id="luxe" className="mb-14 scroll-mt-20">
      <div className="rounded-3xl border-2 border-gold/40 bg-gradient-to-b from-gold/10 via-background to-background p-5 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/15 px-3 py-1 text-[11px] font-body uppercase tracking-widest text-gold">
              <Crown className="w-3.5 h-3.5" /> LUXE Collection
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-3">
              Our most elaborate wedding designs
            </h2>
            <p className="font-body text-sm text-muted-foreground mt-1 max-w-xl">
              Deeper palettes, hand-detailed motifs and richer layouts — plus the opening-reveal
              invitation cards. Preview any of them free; one lifetime unlock opens them all.
            </p>
          </div>
          {!hasLuxe && <BuyLuxeButton label="Unlock LUXE" onPurchased={onUnlocked} />}
          {hasLuxe && (
            <span className="inline-flex items-center gap-1.5 text-sm font-body text-gold">
              <Crown className="w-4 h-4" /> Unlocked on your account
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {LUXE_THEMES.map((t) => (
            <div key={t.id} className="group text-left rounded-2xl">
              <button
                type="button"
                onClick={() => onPreview(t)}
                className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-2xl"
                aria-label={`Preview ${t.name}`}
              >
                <div className="relative transition-transform group-hover:-translate-y-1">
                  <span className="absolute z-10 top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-body uppercase tracking-widest text-gold">
                    <Crown className="w-3 h-3" /> Luxe
                  </span>
                  <LazyOnVisible
                    minHeight={220}
                    fallback={
                      <div
                        aria-hidden
                        className="w-full rounded-xl border border-border/50 animate-pulse"
                        style={{ height: 220, background: t.colors.surface }}
                      />
                    }
                  >
                    <ThemeDemo theme={t} compact />
                  </LazyOnVisible>
                </div>
                <div className="px-1 pt-4">
                  <h3 className="font-display text-lg font-semibold text-foreground">{t.name}</h3>
                  <p className="text-sm text-muted-foreground font-body mt-1 line-clamp-2">{t.description}</p>
                </div>
              </button>
              <div className="px-1 mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onPreview(t)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border/60 bg-background hover:bg-muted/40 px-3 py-2 text-xs font-body"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  type="button"
                  onClick={() => onUse(t)}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 hover:bg-gold/20 text-gold px-3 py-2 text-xs font-body disabled:opacity-60"
                >
                  {hasLuxe ? <Wand2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {hasLuxe ? "Use this design" : "Unlock to use"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
