import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight, X, RotateCcw, Wand2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { WEDDING_THEMES, type WeddingTheme } from "@/lib/wedding-themes";
import { ThemeDemo } from "@/components/ThemeDemo";
import { useAuth } from "@/hooks/use-auth";
import { useWeddingSite } from "@/hooks/use-wedding-site";
import { buildThemeSections, buildThemeTemplate } from "@/lib/theme-templates";
import { THEME_CATEGORIES } from "@/lib/theme-demo-sites";

const FONT_POOL = [
  "Playfair Display",
  "Cormorant Garamond",
  "Cormorant",
  "Fraunces",
  "Cinzel",
  "Yeseva One",
  "Lora",
  "Merriweather",
  "Inter",
  "Poppins",
  "DM Sans",
  "Nunito",
];

// Preload every Google Font that could appear across all themes + font pool.
function GoogleFontsLoader() {
  const href = useMemo(() => {
    const all = new Set<string>(FONT_POOL);
    for (const t of WEDDING_THEMES) {
      all.add(t.fonts.display);
      all.add(t.fonts.body);
    }
    return `https://fonts.googleapis.com/css2?${Array.from(all)
      .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
      .join("&")}&display=swap`;
  }, []);
  return (
    <Helmet>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={href} />
    </Helmet>
  );
}

type Custom = {
  bg: string;
  accent: string;
  surface: string;
  ink: string;
  displayFont: string;
  bodyFont: string;
  motifIntensity: number; // 0..1
};

function customFrom(t: WeddingTheme): Custom {
  return {
    bg: t.colors.bg,
    accent: t.colors.accent,
    surface: t.colors.surface,
    ink: t.colors.ink,
    displayFont: t.fonts.display,
    bodyFont: t.fonts.body,
    motifIntensity: 0.18,
  };
}

// Rebuild a WeddingTheme with the customized values so ThemeDemo can render it live.
function themeWithCustom(t: WeddingTheme, c: Custom): WeddingTheme {
  return {
    ...t,
    colors: { ...t.colors, bg: c.bg, accent: c.accent, surface: c.surface, ink: c.ink },
    fonts: { display: c.displayFont, body: c.bodyFont },
    heroGradient: `linear-gradient(135deg, ${c.bg} 0%, ${c.accent} 100%)`,
  };
}

function Swatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs font-body">
      <span
        className="relative w-8 h-8 rounded-full border border-border/60 overflow-hidden shadow-sm"
        style={{ background: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label={label}
        />
      </span>
      <span className="text-muted-foreground">{label}</span>
    </label>
  );
}

