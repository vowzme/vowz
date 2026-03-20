import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import PremiumUpgradeButton from "@/components/PremiumUpgradeButton";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import RegionSelector from "@/components/RegionSelector";
import { usePricingRegion, formatPrice } from "@/hooks/use-pricing-region";

const freeFeatures = [
  { text: "Easy Wedding Wizard", coming: false },
  { text: "25 beautiful templates", coming: false },
  { text: "50 photo uploads (100MB)", coming: false },
  { text: "RSVP form with notifications", coming: false },
  { text: "QR code invites", coming: false },
  { text: "Countdown timer & guestbook", coming: false },
  { text: "Budget & expense tracker", coming: false },
  { text: "Wedding checklist", coming: false },
  { text: "Guest polls", coming: false },
  { text: "Mobile-responsive site", coming: false },
  { text: "Basic analytics", coming: false },
  { text: "Subdomain (you.vowz.me)", coming: false },
];

const premiumFeatures = [
  { text: "Everything in Free, plus:", coming: false },
  { text: "Custom domain (yournames.com)", coming: false },
  { text: "AI editor assistant (themes, content & advice)", coming: false },
  { text: "5GB storage for photos & videos", coming: false },
  { text: "Video embeds", coming: false },
  { text: "Password-protected sites", coming: false },
  { text: "Multilingual auto-translation", coming: false },
  { text: "No watermarks, ad-free", coming: false },
  { text: "Priority support", coming: false },
];

const Pricing = () => {
  const { pricing } = usePricingRegion();

  const plans = [
    {
      name: "Free",
      price: pricing.freePrice,
      period: "/7 days",
      description: "Perfect for getting started",
      features: freeFeatures,
      cta: "Get Started Free",
      featured: false,
    },
    {
      name: "Premium",
      price: formatPrice(pricing, "premium"),
      originalPrice: formatPrice(pricing, "original"),
      period: "/year",
      description: "Everything for your perfect day",
      features: premiumFeatures,
      cta: "Upgrade to Premium",
      featured: true,
    },
  ];

  return (
    <>
      <SEOHead
        title="Pricing – Vowz Wedding Invitation Maker | Free & Paid Plans"
        description={`Choose from Free and Premium (${formatPrice(pricing, "premium")}/year) plans. Create digital invites, wedding websites, custom domains and more.`}
        ogTitle="Vowz Pricing – Affordable Wedding Invites & Websites"
        ogDescription={`Free plan available. Premium ${formatPrice(pricing, "premium")}/year (40% off). Unlimited invites, premium themes, no watermarks, custom domains.`}
        ogImage="https://vowz.me/og-pricing.jpg"
        ogUrl="https://vowz.me/pricing"
        ogType="website"
        twitterCard="summary_large_image"
        twitterTitle="Vowz Pricing – Affordable Wedding Invites & Websites"
        twitterDescription={`Free plan available. Premium ${formatPrice(pricing, "premium")}/year (40% off). Unlimited invites, premium themes, no watermarks, custom domains.`}
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
                No hidden fees. Your wedding site is free forever — premium unlocks the magic.
              </p>
              <RegionSelector showNote />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {plans.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className={`rounded-2xl p-8 border ${
                    plan.featured
                      ? "border-gold/40 shadow-gold bg-card relative overflow-hidden"
                      : "border-border/50 shadow-card bg-card"
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute top-4 right-4 bg-gold text-accent-foreground text-xs font-body font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  <h2 className="font-display text-2xl font-bold text-foreground">{plan.name}</h2>
                  <p className="text-muted-foreground font-body text-sm mt-1">{plan.description}</p>
                  <div className="mt-6 mb-2 flex items-baseline gap-2">
                    <span className="font-display text-5xl font-bold text-foreground">{plan.price}</span>
                    {plan.originalPrice && (
                      <span className="font-display text-xl text-muted-foreground line-through">{plan.originalPrice}</span>
                    )}
                    <span className="text-muted-foreground font-body text-sm">{plan.period}</span>
                  </div>
                  {plan.featured && (
                    <p className="text-xs text-gold font-body mb-6 font-semibold">Launch offer — save {pricing.symbol}{pricing.premiumOriginal - pricing.premiumPrice}!</p>
                  )}
                  {!plan.featured && <div className="mb-6" />}

                  {plan.featured ? (
                    <PremiumUpgradeButton
                      variant="gold"
                      size="lg"
                      className="w-full mb-8"
                      label={plan.cta}
                    />
                  ) : (
                    <Button variant="outline" size="lg" className="w-full mb-8" asChild>
                      <Link to="/auth">{plan.cta}</Link>
                    </Button>
                  )}

                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-3 text-sm font-body">
                        {f.coming ? (
                          <Clock className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                        ) : (
                          <Check className="w-4 h-4 text-emerald mt-0.5 shrink-0" />
                        )}
                        <span className={f.coming ? "text-muted-foreground" : "text-foreground"}>
                          {f.text}
                          {f.coming && <span className="ml-1.5 text-[10px] bg-gold/15 text-gold px-1.5 py-0.5 rounded-full font-semibold">Coming Soon</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
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
