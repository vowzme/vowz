import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "AI Wedding Wizard",
      "5 beautiful templates",
      "50 photo uploads (100MB)",
      "RSVP form with notifications",
      "QR code invites",
      "Mobile-responsive site",
      "Basic analytics",
      "Subdomain (you.vowz.me)",
    ],
    cta: "Get Started Free",
    featured: false,
  },
  {
    name: "Premium",
    price: "₹499",
    period: "/month",
    altPrice: "or ₹4,999 one-time",
    description: "Everything for your perfect day",
    features: [
      "Everything in Free, plus:",
      "Custom domain (yournames.com)",
      "20+ premium templates",
      "5GB storage for photos & videos",
      "Video embeds",
      "Password-protected sites",
      "Multilingual auto-translation",
      "AI story writer & invite wording",
      "Countdown timer & guestbook",
      "No watermarks, ad-free",
      "Priority support",
    ],
    cta: "Upgrade to Premium",
    featured: true,
  },
];

const PricingSection = () => {
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
          <p className="text-muted-foreground max-w-xl mx-auto font-body">
            No hidden fees. Your wedding site is free forever — premium unlocks the magic.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
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
              <h3 className="font-display text-2xl font-bold text-foreground">{plan.name}</h3>
              <p className="text-muted-foreground font-body text-sm mt-1">{plan.description}</p>
              <div className="mt-6 mb-2">
                <span className="font-display text-5xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground font-body text-sm ml-1">{plan.period}</span>
              </div>
              {plan.altPrice && (
                <p className="text-xs text-muted-foreground font-body mb-6">{plan.altPrice}</p>
              )}
              {!plan.altPrice && <div className="mb-6" />}

              <Button
                variant={plan.featured ? "gold" : "outline"}
                size="lg"
                className="w-full mb-8"
                asChild
              >
                <Link to="/auth">{plan.cta}</Link>
              </Button>

              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm font-body">
                    <Check className="w-4 h-4 text-emerald mt-0.5 shrink-0" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
