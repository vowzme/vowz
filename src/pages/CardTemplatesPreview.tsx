import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import html2canvas from "html2canvas";
import {
  CARD_THEMES,
  CATEGORY_LABELS,
  FALLBACK_TEMPLATES,
  InvitationCardArtwork,
  type CardData,
  type CardCategory,
  type CardTemplateMeta,
} from "@/lib/card-templates";
import { exportTemplateToPdf, type PdfPaper, type PdfQuality } from "@/lib/template-pdf-export";
import { trackTemplateEvent, fetchTemplatePopularity } from "@/lib/template-analytics";
import { useTemplateFavorites } from "@/hooks/use-template-favorites";
import { usePremiumStatus } from "@/hooks/use-premium-status";
import UpgradeTemplateDialog, { writePendingPremiumTemplate, clearPendingPremiumTemplate, readPendingPremiumTemplate } from "@/components/UpgradeTemplateDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ImageIcon, FileText, Eye, ArrowLeft, Lock, Heart, Share2 } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";

const SAMPLE: CardData = {
  partner1: "Aanya",
  partner2: "Rohan",
  date: "Saturday, 12 December 2026",
  time: "6:30 PM onwards",
  venue: "The Leela Palace, Bengaluru",
  invitationLine: "Together with their families",
  message: "Request the pleasure of your company as they begin their forever.",
};

type PreviewMode = "image" | "pdf" | "offline";
type FormatFilter = "all" | "pdf" | "image";
const LS_MODE = "vowz.preview.mode";
const LS_PAPER = "vowz.preview.paper";
const LS_QUALITY = "vowz.preview.quality";

type ShareFormat = "pdf" | "image" | "all";

function formatLabel(f: ShareFormat): string {
  if (f === "pdf") return "PDF";
  if (f === "image") return "Image (PNG)";
  return "PDF or Image";
}

