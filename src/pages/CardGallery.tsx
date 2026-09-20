import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Lock, Heart, Smartphone, Printer, Monitor, X as XIcon, Sparkles, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";
import {
  FALLBACK_TEMPLATES,
  CARD_THEMES,
  TEMPLATE_FACETS,
  CATEGORY_LABELS,
  InvitationCardArtwork,
  type CardTemplateMeta,
  type CardCategory,
} from "@/lib/card-templates";
import { useTemplateFavorites } from "@/hooks/use-template-favorites";
import { usePremiumStatus } from "@/hooks/use-premium-status";
import { trackTemplateEvent, fetchTemplatePopularity } from "@/lib/template-analytics";
import UpgradeTemplateDialog, {
  readPendingPremiumTemplate,
  writePendingPremiumTemplate,
  clearPendingPremiumTemplate,
} from "@/components/UpgradeTemplateDialog";
import { exportTemplateToPdf, type PdfMode, type PdfPaper, type PdfQuality } from "@/lib/template-pdf-export";
import { toast } from "@/hooks/use-toast";

const PDF_PAPER_KEY = "vowz.pdf.paper";
const PDF_QUALITY_KEY = "vowz.pdf.quality";

const DEMO_DATA = {
  partner1: "Aanya",
  partner2: "Rohan",
  date: "Saturday, 14 February 2026",
  time: "6:00 PM onwards",
  venue: "The Leela Palace, Udaipur",
  invitationLine: "Together with their families",
  message: "Two souls, one journey — join us as we say I do.",
};

const CATEGORIES: { value: "all" | CardCategory; label: string }[] = [
  { value: "all", label: "All Designs" },
  { value: "hindu_sikh", label: CATEGORY_LABELS.hindu_sikh },
  { value: "christian_muslim", label: CATEGORY_LABELS.christian_muslim },
  { value: "modern_minimal", label: CATEGORY_LABELS.modern_minimal },
  { value: "royal_traditional", label: CATEGORY_LABELS.royal_traditional },
];

type SortMode = "recommended" | "newest" | "popular" | "favorites";
type PreviewMode = "card" | "mobile" | "print";

// Stable fallback so "Most Popular" still feels meaningful when no analytics yet.
function fallbackScore(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return Math.abs(h) % 100;
}

// ── Reusable card preview at varying scales / framings ──
function TemplatePreview({
  template, scale = 0.5, mode = "card", width = 420,
}: { template: CardTemplateMeta; scale?: number; mode?: PreviewMode; width?: number }) {
  const theme = CARD_THEMES[template.slug];
  if (!theme) return null;
  const artwork = <InvitationCardArtwork data={DEMO_DATA} theme={theme} width={width} />;
  if (mode === "mobile") {
    // Render inside a phone frame
    return (
      <div className="relative" style={{ width: 260, height: 540 }}>
        <div className="absolute inset-0 rounded-[36px] bg-foreground/90 shadow-xl" />
        <div className="absolute inset-[10px] rounded-[28px] bg-background overflow-hidden flex items-center justify-center">
          <div style={{ transform: `scale(${(240 / width)})`, transformOrigin: "center" }}>{artwork}</div>
        </div>
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-background/30" />
      </div>
    );
  }
  if (mode === "print") {
    // Render with a paper / crop-mark frame
    return (
      <div className="relative bg-white p-6 shadow-2xl" style={{ width: width * scale + 64, height: width * 1.4 * scale + 64 }}>
        {/* Crop marks */}
        {(["tl","tr","bl","br"] as const).map((c) => (
          <div key={c} className="absolute w-4 h-4" style={{
            top: c.includes("t") ? 8 : undefined, bottom: c.includes("b") ? 8 : undefined,
            left: c.includes("l") ? 8 : undefined, right: c.includes("r") ? 8 : undefined,
          }}>
            <div className="absolute top-1/2 left-0 w-full h-px bg-foreground/60" />
            <div className="absolute left-1/2 top-0 h-full w-px bg-foreground/60" />
          </div>
        ))}
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width, height: width * 1.4 }}>
          {artwork}
        </div>
      </div>
    );
  }
  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: "top center", pointerEvents: "none" }}>
      {artwork}
    </div>
  );
}

