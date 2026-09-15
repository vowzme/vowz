import { Link } from "react-router-dom";
import { Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WEDDING_THEMES } from "@/lib/wedding-themes";
import { ThemeDemo } from "@/components/ThemeDemo";
import { LazyOnVisible } from "@/components/LazyOnVisible";
import { LUXE_TEMPLATES, CARD_THEMES, InvitationCardArtwork, REVEAL_LABELS } from "@/lib/card-templates";
import { usePricingRegion } from "@/hooks/use-pricing-region";

const LUXE_THEMES = WEDDING_THEMES.filter((t) => t.tier === "luxe").slice(0, 3);
const LUXE_CARDS = LUXE_TEMPLATES.slice(0, 3);

const SAMPLE = {
  partner1: "Aarav",
  partner2: "Meera",
  date: "12 December 2026",
  time: "6:30 PM",
  venue: "The Leela Palace, Udaipur",
  invitationLine: "Together with their families",
  message: "Request the pleasure of your company",
};

/** Home-page LUXE band: three LUXE websites + three opening-reveal cards. */
export default function LuxeHomeSection() {
  const { pricing } = usePricingRegion();

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-background via-gold/5 to-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/15 px-3 py-1 text-[11px] font-body uppercase tracking-widest text-gold">
            <Crown className="w-3.5 h-3.5" /> LUXE
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-3">
            The LUXE collection
          </h2>
          <p className="font-body text-muted-foreground mt-2 max-w-2xl mx-auto">
            Three of our richest wedding website designs and three invitation cards that open with a
            gesture — a rope pulled, a bell rung, a wax seal broken. One lifetime unlock at{" "}
            <strong className="text-foreground">
              {pricing.symbol}
              {pricing.luxePrice}
            </strong>
            , on top of your plan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {LUXE_THEMES.map((t) => (
            <Link key={t.id} to="/themes#luxe" className="group rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
              <div className="relative transition-transform group-hover:-translate-y-1">
                <span className="absolute z-10 top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-body uppercase tracking-widest text-gold">
                  <Crown className="w-3 h-3" /> Website
                </span>
                <LazyOnVisible
                  minHeight={220}
                  fallback={<div aria-hidden className="w-full rounded-xl border border-border/50 animate-pulse" style={{ height: 220, background: t.colors.surface }} />}
                >
                  <ThemeDemo theme={t} compact />
                </LazyOnVisible>
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mt-3 px-1">{t.name}</h3>
              <p className="text-sm text-muted-foreground font-body px-1 line-clamp-2">{t.description}</p>
            </Link>
          ))}

          {LUXE_CARDS.map((c) => (
            <Link key={c.slug} to="/card-gallery" className="group rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
              <div className="relative rounded-xl border border-border/50 overflow-hidden flex justify-center bg-muted/20 p-4 transition-transform group-hover:-translate-y-1">
                <span className="absolute z-10 top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-body uppercase tracking-widest text-gold">
                  <Crown className="w-3 h-3" /> {REVEAL_LABELS[c.reveal]}
                </span>
                <LazyOnVisible minHeight={220} fallback={<div aria-hidden className="animate-pulse" style={{ height: 220, width: 160, background: c.theme.panel }} />}>
                  <InvitationCardArtwork data={SAMPLE} theme={CARD_THEMES[c.slug]} width={190} qrPosition="hidden" />
                </LazyOnVisible>
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mt-3 px-1">{c.name}</h3>
              <p className="text-sm text-muted-foreground font-body px-1 line-clamp-2">{c.description}</p>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button variant="gold" size="lg" asChild>
            <Link to="/themes#luxe">
              View all LUXE templates <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
