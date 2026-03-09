import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Indian wedding decorations with marigold flowers and mandala patterns"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-70" />
      </div>

      {/* Floating petals animation */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full bg-gold/40"
          initial={{ y: -20, x: Math.random() * 100 + "%", opacity: 0 }}
          animate={{
            y: "110vh",
            opacity: [0, 1, 1, 0],
            rotate: 360,
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: i * 1.5,
            ease: "linear",
          }}
        />
      ))}

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px w-12 bg-gold/60" />
            <Heart className="w-5 h-5 text-gold" fill="currentColor" />
            <div className="h-px w-12 bg-gold/60" />
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground mb-4 sm:mb-6 leading-tight">
            Your Love Story,{" "}
            <span className="text-gradient-gold italic">Beautifully Told</span>
          </h1>

          <p className="font-body text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Create stunning, personalized Indian wedding websites in minutes.
            From Mehendi to Reception — celebrate every ritual with elegance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="gold" size="xl" asChild>
              <Link to="/auth">Create Your Wedding Site</Link>
            </Button>
            <Button variant="heroOutline" size="xl">
              View Templates
            </Button>
          </div>

          <p className="mt-6 text-sm text-primary-foreground/50 font-body">
            Free forever • No credit card required • 5 min setup with AI
          </p>
        </motion.div>
      </div>

      {/* Bottom mandala fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