export default function CardGallery() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | CardCategory>("all");
  const [tier, setTier] = useState<"all" | "free" | "premium">("all");
  const [sort, setSort] = useState<SortMode>("recommended");
  const { favorites, toggle: toggleFav } = useTemplateFavorites();
  const { isPremium } = usePremiumStatus();
  const [detailSlug, setDetailSlug] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("card");
  const [popularity, setPopularity] = useState<Record<string, number>>({});
  const [upgradeFor, setUpgradeFor] = useState<CardTemplateMeta | null>(null);
  const [pdfBusy, setPdfBusy] = useState<null | PdfMode>(null);
  const [pdfPaper, setPdfPaper] = useState<PdfPaper>(() => {
    try { return (localStorage.getItem(PDF_PAPER_KEY) as PdfPaper) || "card"; } catch { return "card"; }
  });
  const [pdfQuality, setPdfQuality] = useState<PdfQuality>(() => {
    try { return (localStorage.getItem(PDF_QUALITY_KEY) as PdfQuality) || "high"; } catch { return "high"; }
  });
  const [pendingPremiumSlug, setPendingPremiumSlug] = useState<string | null>(() => readPendingPremiumTemplate());

  // Persist last-used PDF dialog settings so they default next time.
  useEffect(() => { try { localStorage.setItem(PDF_PAPER_KEY, pdfPaper); } catch {} }, [pdfPaper]);
  useEffect(() => { try { localStorage.setItem(PDF_QUALITY_KEY, pdfQuality); } catch {} }, [pdfQuality]);

  // Load popularity counts on mount
  useEffect(() => {
    fetchTemplatePopularity().then(setPopularity).catch(() => {});
  }, []);

  // Resume a previously interrupted "Use this template" after upgrade
  useEffect(() => {
    if (!isPremium) return;
    const pending = readPendingPremiumTemplate();
    if (pending) {
      clearPendingPremiumTemplate();
      try { sessionStorage.setItem("pendingCardTemplate", pending); } catch {}
      toast({ title: "Premium unlocked", description: "Resuming your template…" });
      navigate("/dashboard");
    }
  }, [isPremium, navigate]);

  // Open detail = track open + preview, intercept locked premium templates
  const openDetail = (t: CardTemplateMeta) => {
    trackTemplateEvent(t.slug, "open");
    trackTemplateEvent(t.slug, "preview");
    if (t.is_premium && !isPremium) {
      setUpgradeFor(t);
      return;
    }
    setDetailSlug(t.slug);
  };

  // "Use this template" → premium-gate first, then stash slug and route to dashboard
  const handleUse = (t: CardTemplateMeta) => {
    trackTemplateEvent(t.slug, "use");
    if (t.is_premium && !isPremium) {
      writePendingPremiumTemplate(t.slug);
      setPendingPremiumSlug(t.slug);
      setUpgradeFor(t);
      return;
    }
    try { sessionStorage.setItem("pendingCardTemplate", t.slug); } catch {}
    navigate("/dashboard");
  };

  const handleDownloadPdf = async (t: CardTemplateMeta, mode: PdfMode) => {
    if (t.is_premium && !isPremium) {
      setUpgradeFor(t);
      return;
    }
    setPdfBusy(mode);
    // Render event fires before the heavy canvas work begins.
    trackTemplateEvent(t.slug, "render", { mode, paper: pdfPaper, quality: pdfQuality });
    try {
      await exportTemplateToPdf(
        { slug: t.slug, name: t.name, data: DEMO_DATA, theme: CARD_THEMES[t.slug] },
        mode,
        pdfPaper,
        pdfQuality,
      );
      trackTemplateEvent(t.slug, "download", { mode, paper: pdfPaper, quality: pdfQuality });
      toast({ title: "PDF ready", description: `${t.name} · ${mode} · ${pdfPaper.toUpperCase()} · ${pdfQuality} quality downloaded.` });
    } catch (e: any) {
      toast({ title: "PDF export failed", description: e?.message || "Try again.", variant: "destructive" });
    } finally {
      setPdfBusy(null);
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = FALLBACK_TEMPLATES.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (tier === "free" && t.is_premium) return false;
      if (tier === "premium" && !t.is_premium) return false;
      if (sort === "favorites" && !favorites.includes(t.slug)) return false;
      if (!q) return true;
      const facets = TEMPLATE_FACETS[t.slug];
      return (
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        (facets?.tags ?? []).some((tag) => tag.includes(q))
      );
    });
    const sorted = [...filtered];
    if (sort === "newest") {
      // The new premium templates were appended; later index = newer.
      sorted.sort((a, b) =>
        FALLBACK_TEMPLATES.indexOf(b) - FALLBACK_TEMPLATES.indexOf(a)
      );
    } else if (sort === "popular") {
      // Real analytics score; fall back to deterministic hash if no events yet.
      sorted.sort((a, b) => {
        const sb = (popularity[b.slug] ?? 0) * 1000 + fallbackScore(b.slug);
        const sa = (popularity[a.slug] ?? 0) * 1000 + fallbackScore(a.slug);
        return sb - sa;
      });
    } else if (sort === "recommended") {
      // Premium first, then favorites bubbled up.
      sorted.sort((a, b) => {
        const fa = favorites.includes(a.slug) ? 1 : 0;
        const fb = favorites.includes(b.slug) ? 1 : 0;
        if (fa !== fb) return fb - fa;
        if (a.is_premium !== b.is_premium) return a.is_premium ? -1 : 1;
        return 0;
      });
    }
    return sorted;
  }, [query, category, tier, sort, favorites, popularity]);

  const detailTpl = detailSlug ? FALLBACK_TEMPLATES.find((t) => t.slug === detailSlug) : null;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Premium Wedding Invitation Card Templates – Vowz"
        description={`Browse ${FALLBACK_TEMPLATES.length}+ editable invitation card designs for weddings, engagements, receptions, Nikah, Sangeet and more. Download as PDF or image.`}
        canonical="https://vowz.me/card-gallery"
        robots="index, follow"
      />
      <Navbar />
      <section className="pt-24 sm:pt-28 pb-16 sm:pb-20 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-3 sm:mb-4 font-body text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
          </Button>
          <div className="text-center mb-6 sm:mb-10">
            <p className="text-accent font-semibold font-body tracking-wider uppercase text-sm mb-3">
              {FALLBACK_TEMPLATES.filter((template) => template.is_premium).length} Premium Card Designs
            </p>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3">
              Invitation <span className="text-gradient-gold italic">Card Gallery</span>
              <span className="align-middle ml-3 inline-block px-3 py-1 text-sm sm:text-base rounded-full bg-accent text-accent-foreground font-body font-semibold -rotate-2 shadow-sm">
                Free
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto font-body text-sm sm:text-base">
              Fully editable, print-ready wedding invitation cards. Pick a design and customize every detail from your dashboard.
              <span className="block mt-2 text-foreground font-medium">
                PDF and image downloads are free — premium removes the small Vowz.me credit.
              </span>
            </p>

          </div>

          <div className="flex flex-col md:flex-row gap-2 sm:gap-3 items-stretch md:items-center justify-center mb-4 sm:mb-6 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by style, color, or theme..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="flex-1 md:flex-none px-3 py-2.5 rounded-lg border border-border bg-background text-sm font-body"
                aria-label="Sort templates"
              >
                <option value="recommended">Recommended</option>
                <option value="newest">Newest</option>
                <option value="popular">Most popular</option>
                <option value="favorites">My favorites ({favorites.length})</option>
              </select>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as any)}
                className="flex-1 md:flex-none px-3 py-2.5 rounded-lg border border-border bg-background text-sm font-body"
                aria-label="Filter by tier"
              >
                <option value="all">All tiers</option>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all ${
                  category === c.value
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Pending premium resume banner — survives refresh until cleared */}
          {pendingPremiumSlug && !isPremium && (() => {
            const t = FALLBACK_TEMPLATES.find((x) => x.slug === pendingPremiumSlug);
            if (!t) return null;
            return (
              <div className="mb-6 mx-auto max-w-3xl rounded-xl border border-gold/40 bg-gold/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-1 text-sm font-body">
                  <Lock className="w-4 h-4 text-gold" />
                  <span><strong>{t.name}</strong> is waiting. Upgrade to resume — your pick is saved across refreshes.</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setUpgradeFor(t)}>Resume upgrade</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { clearPendingPremiumTemplate(); setPendingPremiumSlug(null); }}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* Preview-mode toggle */}
          <div className="flex items-center justify-center gap-1 mb-4 sm:mb-6">
            <div className="inline-flex rounded-lg border border-border bg-card p-1">
              {([
                { v: "card", label: "Card", icon: Monitor },
                { v: "mobile", label: "Mobile", icon: Smartphone },
                { v: "print", label: "Print/PDF", icon: Printer },
              ] as const).map(({ v, label, icon: Icon }) => (
                <button
                  key={v}
                  onClick={() => setPreviewMode(v)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-body font-medium flex items-center gap-1.5 transition-all ${
                    previewMode === v
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-pressed={previewMode === v}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs sm:text-sm text-muted-foreground font-body mb-6">
            Showing {visible.length} of {FALLBACK_TEMPLATES.length} designs
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {visible.map((t) => {
              const theme = CARD_THEMES[t.slug];
              if (!theme) return null;
              const isFav = favorites.includes(t.slug);
              return (
                <div
                  key={t.slug}
                  className="group rounded-xl overflow-hidden border border-border/50 bg-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => openDetail(t)}
                    className="relative bg-muted/30 h-[300px] sm:h-[360px] overflow-hidden flex items-start justify-center pt-3 sm:pt-4 cursor-zoom-in"
                    aria-label={`Open ${t.name} preview`}
                  >
                    <TemplatePreview template={t} mode={previewMode} scale={previewMode === "print" ? 0.36 : 0.5} />
                    {t.is_premium && (
                      <Badge className="absolute top-2 left-2 bg-gold/90 text-background border-0 text-[10px] gap-1">
                        <Lock className="w-2.5 h-2.5" /> Premium
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleFav(t.slug); }}
                      className={`absolute top-2 right-2 w-8 h-8 rounded-full grid place-items-center backdrop-blur-sm border transition-all ${
                        isFav
                          ? "bg-rose-500/90 border-rose-300 text-white"
                          : "bg-background/70 border-border text-muted-foreground hover:text-rose-500"
                      }`}
                      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className="w-4 h-4" fill={isFav ? "currentColor" : "none"} />
                    </button>
                  </button>
                  <div className="p-3 sm:p-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-display text-base font-semibold text-foreground truncate">{t.name}</h3>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {CATEGORY_LABELS[t.category]}
                      </Badge>
                    </div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground font-body line-clamp-2 mb-3">{t.description}</p>
                    )}
                    <div className="mt-auto flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openDetail(t)}>
                        Preview
                      </Button>
                      <Button size="sm" className="flex-1" onClick={() => handleUse(t)}>
                        Use
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {visible.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-body">
                {sort === "favorites" ? "You haven't favorited any designs yet — tap the heart on any card." : "No designs match your filters."}
              </p>
            </div>
          )}

          <div className="text-center mt-12 sm:mt-16 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-gold/10 via-background to-accent/10 border border-border/50">
            <h2 className="font-display text-2xl font-semibold mb-2">Ready to customize?</h2>
            <p className="text-muted-foreground font-body mb-5 max-w-lg mx-auto text-sm sm:text-base">
              Open your dashboard, pick a wedding site, and tap “Invitation Card” to start editing any of these designs.
            </p>
            <Button asChild size="lg">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Template detail / full-screen preview dialog ── */}
      <Dialog open={!!detailTpl} onOpenChange={(o) => !o && setDetailSlug(null)}>
        <DialogContent className="max-w-5xl w-[96vw] max-h-[92vh] overflow-y-auto p-0">
          {detailTpl && (
            <div className="grid md:grid-cols-[1fr_320px]">
              {/* Preview pane */}
              <div className="bg-muted/30 p-4 sm:p-8 flex flex-col items-center justify-center min-h-[420px]">
                <DialogTitle className="sr-only">{detailTpl.name} preview</DialogTitle>
                <div className="flex items-center gap-1 mb-4">
                  <div className="inline-flex rounded-lg border border-border bg-card p-1">
                    {([
                      { v: "card", label: "Card", icon: Monitor },
                      { v: "mobile", label: "Mobile", icon: Smartphone },
                      { v: "print", label: "Print/PDF", icon: Printer },
                    ] as const).map(({ v, label, icon: Icon }) => (
                      <button
                        key={v}
                        onClick={() => setPreviewMode(v)}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-body font-medium flex items-center gap-1.5 transition-all ${
                          previewMode === v
                            ? "bg-accent text-accent-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-start justify-center overflow-auto max-h-[60vh] w-full">
                  <TemplatePreview
                    template={detailTpl}
                    mode={previewMode}
                    scale={previewMode === "print" ? 0.6 : 0.85}
                    width={500}
                  />
                </div>
              </div>

              {/* Info pane */}
              <div className="p-5 sm:p-6 border-t md:border-t-0 md:border-l border-border/60 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display text-2xl font-semibold">{detailTpl.name}</h3>
                  <button
                    onClick={() => setDetailSlug(null)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Close"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="outline" className="text-[10px]">{CATEGORY_LABELS[detailTpl.category]}</Badge>
                  {detailTpl.is_premium && (
                    <Badge className="bg-gold/20 text-gold border-gold/40 text-[10px] gap-1">
                      <Lock className="w-2.5 h-2.5" /> Premium
                    </Badge>
                  )}
                  {(TEMPLATE_FACETS[detailTpl.slug]?.tags ?? []).slice(0, 5).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
                {detailTpl.description && (
                  <p className="text-sm text-muted-foreground font-body mb-4">{detailTpl.description}</p>
                )}

                {detailTpl.is_premium && (
                  <div className="rounded-lg border border-gold/40 bg-gold/5 p-3 mb-4 text-xs font-body">
                    <div className="flex items-center gap-1.5 font-semibold text-gold mb-1">
                      <Sparkles className="w-3.5 h-3.5" /> Premium template
                    </div>
                    <p className="text-muted-foreground">
                      Open the editor to customize freely. Saving and exporting requires an active Premium plan — upgrade anytime from your dashboard.
                    </p>
                  </div>
                )}

                <div className="mt-auto flex flex-col gap-2">
                  <Button onClick={() => handleUse(detailTpl)} className="w-full">
                    Use this template
                  </Button>
                  <Button
                    variant="gold"
                    className="w-full"
                    onClick={() => {
                      trackTemplateEvent(detailTpl.slug, "use");
                      navigate(`/wizard?card=${encodeURIComponent(detailTpl.slug)}`);
                    }}
                  >
                    Build a wedding site with this style
                  </Button>
                  <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
                    <span className="shrink-0">Paper:</span>
                    <select
                      value={pdfPaper}
                      onChange={(e) => setPdfPaper(e.target.value as PdfPaper)}
                      className="flex-1 px-2 py-1.5 rounded-md border border-border bg-background text-foreground"
                      aria-label="PDF paper size"
                    >
                      <option value="card">Card (5×7 / 4×6)</option>
                      <option value="a4">A4 (210×297 mm)</option>
                      <option value="letter">Letter (8.5×11 in)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
                    <span className="shrink-0">Quality:</span>
                    <select
                      value={pdfQuality}
                      onChange={(e) => setPdfQuality(e.target.value as PdfQuality)}
                      className="flex-1 px-2 py-1.5 rounded-md border border-border bg-background text-foreground"
                      aria-label="PDF image quality"
                    >
                      <option value="high">High (~300 dpi · sharper)</option>
                      <option value="standard">Standard (~200 dpi · faster)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadPdf(detailTpl, "phone")}
                      disabled={pdfBusy !== null}
                    >
                      {pdfBusy === "phone"
                        ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        : <Download className="w-4 h-4 mr-2" />}
                      Phone PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadPdf(detailTpl, "print")}
                      disabled={pdfBusy !== null}
                    >
                      {pdfBusy === "print"
                        ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        : <Printer className="w-4 h-4 mr-2" />}
                      Print PDF
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => toggleFav(detailTpl.slug)}
                    className="w-full"
                  >
                    <Heart
                      className="w-4 h-4 mr-2"
                      fill={favorites.includes(detailTpl.slug) ? "currentColor" : "none"}
                    />
                    {favorites.includes(detailTpl.slug) ? "Favorited" : "Add to favorites"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <UpgradeTemplateDialog
        open={!!upgradeFor}
        onOpenChange={(o) => !o && setUpgradeFor(null)}
        templateName={upgradeFor?.name}
        onUpgraded={() => {
          // Premium status will refresh; the resume effect handles redirect.
          if (upgradeFor) writePendingPremiumTemplate(upgradeFor.slug);
          setUpgradeFor(null);
        }}
      />
    </div>
  );
}