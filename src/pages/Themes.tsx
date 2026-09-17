import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight, X, RotateCcw, Wand2, Eye, Search, Crown, Lock } from "lucide-react";
import BuyLuxeButton from "@/components/BuyLuxeButton";
import LuxeCollectionSection from "@/components/LuxeCollectionSection";
import { useLuxeAccess } from "@/hooks/use-luxe-access";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { WEDDING_THEMES, type WeddingTheme } from "@/lib/wedding-themes";
import { ThemeDemo } from "@/components/ThemeDemo";
import { LazyOnVisible } from "@/components/LazyOnVisible";
import { useAuth } from "@/hooks/use-auth";
import { useWeddingSite } from "@/hooks/use-wedding-site";
import { buildThemeSections, buildThemeTemplate } from "@/lib/theme-templates";
import { THEME_CATEGORIES } from "@/lib/theme-demo-sites";
import { supabase } from "@/integrations/supabase/client";
import { mergeSections } from "@/lib/theme-merge";

/**
 * Full-screen theme preview body. Owns iframe load state so we can surface
 * a polite aria-live announcement to screen readers while the demo site
 * loads, and provides a clear DialogTitle/DialogDescription pair for the
 * accessible name and description of the modal.
 */
const DEVICE_WIDTHS = { phone: 390, tablet: 834, desktop: 0 } as const;
type PreviewDevice = keyof typeof DEVICE_WIDTHS;

