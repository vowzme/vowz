import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, Calendar, MapPin, Sparkles, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWeddingSite } from "@/hooks/use-wedding-site";

interface WeddingData {
  partner1: string;
  partner2: string;
  culturalBackground: string;
  howWeMet: string;
  functions: string[];
  theme: string;
  suggestedColors: string[];
  tagline: string;
}

const WizardPreview = ({ data }: { data: WeddingData }) => {
  const { createSite } = useWeddingSite();
  const savedRef = useRef(false);
  const [siteId, setSiteId] = useState<string | null>(null);

  // Auto-save the site to the database on first render
  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;

    const sections = data.functions.map((fn) => ({
      type: "event",
      title: fn,
      date: "",
      time: "",
      venue: "",
    }));

    createSite({
      partner1: data.partner1,
      partner2: data.partner2,
      culturalBackground: data.culturalBackground,
      howWeMet: data.howWeMet,
      theme: data.theme,
      tagline: data.tagline,
      suggestedColors: data.suggestedColors,
      sections,
    }).then((site) => {
      if (site) setSiteId(site.id);
    });
  }, []);
  const [bg, accent, light] = data.suggestedColors.length >= 3
    ? data.suggestedColors
    : ["#6B1D2A", "#D4A853", "#FFF5E6"];

  return (
    <div className="min-h-screen bg-background">
      {/* Success header */}
      <div className="bg-card border-b border-border/50 py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-foreground">
                Your site is ready! ✨
              </p>
              <p className="text-sm text-muted-foreground font-body">
                Here's a preview based on your answers
              </p>
            </div>
          </div>
          <Button variant="gold" size="sm" asChild>
            <Link to="/editor" state={{ wizardData: data }}>
              Customize in Editor <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Preview site */}
      <div className="max-w-4xl mx-auto mt-8 px-4 pb-16">
        <div className="rounded-2xl overflow-hidden border border-border shadow-elegant">
          {/* Hero section preview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative py-24 px-6 text-center"
            style={{ background: `linear-gradient(135deg, ${bg}, ${bg}dd)` }}
          >
            <div className="absolute inset-0 opacity-10">
              <svg viewBox="0 0 400 400" className="w-full h-full">
                {[...Array(8)].map((_, i) => (
                  <circle
                    key={i}
                    cx="200" cy="200"
                    r={50 + i * 30}
                    fill="none"
                    stroke={light}
                    strokeWidth="0.5"
                  />
                ))}
              </svg>
            </div>
            <div className="relative z-10">
              <Heart className="w-8 h-8 mx-auto mb-4" style={{ color: accent }} fill="currentColor" />
              <p className="font-body text-sm tracking-widest uppercase mb-3" style={{ color: `${light}99` }}>
                You're Invited to the Wedding of
              </p>
              <h1 className="font-display text-5xl md:text-6xl font-bold mb-3" style={{ color: light }}>
                {data.partner1} & {data.partner2}
              </h1>
              <p className="font-display text-xl italic" style={{ color: `${accent}` }}>
                {data.tagline}
              </p>
            </div>
          </motion.div>

          {/* Story section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card px-8 py-12"
          >
            <h2 className="font-display text-2xl font-bold text-foreground text-center mb-2">
              Our Story
            </h2>
            <div className="w-12 h-0.5 mx-auto mb-6" style={{ backgroundColor: accent }} />
            <p className="text-muted-foreground font-body text-center max-w-xl mx-auto leading-relaxed">
              {data.howWeMet}
            </p>
          </motion.div>

          {/* Events section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-background px-8 py-12"
          >
            <h2 className="font-display text-2xl font-bold text-foreground text-center mb-2">
              Wedding Events
            </h2>
            <div className="w-12 h-0.5 mx-auto mb-8" style={{ backgroundColor: accent }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {data.functions.map((func, i) => (
                <motion.div
                  key={func}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="border border-border/50 rounded-xl p-4 text-center bg-card hover:shadow-card transition-shadow"
                >
                  <div
                    className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center"
                    style={{ backgroundColor: `${accent}20` }}
                  >
                    <Calendar className="w-5 h-5" style={{ color: accent }} />
                  </div>
                  <p className="font-display text-base font-semibold text-foreground">{func}</p>
                  <p className="text-xs text-muted-foreground font-body mt-1">Date & time TBD</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer info */}
          <div className="bg-card px-8 py-8 text-center border-t border-border/50">
            <p className="text-sm text-muted-foreground font-body">
              <span className="font-semibold text-foreground">{data.culturalBackground}</span> celebration •{" "}
              <span className="capitalize">{data.theme}</span> theme
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground font-body">Theme colors:</span>
              {data.suggestedColors.map((c, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border border-border/50"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button variant="gold" size="lg" asChild>
            <Link to="/editor" state={{ wizardData: data }}>
              <Sparkles className="w-4 h-4 mr-2" />
              Customize & Publish
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WizardPreview;
