import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import PremiumUpgradeButton from "@/components/PremiumUpgradeButton";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import RegionSelector from "@/components/RegionSelector";
import { usePricingRegion, formatPrice } from "@/hooks/use-pricing-region";


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
  "Password-protected sites",
  "No watermarks, ad-free",
  "Mobile-responsive site",
  "Analytics & insights",
  "Social media sharing",
  "Priority support",
];

const Pricing = () => {
  const { pricing } = usePricingRegion();

  return (
    <>
      <SEOHead
        title="Pricing – Vowz Wedding Invitation Maker | Free & Paid Plans"
        description={`Choose from Free and Premium (${formatPrice(pricing, "premium")}/6 months) plans. Create digital invites, wedding websites, RSVP, gallery and more.`}
        ogTitle="Vowz Pricing – Affordable Wedding Invites & Websites"
        ogDescription={`Free plan available. Premium ${formatPrice(pricing, "premium")}/6 months. Unlimited invites, premium themes, no watermarks & more.`}
        ogImage="https://vowz.me/og-pricing.jpg"
        ogUrl="https://vowz.me/pricing"
        ogType="website"
        twitterCard="summary_large_image"
        twitterTitle="Vowz Pricing – Affordable Wedding Invites & Websites"
        twitterDescription={`Free plan available. Premium ${formatPrice(pricing, "premium")}/6 months. Unlimited invites, premium themes, no watermarks & more.`}
        twitterImage="https://vowz.me/og-pricing.jpg"
        canonical="https://vowz.me/pricing"
        robots="index, follow"
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="py-16 sm:py-24 px-4 bg-gradient-warm">
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-accent font-semibold font-body tracking-wider uppercase text-sm mb-3">
                Simple Pricing
              </p>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                Start Free, <span className="text-gradient-gold italic">Upgrade Anytime</span>
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto font-body mb-6">
                All features included in every plan. Free trial gives you 7 days of full access — upgrade to keep your site live for 6 months. Renew every 6 months to keep it live.
              </p>
              <RegionSelector showNote />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Free Trial */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="rounded-2xl p-8 border border-border/50 shadow-card bg-card"
              >
                <h2 className="font-display text-2xl font-bold text-foreground">Free Trial</h2>
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
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="rounded-2xl p-8 border border-gold/40 shadow-gold bg-card relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 bg-gold text-accent-foreground text-xs font-body font-bold px-3 py-1 rounded-full">
                  Best Value
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">Premium</h2>
                <p className="text-muted-foreground font-body text-sm mt-1">6 months — renew to keep live</p>
                <div className="mt-6 mb-2 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-bold text-foreground">{formatPrice(pricing, "premium")}</span>
                  <span className="font-display text-xl text-muted-foreground line-through">{formatPrice(pricing, "original")}</span>
                  <span className="text-muted-foreground font-body text-sm">/6 months</span>
                </div>
                <p className="text-xs text-gold font-body mb-2 font-semibold">Launch offer — save {pricing.symbol}{pricing.premiumOriginal - pricing.premiumPrice}!</p>
                <p className="text-xs text-muted-foreground font-body mb-6">
                  Need more storage? Add <strong>+2 GB for {pricing.storageAddonLabel}</strong> (6-month validity, stackable)
                </p>
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



            <motion.div
              className="text-center mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-muted-foreground font-body text-sm">
                Questions? <Link to="/contact" className="text-gold hover:underline">Contact us</Link>
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Pricing;