function FullScreenThemePreview({
  theme,
  starting,
  onClose,
  onStart,
}: {
  theme: WeddingTheme;
  starting: boolean;
  onClose: () => void;
  onStart: (t: WeddingTheme) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  // Default to the device the visitor is actually holding, so a preview
  // opened on a phone shows the phone layout, not a shrunken desktop page.
  const [device, setDevice] = useState<PreviewDevice>(() => {
    if (typeof window === "undefined") return "desktop";
    if (window.innerWidth < 768) return "phone";
    if (window.innerWidth < 1280) return "tablet";
    return "desktop";
  });
  useEffect(() => { setLoaded(false); }, [theme.id, device]);
  const status = loaded
    ? `${theme.name} landing preview loaded.`
    : `Loading ${theme.name} landing preview…`;
  const frameWidth = DEVICE_WIDTHS[device];
  return (
    <div className="flex flex-col w-full h-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 h-14 border-b border-border/50 bg-background/90 backdrop-blur shrink-0 max-w-full overflow-hidden">
        <div className="min-w-0">
          <DialogTitle
            id="theme-preview-title"
            className="font-display text-sm sm:text-lg font-semibold truncate"
          >
            {theme.name} preview
          </DialogTitle>
          <DialogDescription
            id="theme-preview-desc"
            className="text-[11px] text-muted-foreground truncate"
          >
            {theme.tradition}. Interactive demo of the landing page for this theme. Press Escape or use the Close button to return to the theme list.
          </DialogDescription>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Device switcher — visible on tablet and larger where there is room. */}
          <div className="hidden lg:flex items-center rounded-full border border-border/60 p-0.5">
            {(["phone", "tablet", "desktop"] as PreviewDevice[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                aria-pressed={device === d}
                className={`px-2.5 py-1 rounded-full text-xs font-body capitalize transition-colors ${
                  device === d ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <Button
            variant="gold"
            size="sm"
            disabled={starting}
            onClick={() => onStart(theme)}
          >
            <Wand2 className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">{starting ? "Starting…" : "Start with template"}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close preview"
            className="min-h-11 min-w-11"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {/* Polite live region announces preview loading state to screen readers. */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {status}
      </div>
      <div className="flex-1 min-h-0 w-full max-w-full flex justify-center bg-muted/30 overflow-x-hidden overflow-y-auto">
        <iframe
          key={`${theme.id}-${device}`}
          src={`/site/demo-${theme.id}`}
          title={`${theme.name} landing preview`}
          onLoad={() => setLoaded(true)}
          className="h-full border-0 bg-background w-full"
          style={frameWidth ? { maxWidth: frameWidth } : undefined}
          tabIndex={0}
        />
      </div>
    </div>
  );
}


// Facet metadata for filtering by region, wedding type (ceremony style), and visual style.
type Facet = { region: string; type: string; styles: string[] };
const THEME_FACETS: Record<string, Facet> = {
  "royal-rajput":       { region: "north-indian", type: "hindu",     styles: ["regal", "traditional", "ornate"] },
  "marwari-haveli":     { region: "north-indian", type: "hindu",     styles: ["regal", "traditional", "ornate"] },
  "punjabi-anand-karaj":{ region: "north-indian", type: "sikh",      styles: ["vibrant", "traditional"] },
  "south-indian-temple":{ region: "south-indian", type: "hindu",     styles: ["traditional", "temple"] },
  "kerala-backwaters":  { region: "south-indian", type: "hindu",     styles: ["traditional", "nature"] },
  "bengali-alpona":     { region: "east-indian",  type: "hindu",     styles: ["traditional", "artisanal"] },
  "goa-beach":          { region: "destination",  type: "beach",     styles: ["breezy", "modern", "nature"] },
  "boho-destination":   { region: "destination",  type: "boho",      styles: ["boho", "modern", "nature"] },
  "christian-chapel":   { region: "any",          type: "christian", styles: ["classic", "chapel"] },
  "modern-minimal":     { region: "any",          type: "civil",     styles: ["modern", "minimal", "editorial"] },
  "nikah-emerald":      { region: "any",          type: "muslim",    styles: ["traditional", "regal", "ornate"] },
  "walima-rose":        { region: "any",          type: "muslim",    styles: ["classic", "modern"] },
};

// Religion-first browsing: the way most couples actually search.
const FAITH_CHIPS = [
  { id: "all", label: "All weddings", emoji: "💐" },
  { id: "hindu", label: "Hindu", emoji: "🕉️" },
  { id: "muslim", label: "Muslim · Nikah", emoji: "🌙" },
  { id: "sikh", label: "Sikh · Anand Karaj", emoji: "🪯" },
  { id: "christian", label: "Christian", emoji: "⛪" },
  { id: "beach", label: "Destination", emoji: "🌊" },
  { id: "civil", label: "Civil · Modern", emoji: "✨" },
];
const REGION_OPTIONS = [
  { id: "all", label: "All regions" },
  { id: "north-indian", label: "North Indian" },
  { id: "south-indian", label: "South Indian" },
  { id: "east-indian", label: "East Indian" },
  { id: "destination", label: "Destination" },
  { id: "any", label: "Universal" },
];
const TYPE_OPTIONS = [
  { id: "all", label: "All wedding types" },
  { id: "hindu", label: "Hindu" },
  { id: "muslim", label: "Muslim · Nikah" },
  { id: "sikh", label: "Sikh · Anand Karaj" },
  { id: "christian", label: "Christian · Chapel" },
  { id: "beach", label: "Beach" },
  { id: "boho", label: "Boho · Destination" },
  { id: "civil", label: "Civil · Modern" },
];
const STYLE_OPTIONS = [
  { id: "all", label: "All styles" },
  { id: "traditional", label: "Traditional" },
  { id: "regal", label: "Regal" },
  { id: "modern", label: "Modern" },
  { id: "minimal", label: "Minimal" },
  { id: "boho", label: "Boho" },
  { id: "nature", label: "Nature" },
  { id: "classic", label: "Classic" },
  { id: "vibrant", label: "Vibrant" },
];

// Tradition + motif options are derived from WEDDING_THEMES so adding a
// theme auto-populates the filter dropdowns.
const uniq = <T extends string>(xs: T[]) => Array.from(new Set(xs)).sort();
const TRADITION_OPTIONS = [
  { id: "all", label: "All traditions" },
  ...uniq(WEDDING_THEMES.map((t) => t.tradition)).map((v) => ({ id: v, label: v })),
];
const MOTIF_OPTIONS = [
  { id: "all", label: "All motifs" },
  ...uniq(WEDDING_THEMES.map((t) => t.motif)).map((v) => ({
    id: v,
    label: v.charAt(0).toUpperCase() + v.slice(1),
  })),
];

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
        className="relative w-8 h-8 rounded-full border border-border/60 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
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
  // When the user already has a site, ask whether to replace or merge template content.
  const [applyChoice, setApplyChoice] = useState<{ theme: WeddingTheme; existingId: string } | null>(null);
  // Filter + search state
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [wtype, setWtype] = useState("all");
  const [style, setStyle] = useState("all");
  const [tradition, setTradition] = useState("all");
  const [motif, setMotif] = useState("all");
  const [category, setCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(18);
  const { user } = useAuth();
  const { hasLuxe, loading: luxeLoading, refresh: refreshLuxe } = useLuxeAccess();
  const { loadUserSite, updateSite, createSite } = useWeddingSite();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [active]);

  const openTheme = (t: WeddingTheme) => {
    setActive(t);
    setCustom(customFrom(t));
    persistPreviewedTheme(t);
  };

  const previewTheme = active && custom ? themeWithCustom(active, custom) : null;

  // Persist the previewed theme so the wizard/editor pre-fills correctly the
  // next time the user starts (including after sign-in). Consumers read
  // sessionStorage.pendingTemplate (see OnboardingWizard.tsx / Auth.tsx).
  const persistPreviewedTheme = (t: WeddingTheme) => {
    try {
      const c = customFrom(t);
      sessionStorage.setItem(
        "pendingTemplate",
        JSON.stringify({
          templateName: t.name,
          templateStyle: t.id,
          templateColors: [c.bg, c.accent, c.surface],
          displayFont: c.displayFont,
          bodyFont: c.bodyFont,
        }),
      );
    } catch {
      /* storage disabled — safe to ignore */
    }
  };

  const filtersActive =
    query.trim() !== "" ||
    region !== "all" ||
    wtype !== "all" ||
    style !== "all" ||
    tradition !== "all" ||
    motif !== "all" ||
    category !== "all";
  const filteredThemes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return WEDDING_THEMES.filter((t) => t.tier !== "luxe").filter((t) => {
      const f = THEME_FACETS[t.family ?? t.id];
      if (category !== "all") {
        const selected = THEME_CATEGORIES.find((item) => item.id === category);
        if (!selected?.themeIds.includes(t.id)) return false;
      }
      if (region !== "all" && f?.region !== region) return false;
      if (wtype !== "all" && f?.type !== wtype) return false;
      if (style !== "all" && !f?.styles.includes(style)) return false;
      if (tradition !== "all" && t.tradition !== tradition) return false;
      if (motif !== "all" && t.motif !== motif) return false;
      if (!q) return true;
      const hay = [t.name, t.tradition, t.description, t.tagline, t.motif, ...(f?.styles ?? [])]
        .join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [query, region, wtype, style, tradition, motif, category]);

  useEffect(() => { setVisibleCount(18); }, [query, region, wtype, style, tradition, motif, category]);

  const visibleThemes = filteredThemes.slice(0, visibleCount);
  const visibleThemeIds = useMemo(() => new Set(visibleThemes.map((theme) => theme.id)), [visibleThemes]);

  const resetFilters = () => {
    setQuery(""); setRegion("all"); setWtype("all"); setStyle("all");
    setTradition("all"); setMotif("all"); setCategory("all");
  };

  const applyTheme = async () => {
    if (!active || !custom) return;
    if (!user) {
      navigate("/auth", { state: { returnTo: "/themes" } });
      return;
    }
    if (active.tier === "luxe" && !hasLuxe) {
      toast({ title: "LUXE design", description: "Unlock LUXE once to use this design on your wedding website.", variant: "destructive" });
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
  // If the user already has a site, ask whether to replace or merge template content.
  const startFromTemplate = async (t: WeddingTheme) => {
    if (!user) {
      navigate("/auth", { state: { returnTo: "/themes" } });
      return;
    }
    if (t.tier === "luxe" && !hasLuxe) {
      toast({ title: "LUXE design", description: "Unlock LUXE once to build your website on this design.", variant: "destructive" });
      return;
    }
    const existing = await loadUserSite();
    if (existing) {
      setApplyChoice({ theme: t, existingId: (existing as any).id });
      return;
    }
    setStarting(true);
    try {
      const c = custom && active?.id === t.id ? custom : customFrom(t);
      const tpl = buildThemeTemplate(t);
      const sections = buildThemeSections(t);
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

  // Deep link: /themes?use=<theme-id> (used by the home-page LUXE cards) starts
  // building that exact design as soon as the page is ready.
  const [searchParams, setSearchParams] = useSearchParams();
  const useParam = searchParams.get("use");
  useEffect(() => {
    if (!useParam || luxeLoading || starting) return;
    const theme = WEDDING_THEMES.find((t) => t.id === useParam);
    const next = new URLSearchParams(searchParams);
    next.delete("use");
    setSearchParams(next, { replace: true });
    if (!theme) return;
    openTheme(theme);
    startFromTemplate(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useParam, luxeLoading]);


  // Apply a template to an existing site — either fully replacing sections or
  // merging on top so custom story/events/RSVP text is preserved.
  const applyTemplateToExisting = async (t: WeddingTheme, existingId: string, mode: "replace" | "merge") => {
    setStarting(true);
    try {
      const c = custom && active?.id === t.id ? custom : customFrom(t);
      const tplSections = buildThemeSections(t);
      let sections = tplSections;
      if (mode === "merge") {
        const { data: row } = await supabase
          .from("wedding_sites")
          .select("sections")
          .eq("id", existingId)
          .maybeSingle();
        const userSections = Array.isArray((row as any)?.sections) ? (row as any).sections : [];
        sections = mergeSections(userSections, tplSections);
      }
      const ok = await updateSite(existingId, {
        theme: t.id,
        suggested_colors: [c.bg, c.accent, c.surface],
        display_font: c.displayFont,
        body_font: c.bodyFont,
        sections,
      });
      if (ok) {
        toast({
          title: mode === "merge" ? "Template merged" : "Template applied",
          description: mode === "merge"
            ? `Kept your story, event details, RSVP settings, and gallery media — applied ${t.name} colors and fonts and filled only missing sections.`
            : `Your site was reset to the ${t.name} starter.`,
        });
        setApplyChoice(null);
        navigate(`/editor/${existingId}`);
      }
    } finally {
      setStarting(false);
    }
  };

  return (
    <>
      <GoogleFontsLoader />
      <Helmet>
        <title>{`${WEDDING_THEMES.length} Wedding Website Themes · Vowz`}</title>
        <meta
          name="description"
          content={`Explore ${WEDDING_THEMES.length} curated wedding website themes, customize colors, typography, and motif intensity, then apply to your site in one click.`}
        />
        <meta
          property="og:title"
          content={`${WEDDING_THEMES.length} Wedding Website Themes · Vowz`}
        />
        <meta
          property="og:description"
          content={`Explore ${WEDDING_THEMES.length} curated wedding website themes, customize colors, typography, and motif intensity, then apply to your site in one click.`}
        />
        <link rel="canonical" href="https://vowz.me/themes" />
        <meta property="og:url" content="https://vowz.me/themes" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`${WEDDING_THEMES.length} Wedding Website Themes · Vowz`}
        />
        <meta
          name="twitter:description"
          content={`Explore ${WEDDING_THEMES.length} curated wedding website themes, customize colors, typography, and motif intensity, then apply to your site in one click.`}
        />
        <meta
          property="og:image"
          content="https://vowz.me/__l5e/assets-v1/c10ad07b-630f-4317-b1aa-e337c71c2348/og-image.jpg"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="Vowz — curated wedding website themes"
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="border-b border-border/40 bg-gradient-to-b from-cream/40 to-transparent">
          <div className="max-w-6xl mx-auto px-4 py-14 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs font-body tracking-wide mb-4">
              <Sparkles className="w-3.5 h-3.5" /> {WEDDING_THEMES.length} curated collections · fully customizable
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
          {/* Religion-first quick browse */}
          <div className="mb-5">
            <p className="font-body text-sm text-muted-foreground mb-2">Browse by wedding tradition</p>
            <div className="flex flex-wrap gap-2">
              {FAITH_CHIPS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setWtype(c.id)}
                  aria-pressed={wtype === c.id}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-body transition-colors ${
                    wtype === c.id
                      ? "border-gold bg-gold/15 text-foreground"
                      : "border-border/60 bg-background hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span className="mr-1.5">{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter + search bar */}
          <div className="mb-6 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5">
            <div className="mb-3 sm:hidden">
              <label htmlFor="mobile-theme-category" className="mb-1.5 block text-xs font-body text-muted-foreground">Browse a category</label>
              <select
                id="mobile-theme-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-body"
              >
                <option value="all">All standard designs</option>
                {THEME_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search themes, traditions, styles…"
                  className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm font-body focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  aria-label="Search themes"
                />
              </div>
              <select
                value={tradition}
                onChange={(e) => setTradition(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-body"
                aria-label="Filter by tradition"
              >
                {TRADITION_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <select
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-body"
                aria-label="Filter by motif"
              >
                {MOTIF_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-body"
                aria-label="Filter by region"
              >
                {REGION_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <select
                value={wtype}
                onChange={(e) => setWtype(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-body"
                aria-label="Filter by wedding type"
              >
                {TYPE_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-body"
                aria-label="Filter by style"
              >
                {STYLE_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
            {filtersActive && (
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground font-body">
                  {filteredThemes.length} theme{filteredThemes.length === 1 ? "" : "s"} match your filters
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-body text-gold hover:underline inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Exclusive LUXE designs (hidden when filtering) */}
          {!filtersActive && (
            <LuxeCollectionSection
              hasLuxe={hasLuxe}
              busy={starting || applying}
              onPreview={openTheme}
              onUse={startFromTemplate}
              onUnlocked={refreshLuxe}
            />
          )}

          {/* Category quick-jump (hidden when filtering) */}
          {!filtersActive && (
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
          )}

          {filtersActive ? (
            filteredThemes.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl">
                <p className="font-body text-muted-foreground mb-3">No themes match those filters.</p>
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Clear filters
                </Button>
              </div>
            ) : (
              <section className="mb-14">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleThemes.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="group text-left rounded-2xl"
                    >
                      <button
                        type="button"
                        onClick={() => openTheme(t)}
                        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-2xl"
                        aria-label={`Preview and customize ${t.name}`}
                      >
                        <div
                          data-testid="theme-demo-card"
                          data-theme-id={t.id}
                          className="transition-transform group-hover:-translate-y-1"
                        >
                          <LazyOnVisible
                            minHeight={220}
                            fallback={
                              <div
                                aria-hidden
                                className="w-full rounded-xl border border-border/50 animate-pulse"
                                style={{ height: 220, background: t.colors.surface }}
                              />
                            }
                          >
                            <ThemeDemo theme={t} compact />
                          </LazyOnVisible>
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
                          onClick={() => { persistPreviewedTheme(t); setPreviewTpl(t); }}
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
                {visibleCount < filteredThemes.length && (
                  <div className="mt-8 flex justify-center">
                    <Button variant="outline" size="lg" onClick={() => setVisibleCount((count) => Math.min(count + 18, filteredThemes.length))}>
                      Load more designs ({filteredThemes.length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
              </section>
            )
          ) : (
          THEME_CATEGORIES.map((cat) => {
            const items = cat.themeIds
              .map((id) => WEDDING_THEMES.find((t) => t.id === id))
              .filter((theme): theme is WeddingTheme => Boolean(theme) && visibleThemeIds.has(theme.id));
            if (items.length === 0) return null;
            return (
              <section key={cat.id} id={cat.id} className="mb-14 scroll-mt-24">
                <header className="mb-5 flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">{cat.label}</h2>
                    <p className="text-sm text-muted-foreground font-body mt-1 max-w-xl">{cat.description}</p>
                  </div>
                   <span className="text-xs text-muted-foreground font-body">{cat.themeIds.length} designs</span>
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
                        <div
                          data-testid="theme-demo-card"
                          data-theme-id={t.id}
                          className="transition-transform group-hover:-translate-y-1"
                        >
                          <LazyOnVisible
                            minHeight={220}
                            fallback={
                              <div
                                aria-hidden
                                className="w-full rounded-xl border border-border/50 animate-pulse"
                                style={{ height: 220, background: t.colors.surface }}
                              />
                            }
                          >
                            <ThemeDemo theme={t} compact />
                          </LazyOnVisible>
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
                          onClick={() => { persistPreviewedTheme(t); setPreviewTpl(t); }}
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
          }))}
          {!filtersActive && visibleCount < filteredThemes.length && (
            <div className="flex justify-center -mt-4 mb-14">
              <Button variant="outline" size="lg" onClick={() => setVisibleCount((count) => Math.min(count + 18, filteredThemes.length))}>
                Load more designs ({filteredThemes.length - visibleCount} remaining)
              </Button>
            </div>
          )}

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
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-auto max-w-5xl p-0 overflow-hidden bg-background border-border">
          {active && custom && previewTheme && (
            <div
              className="max-h-[92vh] overflow-y-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              tabIndex={0}
              role="region"
              aria-label={`${active.name} theme customizer`}
            >
              <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border/50 px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg sm:text-xl font-semibold truncate">{active.name}</h2>
                    <p className="text-xs text-muted-foreground truncate">{active.tradition} · customize before you publish</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActive(null)}
                    aria-label="Close"
                    className="sm:hidden shrink-0 p-2 rounded-md hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                  <Button variant="ghost" size="sm" className="justify-center" onClick={() => setCustom(customFrom(active))}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Reset
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="justify-center"
                    onClick={() => { if (active) persistPreviewedTheme(active); setPreviewTpl(active); }}
                  >
                    <Eye className="w-4 h-4 mr-1" /> Preview
                  </Button>
                  <Button variant="outline" size="sm" className="justify-center" onClick={() => startFromTemplate(active)} disabled={starting}>
                    <Wand2 className="w-4 h-4 mr-1" /> {starting ? "Starting…" : "Use template"}
                  </Button>
                  <Button variant="gold" size="sm" className="justify-center" onClick={applyTheme} disabled={applying}>
                    <Check className="w-4 h-4 mr-1" /> {applying ? "Applying…" : "Apply"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setActive(null)}
                    aria-label="Close"
                    className="hidden sm:block p-2 rounded-md hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
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

      {/* Full-screen landing page preview modal */}
      <Dialog open={!!previewTpl} onOpenChange={(o) => !o && setPreviewTpl(null)}>
        <DialogContent
          className="max-w-none w-screen h-screen sm:h-screen p-0 rounded-none border-0 bg-background sm:rounded-none"
          style={{ width: "100vw", height: "100dvh", maxWidth: "100vw" }}
          aria-labelledby="theme-preview-title"
          aria-describedby="theme-preview-desc"
        >
          {previewTpl && (
            <FullScreenThemePreview
              theme={previewTpl}
              starting={starting}
              onClose={() => setPreviewTpl(null)}
              onStart={(t) => { setPreviewTpl(null); startFromTemplate(t); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Replace vs. Merge chooser when a site already exists */}
      <Dialog open={!!applyChoice} onOpenChange={(o) => !o && setApplyChoice(null)}>
        <DialogContent className="max-w-md p-6 bg-background border-border">
          {applyChoice && (
            <div className="space-y-4">
              <DialogTitle className="font-display text-lg font-semibold">
                Apply {applyChoice.theme.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Choose whether to merge the template with your existing site or replace all content.
              </DialogDescription>
              <div>
                <p className="text-sm text-muted-foreground font-body mt-1">
                  You already have a site. Choose how to apply this template.
                </p>
              </div>
              <div className="grid gap-3">
                <button
                  type="button"
                  disabled={starting}
                  onClick={() => applyTemplateToExisting(applyChoice.theme, applyChoice.existingId, "merge")}
                  className="text-left rounded-xl border-2 border-gold/60 bg-gold/10 hover:bg-gold/20 p-4 transition-colors disabled:opacity-60"
                >
                  <p className="font-body font-semibold text-foreground text-sm">Apply on top of existing (recommended)</p>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    Keeps your story, events, RSVP text, and any custom sections. Only styling changes and empty sections get filled from the template.
                  </p>
                </button>
                <button
                  type="button"
                  disabled={starting}
                  onClick={() => applyTemplateToExisting(applyChoice.theme, applyChoice.existingId, "replace")}
                  className="text-left rounded-xl border border-border hover:border-destructive/50 p-4 transition-colors disabled:opacity-60"
                >
                  <p className="font-body font-semibold text-foreground text-sm">Replace all content</p>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    Resets every section to the template's sample copy. Your custom text will be lost.
                  </p>
                </button>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setApplyChoice(null)} disabled={starting}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
