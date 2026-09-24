import { Link } from "react-router-dom";
import { Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeDemo } from "@/components/ThemeDemo";
import { LazyOnVisible } from "@/components/LazyOnVisible";
import { LUXE_THEMES } from "@/lib/theme-luxe";
import { WEDDING_THEMES, ARCHETYPE_LABELS } from "@/lib/wedding-themes";

const FEATURED = LUXE_THEMES.filter((_, i) => i % 4 === 0).slice(0, 6);

export default function LuxeHomeSection() {
  return (
    <section id="luxe" className="bg-secondary/40 py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
            <Crown className="h-3 w-3" /> New · LUXE collection
          </span>
          <h2 className="mt-4 font-display text-3xl font-semibold text-foreground sm:text-5xl">25 LUXE wedding designs</h2>
          <p className="mt-3 font-body text-muted-foreground">
            25 layouts, each one different — gatefold doors, cinematic widescreen, letterpress, lantern glow and more — for every tradition. Part of {WEDDING_THEMES.length} designs, all included in your plan.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED.map((t) => (
            <Link key={t.id} to={`/themes?preview=${t.id}#luxe`} className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
              <div className="relative overflow-hidden rounded-xl ring-1 ring-gold/40 transition-transform group-hover:-translate-y-1">
                <span className="absolute left-2 top-2 z-20 rounded-full bg-gold px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">LUXE</span>
                <LazyOnVisible minHeight={220} fallback={<div aria-hidden className="h-[220px] w-full animate-pulse rounded-xl bg-muted" />}>
                  <ThemeDemo theme={t} compact />
                </LazyOnVisible>
              </div>
              <div className="flex items-baseline justify-between gap-2 px-1 pt-3">
                <h3 className="font-display text-lg font-semibold text-foreground">{t.name}</h3>
                <span className="text-[10px] uppercase tracking-widest text-gold">{t.archetype ? ARCHETYPE_LABELS[t.archetype] : ""}</span>
              </div>
              <p className="px-1 text-xs text-muted-foreground">{t.tradition}</p>
            </Link>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button variant="gold" size="lg" asChild>
            <Link to="/themes#luxe">See all 25 LUXE designs <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
