import { motion } from "framer-motion";
import { Crown, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BuyLuxeButton from "@/components/BuyLuxeButton";
import { usePricingRegion } from "@/hooks/use-pricing-region";

const luxePoints = [
  "Four LUXE designs with an opening reveal",
  "Pull a rope and light the courtyard lamps",
  "Ring the temple bell before the card appears",
  "Break a wax seal, or part the velvet curtain",
  "Works on phones, keyboards and screen readers",
  "Try every opening free before you buy",
  "One-time unlock — yours for life, on every card",
];

/** LUXE tier: a one-time unlock for invitation cards that open with a reveal. */
const LuxeAddOnCard = () => {
  const { pricing } = usePricingRegion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mt-8 rounded-2xl p-8 border border-gold/50 bg-card shadow-gold relative overflow-hidden"
    >
      <div className="absolute top-4 right-4 bg-gold text-accent-foreground text-xs font-body font-bold px-3 py-1 rounded-full">
        New
      </div>
      <div className="flex items-center gap-2">
        <Crown className="w-5 h-5 text-gold" />
        <h3 className="font-display text-2xl font-bold text-foreground">LUXE invitation cards</h3>
      </div>
      <p className="text-muted-foreground font-body text-sm mt-2 max-w-xl">
        Our top-of-range cards don't just open — they perform. Your guest makes one small gesture and
        the invitation is revealed. A separate one-time unlock, on top of any plan.
      </p>

      <div className="mt-6 mb-2 flex items-baseline gap-2">
        <span className="font-display text-5xl font-bold text-foreground">{pricing.luxeLabel}</span>
        <span className="text-muted-foreground font-body text-sm">one-time</span>
      </div>
      <p className="text-xs text-muted-foreground font-body mb-6">
        No renewal, no subscription — unlock once and use LUXE on every card you make.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <BuyLuxeButton size="lg" className="flex-1" label={`Unlock LUXE · ${pricing.luxeLabel}`} />
        <Button variant="outline" size="lg" className="flex-1" asChild>
          <Link to="/card-gallery">See the LUXE designs</Link>
        </Button>
      </div>

      <ul className="grid sm:grid-cols-2 gap-3">
        {luxePoints.map((p) => (
          <li key={p} className="flex items-start gap-3 text-sm font-body">
            <Check className="w-4 h-4 text-gold mt-0.5 shrink-0" />
            <span className="text-foreground">{p}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export default LuxeAddOnCard;
