import { Link, useNavigate } from "react-router-dom";
import { Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeDemo } from "@/components/ThemeDemo";
import { LazyOnVisible } from "@/components/LazyOnVisible";
import { LUXE_THEMES } from "@/lib/theme-luxe";
import { WEDDING_THEMES, ARCHETYPE_LABELS } from "@/lib/wedding-themes";

const FEATURED = LUXE_THEMES.filter((_, i) => i % 4 === 0).slice(0, 6);

function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function LuxeHomeSection() {
  const navigate = useNavigate();
  const preview = (id: string) => navigate(`/themes?preview=${id}#luxe`);
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
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED.map((t) => (
            <div
              key={t.id}
              role="button"
              tabIndex={0}
              onClick={() => preview(t.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); preview(t.id); } }}
              aria-label={`Preview the ${t.name} LUXE design`}
              className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-gold/20 bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-elegant focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <div className="relative h-64 shrink-0 overflow-hidden sm:h-60" style={{ background: t.heroGradient }}>
                <span className="absolute left-2 top-2 z-20 rounded-full bg-gold px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-primary">LUXE</span>
                <div className="pointer-events-none absolute inset-0 flex items-center">
                  <LazyOnVisible minHeight={240} fallback={<div aria-hidden className="h-full w-full animate-pulse bg-muted" />}>
                    <div className="w-full"><ThemeDemo theme={t} compact /></div>
                  </LazyOnVisible>
                </div>
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/40">
                  <span className="flex translate-y-2 items-center gap-2 rounded-full border border-background/30 bg-background/20 px-5 py-2.5 font-body text-sm font-medium text-background opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <EyeIcon className="h-4 w-4" /> Preview Template
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col space-y-3 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="line-clamp-1 font-display text-lg font-semibold text-foreground">{t.name}</h3>
                  <span className="shrink-0 text-[10px] uppercase tracking-widest text-gold">{t.archetype ? ARCHETYPE_LABELS[t.archetype] : ""}</span>
                </div>
                <p className="line-clamp-1 font-body text-xs text-muted-foreground">{t.tradition}</p>
                <div className="mt-auto flex gap-2">
                  <Button variant="outline" size="sm" className="h-11 flex-1 font-body sm:h-9"
                    onClick={(e) => { e.stopPropagation(); preview(t.id); }}>
                    <EyeIcon className="mr-1.5 h-4 w-4" /> Preview
                  </Button>
                  <Button size="sm" className="h-11 flex-1 font-body sm:h-9"
                    onClick={(e) => { e.stopPropagation(); preview(t.id); }}>
                    Use Template
                  </Button>
                </div>
              </div>
            </div>
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