export default function Themes() {
  const [active, setActive] = useState<WeddingTheme | null>(null);
  const [custom, setCustom] = useState<Custom | null>(null);
  const [applying, setApplying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [previewTpl, setPreviewTpl] = useState<WeddingTheme | null>(null);
  const { user } = useAuth();
  const { loadUserSite, updateSite, createSite } = useWeddingSite();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [active]);

  const openTheme = (t: WeddingTheme) => {
    setActive(t);
    setCustom(customFrom(t));
  };

  const previewTheme = active && custom ? themeWithCustom(active, custom) : null;

  const applyTheme = async () => {
    if (!active || !custom) return;
    if (!user) {
      navigate("/auth", { state: { returnTo: "/themes" } });
      return;
    }
    setApplying(true);
    try {
      const site = await loadUserSite();
      if (!site) {
        toast({ title: "Create your site first", description: "Finish the wizard to create a site, then apply this theme." });
        navigate("/wizard");
        return;
      }
      const ok = await updateSite(site.id, {
        theme: active.id,
        suggested_colors: [custom.bg, custom.accent, custom.surface],
        display_font: custom.displayFont,
        body_font: custom.bodyFont,
      });
      if (ok) {
        toast({ title: "Theme applied", description: `${active.name} is now your site's theme.` });
        navigate(`/editor/${site.id}`);
      }
    } finally {
      setApplying(false);
    }
  };

  // One-click: seed a whole new site from the theme's tradition-specific template.
  // If the user already has a site, apply theme + template sections on top of it.
  const startFromTemplate = async (t: WeddingTheme) => {
    if (!user) {
      navigate("/auth", { state: { returnTo: "/themes" } });
      return;
    }
    setStarting(true);
    try {
      const c = custom && active?.id === t.id ? custom : customFrom(t);
      const tpl = buildThemeTemplate(t);
      const sections = buildThemeSections(t);
      const existing = await loadUserSite();
      if (existing) {
        const ok = await updateSite(existing.id, {
          theme: t.id,
          suggested_colors: [c.bg, c.accent, c.surface],
          display_font: c.displayFont,
          body_font: c.bodyFont,
          sections,
        });
        if (ok) {
          toast({ title: "Template applied", description: `Your site was reset to the ${t.name} starter.` });
          navigate(`/editor/${existing.id}`);
        }
        return;
      }
      const site = await createSite({
        partner1: tpl.partner1,
        partner2: tpl.partner2,
        culturalBackground: tpl.culturalBackground,
        howWeMet: tpl.howWeMet,
        theme: t.id,
        tagline: tpl.tagline,
        suggestedColors: [c.bg, c.accent, c.surface],
        sections,
        displayFont: c.displayFont,
        bodyFont: c.bodyFont,
      });
      if (site) {
        toast({ title: "Your site is ready", description: `Started from the ${t.name} template — customize freely.` });
        navigate(`/editor/${(site as any).id}`);
      }
    } finally {
      setStarting(false);
    }
  };

  return (
    <>
      <GoogleFontsLoader />
      <Helmet>
        <title>10 Wedding Website Themes · Vowz</title>
        <meta
          name="description"
          content="Explore 10 curated wedding website themes, customize colors, typography, and motif intensity, then apply to your site in one click."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="border-b border-border/40 bg-gradient-to-b from-cream/40 to-transparent">
          <div className="max-w-6xl mx-auto px-4 py-14 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs font-body tracking-wide mb-4">
              <Sparkles className="w-3.5 h-3.5" /> 10 curated collections · fully customizable
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-3">
              Themes for every love story
            </h1>
            <p className="font-body text-muted-foreground max-w-2xl mx-auto">
              Pick a style, then customize colors, typography, and motif intensity with a live preview before publishing.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-10">
          {/* Category quick-jump */}
          <nav className="flex flex-wrap gap-2 justify-center mb-10">
            {THEME_CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="px-3 py-1.5 rounded-full border border-border/60 bg-muted/30 hover:bg-gold/10 hover:border-gold/40 hover:text-gold text-xs font-body transition-colors"
              >
                {cat.label}
                <span className="ml-1.5 text-muted-foreground">({cat.themeIds.length})</span>
              </a>
            ))}
          </nav>

          {THEME_CATEGORIES.map((cat) => {
            const items = cat.themeIds
              .map((id) => WEDDING_THEMES.find((t) => t.id === id))
              .filter(Boolean) as WeddingTheme[];
            if (items.length === 0) return null;
            return (
              <section key={cat.id} id={cat.id} className="mb-14 scroll-mt-24">
                <header className="mb-5 flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">{cat.label}</h2>
                    <p className="text-sm text-muted-foreground font-body mt-1 max-w-xl">{cat.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-body">{items.length} theme{items.length > 1 ? "s" : ""}</span>
                </header>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group text-left rounded-2xl"
                    >
                      <button
                        type="button"
                        onClick={() => openTheme(t)}
                        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-2xl"
                        aria-label={`Preview and customize ${t.name}`}
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
                              Customize <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </button>
                      <div className="px-1 mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewTpl(t)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border/60 bg-background hover:bg-muted/40 text-foreground px-3 py-2 text-xs font-body transition-colors"
                          aria-label={`Preview landing page for ${t.name}`}
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => startFromTemplate(t)}
                          disabled={starting}
                          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 hover:bg-gold/20 text-gold px-3 py-2 text-xs font-body transition-colors disabled:opacity-60"
                          aria-label={`Start with the ${t.name} template`}
                        >
                          <Wand2 className="w-3.5 h-3.5" /> {starting ? "Starting…" : "Start with template"}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            );
          })}

          <div className="text-center mt-16">
            <p className="text-sm text-muted-foreground font-body mb-4">Not sure which one? Start with our onboarding wizard.</p>
            <Button variant="gold" size="lg" asChild>
              <Link to="/wizard"><Sparkles className="w-4 h-4 mr-2" /> Build my site</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Customize + preview modal */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background border-border">
          {active && custom && previewTheme && (
            <div className="max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border/50 px-5 py-3 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold">{active.name}</h2>
                  <p className="text-xs text-muted-foreground">{active.tradition} · customize before you publish</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setCustom(customFrom(active))}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Reset
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/site/demo-${active.id}`} target="_blank" rel="noopener">
                      <Eye className="w-4 h-4 mr-1" /> View demo
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => startFromTemplate(active)} disabled={starting}>
                    <Wand2 className="w-4 h-4 mr-1" /> {starting ? "Starting…" : "Start with template"}
                  </Button>
                  <Button variant="gold" size="sm" onClick={applyTheme} disabled={applying}>
                    <Check className="w-4 h-4 mr-1" /> {applying ? "Applying…" : "Apply to my site"}
                  </Button>
                  <button onClick={() => setActive(null)} aria-label="Close" className="p-2 rounded-md hover:bg-muted">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-[280px_1fr] gap-0">
                {/* Controls */}
                <aside className="border-b md:border-b-0 md:border-r border-border/50 p-5 space-y-6 bg-muted/20">
                  <section>
                    <h3 className="font-display text-sm font-semibold mb-3">Colors</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Swatch label="Background" value={custom.bg} onChange={(v) => setCustom({ ...custom, bg: v })} />
                      <Swatch label="Accent" value={custom.accent} onChange={(v) => setCustom({ ...custom, accent: v })} />
                      <Swatch label="Surface" value={custom.surface} onChange={(v) => setCustom({ ...custom, surface: v })} />
                      <Swatch label="Ink" value={custom.ink} onChange={(v) => setCustom({ ...custom, ink: v })} />
                    </div>
                  </section>

                  <section>
                    <h3 className="font-display text-sm font-semibold mb-3">Typography</h3>
                    <label className="block text-xs text-muted-foreground font-body mb-1">Display (headings)</label>
                    <select
                      value={custom.displayFont}
                      onChange={(e) => setCustom({ ...custom, displayFont: e.target.value })}
                      className="w-full mb-3 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      style={{ fontFamily: `'${custom.displayFont}', serif` }}
                    >
                      {FONT_POOL.map((f) => (
                        <option key={f} value={f} style={{ fontFamily: `'${f}', serif` }}>{f}</option>
                      ))}
                    </select>
                    <label className="block text-xs text-muted-foreground font-body mb-1">Body</label>
                    <select
                      value={custom.bodyFont}
                      onChange={(e) => setCustom({ ...custom, bodyFont: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      style={{ fontFamily: `'${custom.bodyFont}', sans-serif` }}
                    >
                      {FONT_POOL.map((f) => (
                        <option key={f} value={f} style={{ fontFamily: `'${f}', sans-serif` }}>{f}</option>
                      ))}
                    </select>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display text-sm font-semibold">Motif intensity</h3>
                      <span className="text-xs text-muted-foreground font-body">{Math.round(custom.motifIntensity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(custom.motifIntensity * 100)}
                      onChange={(e) => setCustom({ ...custom, motifIntensity: Number(e.target.value) / 100 })}
                      className="w-full accent-gold"
                      aria-label="Motif intensity"
                    />
                    <p className="text-[11px] text-muted-foreground font-body mt-1">Controls the strength of the decorative pattern behind your hero.</p>
                  </section>
                </aside>

                {/* Live preview */}
                <div className="p-5 bg-background">
                  <ThemeDemo theme={previewTheme} motifIntensity={custom.motifIntensity} />
                  <p className="text-sm text-muted-foreground font-body mt-5 leading-relaxed">{active.description}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
