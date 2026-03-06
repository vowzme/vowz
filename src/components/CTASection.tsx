import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Heart className="w-8 h-8 text-gold mx-auto mb-6" fill="currentColor" />
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            Your Wedding Deserves a{" "}
            <span className="text-gradient-gold italic">Beautiful Beginning</span>
          </h2>
          <p className="text-muted-foreground font-body text-lg mb-10 max-w-xl mx-auto">
            Join thousands of couples creating unforgettable wedding experiences.
            Start with AI — publish in minutes.
          </p>
          <Button variant="gold" size="xl">
            Create Your Free Wedding Site
          </Button>
          <p className="mt-4 text-xs text-muted-foreground font-body">
            Trusted by 10,000+ Indian couples worldwide
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
