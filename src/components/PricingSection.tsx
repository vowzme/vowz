import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import PremiumUpgradeButton from "@/components/PremiumUpgradeButton";
import { Link } from "react-router-dom";
import { usePricingRegion, formatPrice } from "@/hooks/use-pricing-region";
import RegionSelector from "@/components/RegionSelector";

const allFeatures = [
  "Easy Wedding Wizard",
  "35+ beautiful templates",
  "RSVP form with notifications",
  "QR code invites",
  "Countdown timer & guestbook",
  "Budget & expense tracker",
  "Wedding checklist & reminders",
  "Guest polls",
  "Couple profiles (Bride & Groom bios)",
  "Our Story with AI generator",
  "Photo gallery with uploads",
  "Video embeds",
  "AI editor assistant",
  "Multilingual auto-translation",
  "Custom domain support",
  "Password-protected sites",
  "No watermarks, ad-free",
  "Mobile-responsive site",
  "Analytics & insights",
  "Social media sharing",
  "Priority support",
];

const PricingSection = () => {
  const { pricing } = usePricingRegion();

  return (
    <section className="py-16 sm:py-24 px-4 bg-gradient-warm" id="pricing">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-accent font-semibold font-body tracking-wider uppercase text-sm mb-3">
            Simple Pricing
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Start Free, <span className="text-gradient-gold italic">Upgrade Anytime</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-body mb-6">
            All features included in every plan. Free trial gives you 7 days of full access — upgrade to keep your site live forever.
          </p>
          <RegionSelector showNote />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Trial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl p-8 border border-border/50 shadow-card bg-card"
          >
            <h3 className="font-display text-2xl font-bold text-foreground">Free Trial</h3>
            <p className="text-muted-foreground font-body text-sm mt-1">Full access for 7 days</p>
            <div className="mt-6 mb-2 flex items-baseline gap-2">
              <span className="font-display text-5xl font-bold text-foreground">{pricing.freePrice}</span>
              <span className="text-muted-foreground font-body text-sm">/7 days</span>
            </div>
            <p className="text-xs text-muted-foreground font-body mb-6">All features included — no credit card needed</p>
            <Button variant="outline" size="lg" className="w-full mb-8" asChild>
              <Link to="/auth">Start Free Trial</Link>
            </Button>
            <ul className="space-y-3">
              {allFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm font-body">
                  <Check className="w-4 h-4 text-emerald mt-0.5 shrink-0" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl p-8 border border-gold/40 shadow-gold bg-card relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 bg-gold text-accent-foreground text-xs font-body font-bold px-3 py-1 rounded-full">
              Best Value
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground">Premium</h3>
            <p className="text-muted-foreground font-body text-sm mt-1">Keep your site live forever</p>
            <div className="mt-6 mb-2 flex items-baseline gap-2">
              <span className="font-display text-5xl font-bold text-foreground">{formatPrice(pricing, "premium")}</span>
              <span className="font-display text-xl text-muted-foreground line-through">{formatPrice(pricing, "original")}</span>
              <span className="text-muted-foreground font-body text-sm">/year</span>
            </div>
            <p className="text-xs text-gold font-body mb-6 font-semibold">Launch offer — save {pricing.symbol}{pricing.premiumOriginal - pricing.premiumPrice}!</p>
            <PremiumUpgradeButton
              variant="gold"
              size="lg"
              className="w-full mb-8"
              label="Upgrade to Premium"
            />
            <ul className="space-y-3">
              {allFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm font-body">
                  <Check className="w-4 h-4 text-emerald mt-0.5 shrink-0" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
