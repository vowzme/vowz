import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg-new.jpg";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Elegant navy and gold wedding backdrop"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-60" />
      </div>

      {/* Floating particles animation */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-gold/30"
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

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-4 sm:mb-6 leading-tight tracking-tight">
            Wedding Website &amp;{" "}
            <span className="text-gradient-gold italic">Invitation Card Maker</span>
          </h1>

          <p className="font-body text-base sm:text-lg md:text-xl text-primary-foreground/80 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2 font-light">
            Create stunning, personalized wedding websites in minutes.
            Every ceremony, every tradition — celebrated with elegance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="gold" size="xl" asChild>
              <Link to="/auth">Create Your Wedding Site</Link>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <Link to="/site/demo">View Live Demo</Link>
            </Button>
          </div>

          <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-primary-foreground/50 font-body font-light tracking-wide">
            Free forever • No credit card required • 5 min setup
          </p>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