function buildWhatsappShareUrl(tpl: CardTemplateMeta, format: ShareFormat): string {
  const params = new URLSearchParams({ slug: tpl.slug });
  if (format !== "all") params.set("format", format);
  const url = `${window.location.origin}/card-templates-preview?${params.toString()}`;
  const fmt = formatLabel(format);
  const msg =
    `💍 *Wedding Invitation* — "${tpl.name}"\n\n` +
    `Preview this invitation card and download it as ${fmt} to share with family & friends:\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

function shareOnWhatsapp(tpl: CardTemplateMeta, format: ShareFormat = "all") {
  const shareUrl = buildWhatsappShareUrl(tpl, format);
  trackTemplateEvent(tpl.slug, "share", {
    channel: "whatsapp",
    slug: tpl.slug,
    template_name: tpl.name,
    category: tpl.category,
    is_premium: tpl.is_premium,
    format,
    format_label: formatLabel(format),
    share_url: shareUrl,
  });
  window.open(shareUrl, "_blank", "noopener,noreferrer");
}

function downloadDataUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function CardTemplatesPreview() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [active, setActive] = useState<CardTemplateMeta | null>(null);
  const [mode, setMode] = useState<PreviewMode>(
    () => ((localStorage.getItem(LS_MODE) as PreviewMode) || "image"),
  );
  const [paper, setPaper] = useState<PdfPaper>(
    () => ((localStorage.getItem(LS_PAPER) as PdfPaper) || "card"),
  );
  const [quality, setQuality] = useState<PdfQuality>(
    () => ((localStorage.getItem(LS_QUALITY) as PdfQuality) || "high"),
  );
  const [busy, setBusy] = useState(false);
  const [popularity, setPopularity] = useState<Record<string, number>>({});
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeTpl, setUpgradeTpl] = useState<CardTemplateMeta | null>(null);
  const [pendingAction, setPendingAction] = useState<"open" | "use" | null>(null);

  const { favorites, toggle: toggleFavorite } = useTemplateFavorites();
  const { isPremium } = usePremiumStatus();

  const themeFilter = (searchParams.get("theme") || "all") as CardCategory | "all";
  const formatFilter = (searchParams.get("format") || "all") as FormatFilter;

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  }

  useEffect(() => { localStorage.setItem(LS_MODE, mode); }, [mode]);
  useEffect(() => { localStorage.setItem(LS_PAPER, paper); }, [paper]);
  useEffect(() => { localStorage.setItem(LS_QUALITY, quality); }, [quality]);

  useEffect(() => { fetchTemplatePopularity().then(setPopularity); }, []);

  const templates = useMemo(() => {
    const list = FALLBACK_TEMPLATES.filter((t) => CARD_THEMES[t.slug])
      .filter((t) => themeFilter === "all" || t.category === themeFilter);
    // All offline cards support both PDF and PNG, so the format filter
    // is informational (it surfaces WhatsApp-ready output type).
    return [...list].sort((a, b) => (popularity[b.slug] ?? 0) - (popularity[a.slug] ?? 0));
  }, [popularity, themeFilter]);

  // Deep-link: open a specific template if ?slug=
  useEffect(() => {
    const slug = searchParams.get("slug");
    if (!slug || active) return;
    const tpl = FALLBACK_TEMPLATES.find((t) => t.slug === slug && CARD_THEMES[t.slug]);
    if (tpl) {
      setActive(tpl);
      trackTemplateEvent(tpl.slug, "open", { via: "deeplink" });
    }
  }, [searchParams, active]);

  // Default mode to format filter when user lands with ?format=
  useEffect(() => {
    if (formatFilter === "pdf") setMode("pdf");
    else if (formatFilter === "image") setMode("image");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formatFilter]);

  // Resume after upgrade
  useEffect(() => {
    if (!isPremium) return;
    const pending = readPendingPremiumTemplate();
    if (!pending) return;
    const tpl = templates.find((t) => t.slug === pending);
    if (tpl) {
      clearPendingPremiumTemplate();
      setActive(tpl);
      trackTemplateEvent(tpl.slug, "open");
    }
  }, [isPremium, templates]);

  function openTemplate(tpl: CardTemplateMeta) {
    if (tpl.is_premium && !isPremium) {
      writePendingPremiumTemplate(tpl.slug);
      setUpgradeTpl(tpl);
      setPendingAction("open");
      setUpgradeOpen(true);
      return;
    }
    setActive(tpl);
    trackTemplateEvent(tpl.slug, "open");
  }

  function handleUseTemplate(tpl: CardTemplateMeta) {
    if (tpl.is_premium && !isPremium) {
      writePendingPremiumTemplate(tpl.slug);
      setUpgradeTpl(tpl);
      setPendingAction("use");
      setUpgradeOpen(true);
      return;
    }
    trackTemplateEvent(tpl.slug, "use");
    navigate(`/card-gallery?template=${tpl.slug}`);
  }

  async function handleDownloadImage(tpl: CardTemplateMeta) {
    const theme = CARD_THEMES[tpl.slug];
    if (!theme) return;
    setBusy(true);
    trackTemplateEvent(tpl.slug, "render", { kind: "image" });
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-10000px;top:0;background:#fff;";
    document.body.appendChild(host);
    try {
      const { createRoot } = await import("react-dom/client");
      const root = createRoot(host);
      await new Promise<void>((resolve) => {
        root.render(
          <InvitationCardArtwork data={SAMPLE} theme={theme} width={1200} />,
        );
        setTimeout(resolve, 120);
      });
      const canvas = await html2canvas(host, { backgroundColor: "#fff", scale: 2, useCORS: true, logging: false });
      downloadDataUrl(canvas.toDataURL("image/png"), `${tpl.slug}.png`);
      root.unmount();
      trackTemplateEvent(tpl.slug, "download", { kind: "image" });
      toast.success("Image downloaded");
    } catch (e) {
      toast.error("Image export failed");
    } finally {
      host.remove();
      setBusy(false);
    }
  }

  async function handleDownloadPdf(tpl: CardTemplateMeta) {
    setBusy(true);
    try {
      trackTemplateEvent(tpl.slug, "render", { kind: "pdf", paper, quality });
      await exportTemplateToPdf(
        { slug: tpl.slug, name: tpl.name, data: SAMPLE },
        "print",
        paper,
        quality,
      );
      trackTemplateEvent(tpl.slug, "download", { kind: "pdf", paper, quality });
      toast.success("PDF downloaded");
    } catch {
      toast.error("PDF export failed");
    } finally {
      setBusy(false);
    }
  }

  if (active) {
    const theme = CARD_THEMES[active.slug];
    const isFav = favorites.includes(active.slug);
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => setActive(null)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to templates
          </Button>

          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <div className="bg-muted/30 rounded-lg p-4 sm:p-8 flex justify-center overflow-auto">
              <div className="max-w-full">
                <InvitationCardArtwork data={SAMPLE} theme={theme} width={Math.min(500, window.innerWidth - 80)} />
              </div>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-xl">{active.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon" variant="ghost"
                      onClick={() => toggleFavorite(active.slug)}
                      aria-label={isFav ? "Remove favorite" : "Add favorite"}
                    >
                      <Heart className={`h-4 w-4 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                    {active.is_premium && (
                      <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />Premium</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{CATEGORY_LABELS[active.category]}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {active.description && (
                  <p className="text-sm">{active.description}</p>
                )}

                <Tabs
                  value={mode}
                  onValueChange={(v) => {
                    setMode(v as PreviewMode);
                    trackTemplateEvent(active.slug, "preview", { mode: v });
                  }}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="image"><ImageIcon className="h-3.5 w-3.5 mr-1" />Image</TabsTrigger>
                    <TabsTrigger value="pdf"><FileText className="h-3.5 w-3.5 mr-1" />PDF</TabsTrigger>
                    <TabsTrigger value="offline"><Eye className="h-3.5 w-3.5 mr-1" />Offline</TabsTrigger>
                  </TabsList>
                </Tabs>

                {mode === "image" && (
                  <>
                    <Button disabled={busy} className="w-full" onClick={() => handleDownloadImage(active)}>
                      <Download className="h-4 w-4 mr-2" /> Download PNG
                    </Button>
                    <Button disabled={busy} variant="outline" className="w-full" onClick={() => handleDownloadPdf(active)}>
                      <Download className="h-4 w-4 mr-2" /> Also download PDF
                    </Button>
                  </>
                )}
                {mode === "pdf" && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={paper} onValueChange={(v) => setPaper(v as PdfPaper)}>
                        <SelectTrigger><SelectValue placeholder="Paper" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="card">Card 5×7</SelectItem>
                          <SelectItem value="a4">A4</SelectItem>
                          <SelectItem value="letter">Letter</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={quality} onValueChange={(v) => setQuality(v as PdfQuality)}>
                        <SelectTrigger><SelectValue placeholder="Quality" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High (~300 DPI)</SelectItem>
                          <SelectItem value="standard">Standard (~200 DPI)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button disabled={busy} className="w-full" onClick={() => handleDownloadPdf(active)}>
                      <Download className="h-4 w-4 mr-2" /> Download PDF
                    </Button>
                  </>
                )}
                {mode === "offline" && (
                  <>
                    <div className="text-sm text-muted-foreground">
                      This preview works fully offline — no network required.
                    </div>
                    <Button disabled={busy} className="w-full" onClick={() => handleDownloadPdf(active)}>
                      <Download className="h-4 w-4 mr-2" /> Download PDF
                    </Button>
                  </>
                )}

                <Button
                  variant="secondary"
                  className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white"
                  onClick={() =>
                    shareOnWhatsapp(
                      active,
                      mode === "pdf" ? "pdf" : mode === "image" ? "image" : "all",
                    )
                  }
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share on WhatsApp{mode === "pdf" || mode === "image" ? ` (${formatLabel(mode === "pdf" ? "pdf" : "image")})` : ""}
                </Button>

                <Button variant="outline" className="w-full" onClick={() => handleUseTemplate(active)}>
                  Use this template
                </Button>
              </CardContent>
            </Card>
          </div>
          <UpgradeTemplateDialog
            open={upgradeOpen}
            onOpenChange={setUpgradeOpen}
            templateName={upgradeTpl?.name}
            onUpgraded={() => {
              if (!upgradeTpl) return;
              const tpl = upgradeTpl;
              clearPendingPremiumTemplate();
              if (pendingAction === "use") {
                trackTemplateEvent(tpl.slug, "use");
                navigate(`/card-gallery?template=${tpl.slug}`);
              } else {
                setActive(tpl);
                trackTemplateEvent(tpl.slug, "open");
              }
            }}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Invitation Card Templates</h1>
          <p className="text-muted-foreground mt-1">
            Offline-ready cards you can download as PDF or PNG and share on WhatsApp.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs uppercase tracking-wider text-muted-foreground self-center mr-1">Theme:</span>
          {(["all", "hindu_sikh", "christian_muslim", "modern_minimal", "royal_traditional"] as const).map((c) => (
            <Button
              key={c}
              size="sm"
              variant={themeFilter === c ? "default" : "outline"}
              onClick={() => updateParam("theme", c)}
            >
              {c === "all" ? "All themes" : CATEGORY_LABELS[c as CardCategory]}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-xs uppercase tracking-wider text-muted-foreground self-center mr-1">Format:</span>
          {(["all", "pdf", "image"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={formatFilter === f ? "default" : "outline"}
              onClick={() => updateParam("format", f)}
            >
              {f === "all" ? "All" : f === "pdf" ? (<><FileText className="h-3 w-3 mr-1" />PDF</>) : (<><ImageIcon className="h-3 w-3 mr-1" />Image (PNG)</>)}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {templates.map((tpl) => {
            const theme = CARD_THEMES[tpl.slug];
            const isFav = favorites.includes(tpl.slug);
            return (
              <Card
                key={tpl.slug}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => openTemplate(tpl)}
              >
                <div className="bg-muted/30 p-3 flex justify-center relative">
                  <Button
                    size="icon" variant="ghost"
                    className="absolute top-1 right-1 h-7 w-7 bg-background/80"
                    aria-label={isFav ? "Remove favorite" : "Add favorite"}
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(tpl.slug); }}
                  >
                    <Heart className={`h-3.5 w-3.5 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  <Button
                    size="icon" variant="ghost"
                    className="absolute top-1 left-1 h-7 w-7 bg-[#25D366] hover:bg-[#1ebe5d] text-white"
                    aria-label={`Share ${tpl.name} on WhatsApp`}
                    onClick={(e) => {
                      e.stopPropagation();
                      shareOnWhatsapp(tpl, formatFilter === "all" ? "all" : formatFilter);
                    }}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </Button>
                  <div style={{ transform: "scale(0.4)", transformOrigin: "top center", height: 224 }}>
                    <InvitationCardArtwork data={SAMPLE} theme={theme} width={400} />
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{tpl.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{CATEGORY_LABELS[tpl.category]}</p>
                    </div>
                    {tpl.is_premium && (
                      <Badge variant="secondary" className="shrink-0"><Lock className="h-3 w-3" /></Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <UpgradeTemplateDialog
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          templateName={upgradeTpl?.name}
          onUpgraded={() => {
            if (!upgradeTpl) return;
            const tpl = upgradeTpl;
            clearPendingPremiumTemplate();
            if (pendingAction === "use") {
              trackTemplateEvent(tpl.slug, "use");
              navigate(`/card-gallery?template=${tpl.slug}`);
            } else {
              setActive(tpl);
              trackTemplateEvent(tpl.slug, "open");
            }
          }}
        />
      </div>
    </Layout>
  );
}