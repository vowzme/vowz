import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { WEDDING_THEMES, type WeddingTheme } from "@/lib/wedding-themes";
import { ThemeDemo } from "@/components/ThemeDemo";
import { useAuth } from "@/hooks/use-auth";
import { useWeddingSite } from "@/hooks/use-wedding-site";

// Preload Google Fonts used by every theme so previews render with the right typography.
function GoogleFontsLoader() {
  const families = useMemo(() => {
    const all = new Set<string>();
    for (const t of WEDDING_THEMES) {
      all.add(t.fonts.display);
      all.add(t.fonts.body);
    }
    return Array.from(all);
  }, []);
  const href = `https://fonts.googleapis.com/css2?${families
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join("&")}&display=swap`;
  return (
    <Helmet>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={href} />
    </Helmet>
  );
}

export default function Themes() {
  const [active, setActive] = useState<WeddingTheme | null>(null);
  const [applying, setApplying] = useState(false);
  const { user } = useAuth();
  const { loadUserSite, updateSite } = useWeddingSite();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [active]);

  const applyTheme = async (t: WeddingTheme) => {
    if (!user) {
      navigate("/auth", { state: { returnTo: "/themes" } });
      return;
    }
    setApplying(true);
    try {
      const site = await loadUserSite();
      if (!site) {
        toast({
          title: "Create your site first",
          description: "Finish the wizard to create a site, then apply this theme.",
        });
        navigate("/wizard");
        return;
      }
      const ok = await updateSite(site.id, {
        theme: t.id,
        suggested_colors: [t.colors.bg, t.colors.accent, t.colors.light],
      });
      if (ok) {
        toast({ title: "Theme applied", description: `${t.name} is now your site's theme.` });
        navigate(`/editor/${site.id}`);
      }
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <GoogleFontsLoader />
      <Helmet>
        <title>10 Wedding Website Themes · Vowz</title>
        <meta
          name="description"
          content="Explore 10 curated wedding website themes — Royal Rajput, South Indian Temple, Bengali Alpona, Goa Beach, Kerala Backwaters and more. Preview live and apply to your site in one click."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border/40 bg-gradient-to-b from-cream/40 to-transparent">
          <div className="max-w-6xl mx-auto px-4 py-14 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs font-body tracking-wide mb-4">
              <Sparkles className="w-3.5 h-3.5" /> 10 curated collections
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-3">
              Themes for every love story
            </h1>
            <p className="font-body text-muted-foreground max-w-2xl mx-auto">
              From Rajput palaces to Kerala backwaters and coastal Goa — pick a style, preview it live, then apply it to your site in one click.
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WEDDING_THEMES.map((t, i) => (
              <motion.button
                key={t.id}
                type="button"
                onClick={() => setActive(t)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-2xl"
              >
                <div className="transition-transform group-hover:-translate-y-1">
                  <ThemeDemo theme={t} compact />
                </div>
                <div className="px-1 pt-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-lg font-semibold text-foreground">{t.name}</h3>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.tradition}</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-body mt-1 line-clamp-2">{t.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    {[t.colors.bg, t.colors.accent, t.colors.surface, t.colors.ink].map((c) => (
                      <span key={c} className="w-4 h-4 rounded-full border border-border/60" style={{ background: c }} />
                    ))}
                    <span className="ml-auto text-xs text-gold font-body inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Preview <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="text-center mt-16">
            <p className="text-sm text-muted-foreground font-body mb-4">Not sure which one? Start with our onboarding wizard.</p>
            <Button variant="gold" size="lg" asChild>
              <Link to="/wizard">
                <Sparkles className="w-4 h-4 mr-2" /> Build my site
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Full preview modal */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background border-border">
          {active && (
            <div className="max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border/50 px-5 py-3 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold">{active.name}</h2>
                  <p className="text-xs text-muted-foreground">{active.tradition} · {active.tagline}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="gold" size="sm" onClick={() => applyTheme(active)} disabled={applying}>
                    <Check className="w-4 h-4 mr-1" /> {applying ? "Applying…" : "Apply to my site"}
                  </Button>
                  <button onClick={() => setActive(null)} aria-label="Close" className="p-2 rounded-md hover:bg-muted">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <ThemeDemo theme={active} />
                <p className="text-sm text-muted-foreground font-body mt-5 leading-relaxed">{active.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
