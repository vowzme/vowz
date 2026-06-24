import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  ArrowLeft, Download, Lock, FileImage, FileText, Sparkles, Upload, X as XIcon,
  Plus, Trash2, Save, Image as ImageIcon, Palette as PaletteIcon, Type as TypeIcon,
  GripVertical, Printer, ArrowUp, ArrowDown, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useMediaUpload } from "@/hooks/use-media-upload";
import SEOHead from "@/components/SEOHead";
import {
  CARD_THEMES, CATEGORY_LABELS, CardCategory, CardTemplateMeta, FALLBACK_TEMPLATES,
  InvitationCardArtwork, CardTheme, PageContent, QrPosition,
  DISPLAY_FONTS, BODY_FONTS, PRESET_PALETTES,
  PAPER_SIZES, PaperSize, PageScaling,
} from "@/lib/card-templates";

const QR_POSITIONS: { value: QrPosition; label: string }[] = [
  { value: "bottom", label: "Bottom center" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "top-right", label: "Top right" },
  { value: "hidden", label: "Hide QR on this page" },
];

const BLEED_PRESETS: { value: number; label: string }[] = [
  { value: 0, label: "None (0\")" },
  { value: 0.125, label: "Standard (0.125\")" },
  { value: 0.25, label: "Full bleed (0.25\")" },
];
const MARGIN_PRESETS: { value: number; label: string }[] = [
  { value: 0.15, label: "Tight (0.15\")" },
  { value: 0.25, label: "Standard (0.25\")" },
  { value: 0.375, label: "Roomy (0.375\")" },
];
const DPI = 300;
const DEFAULT_PAPER: PaperSize = "5x7";
const pageSizeOf = (p: PageContent, fallback: PaperSize) =>
  PAPER_SIZES[p.paperSize ?? fallback];

function uid() { return Math.random().toString(36).slice(2, 10); }

const defaultPages = (): PageContent[] => [
  { id: uid(), kind: "front", showQr: true, qrPosition: "bottom" },
];

export default function InvitationCard() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { upload } = useMediaUpload();
  const cardRef = useRef<HTMLDivElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<CardTemplateMeta[]>(FALLBACK_TEMPLATES);
  const [isPremium, setIsPremium] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CardCategory>("hindu_sikh");
  const [selectedSlug, setSelectedSlug] = useState<string>("hindu-ganesha-classic");
  const [exporting, setExporting] = useState<null | "png" | "pdf">(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Saved variants
  const [variants, setVariants] = useState<any[]>([]);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [variantName, setVariantName] = useState("My card");

  const [form, setForm] = useState({
    partner1: "", partner2: "", date: "", time: "", venue: "",
    message: "", invitationLine: "Together with their families",
    photo: "" as string | undefined,
  });
  const [themeOverrides, setThemeOverrides] = useState<Partial<CardTheme>>({});
  const [pages, setPages] = useState<PageContent[]>(defaultPages());
  const [activePageIdx, setActivePageIdx] = useState(0);

  // Print settings
  const [bleed, setBleed] = useState<number>(0); // inches (variant default)
  const [safeMargin, setSafeMargin] = useState<number>(0.25); // inches
  const [cropMarks, setCropMarks] = useState<boolean>(true); // variant default
  const [defaultPaper, setDefaultPaper] = useState<PaperSize>(DEFAULT_PAPER);
  const [livePreview, setLivePreview] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewBuilding, setPreviewBuilding] = useState(false);

  // Drag & drop reordering
  const dragIdx = useRef<number | null>(null);
  const reorderPages = (from: number, to: number) => {
    if (from === to || to < 0 || to >= pages.length) return;
    setPages((p) => {
      const next = [...p];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
    setActivePageIdx(to);
  };
  const movePage = (idx: number, dir: -1 | 1) => reorderPages(idx, idx + dir);

  useEffect(() => {
    (async () => {
      if (!user || !siteId) return;
      setLoading(true);
      const { data: s } = await supabase.from("wedding_sites").select("*").eq("id", siteId).maybeSingle();
      if (s) {
        setSite(s);
        const sec = (s.sections as any[]) || [];
        const events = sec.find((x: any) => x.type === "events")?.content?.events || [];
        const first = events[0] || {};
        setForm((f) => ({
          ...f,
          partner1: s.partner1 || "",
          partner2: s.partner2 || "",
          date: first.date || "",
          time: first.time || "",
          venue: first.venue || first.location || "",
          message: s.tagline || "",
        }));
      }

      const { data: sub } = await (supabase as any)
        .from("user_subscriptions").select("plan,status,expires_at")
        .eq("user_id", user.id).eq("status", "active").maybeSingle();
      if (sub && (!sub.expires_at || new Date(sub.expires_at) > new Date())) {
        setIsPremium(["premium", "premium_6mo", "premium_yearly"].includes(sub.plan));
      }

      const { data: tpl } = await (supabase as any)
        .from("card_templates").select("slug,name,category,is_premium,is_enabled,description")
        .eq("is_enabled", true).order("sort_order");
      if (tpl?.length) setTemplates(tpl as any);

      const { data: vs } = await (supabase as any)
        .from("invitation_card_variants").select("*")
        .eq("wedding_site_id", siteId).order("updated_at", { ascending: false });
      if (vs) setVariants(vs);
      setLoading(false);
    })();
  }, [user, siteId]);

  const selected = templates.find((t) => t.slug === selectedSlug) ?? templates[0];
  const baseTheme = CARD_THEMES[selectedSlug] ?? CARD_THEMES["hindu-ganesha-classic"];
  const theme: CardTheme = { ...baseTheme, ...themeOverrides };
  const visibleTemplates = useMemo(
    () => templates.filter((t) => t.category === activeCategory),
    [templates, activeCategory]
  );
  const siteUrl = site?.slug ? `${window.location.origin}/site/${site.slug}` : `${window.location.origin}/`;
  const requiresUpgrade = selected?.is_premium && !isPremium;
  const currentPage = pages[activePageIdx] || pages[0];

  const updatePage = (patch: Partial<PageContent>) =>
    setPages((p) => p.map((pg, i) => (i === activePageIdx ? { ...pg, ...patch } : pg)));

  const addPage = (kind: PageContent["kind"]) => {
    const newPage: PageContent = {
      id: uid(), kind, showQr: true, qrPosition: "bottom",
      title: kind === "back" ? "With love" : "Mehendi",
      subtitle: kind === "back" ? "" : "An evening of color & music",
      body: kind === "back"
        ? "Thank you for being part of our story.\nWe can't wait to celebrate with you."
        : "Date • Time\nVenue address line 1\nVenue address line 2",
    };
    setPages((p) => [...p, newPage]);
    setActivePageIdx(pages.length);
  };

  const removePage = (idx: number) => {
    if (pages.length <= 1) return;
    setPages((p) => p.filter((_, i) => i !== idx));
    setActivePageIdx(Math.max(0, idx - 1));
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      setUploadingPhoto(true);
      const url = await upload(file, "card-photo");
      if (url) setForm((f) => ({ ...f, photo: url }));
    } catch {} finally { setUploadingPhoto(false); }
  };

  // ─── Save / Load variants ────────────────────────────────────
  const saveVariant = async () => {
    if (!user || !siteId) return;
    const printSettings = { bleed, safeMargin, cropMarks, defaultPaper };
    const payload = {
      wedding_site_id: siteId,
      user_id: user.id,
      name: variantName || "My card",
      template_slug: selectedSlug,
      data: { ...form, __print: printSettings },
      theme_overrides: themeOverrides,
      pages,
      photo_url: form.photo ?? null,
    };
    const q = variantId
      ? (supabase as any).from("invitation_card_variants").update(payload).eq("id", variantId).select().single()
      : (supabase as any).from("invitation_card_variants").insert(payload).select().single();
    const { data, error } = await q;
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    setVariantId(data.id);
    setVariants((v) => [data, ...v.filter((x) => x.id !== data.id)]);
    toast({ title: "Card saved", description: "Your design is saved to this site." });
  };

  const loadVariant = (v: any) => {
    setVariantId(v.id);
    setVariantName(v.name);
    setSelectedSlug(v.template_slug);
    const { __print, ...formData } = v.data || {};
    setForm({ ...formData, photo: v.photo_url ?? v.data?.photo ?? "" });
    if (__print) {
      setBleed(typeof __print.bleed === "number" ? __print.bleed : 0);
      setSafeMargin(typeof __print.safeMargin === "number" ? __print.safeMargin : 0.25);
      setCropMarks(__print.cropMarks !== false);
      setDefaultPaper((__print.defaultPaper as PaperSize) ?? DEFAULT_PAPER);
    } else {
      setBleed(0); setSafeMargin(0.25); setCropMarks(true); setDefaultPaper(DEFAULT_PAPER);
    }
    setThemeOverrides(v.theme_overrides || {});
    setPages(v.pages?.length ? v.pages : defaultPages());
    setActivePageIdx(0);
    const cat = (templates.find((t) => t.slug === v.template_slug)?.category) as CardCategory | undefined;
    if (cat) setActiveCategory(cat);
  };

  const deleteVariant = async (id: string) => {
    await (supabase as any).from("invitation_card_variants").delete().eq("id", id);
    setVariants((v) => v.filter((x) => x.id !== id));
    if (variantId === id) { setVariantId(null); setVariantName("My card"); }
  };

  // ─── Variant thumbnail ───────────────────────────────────────
  const VariantThumb = ({ v }: { v: any }) => {
    const tTheme = CARD_THEMES[v.template_slug] ?? CARD_THEMES["hindu-ganesha-classic"];
    const vTheme: CardTheme = { ...tTheme, ...(v.theme_overrides || {}) };
    const firstPage: PageContent = (v.pages?.[0] as PageContent) ?? { id: "p", kind: "front", showQr: false, qrPosition: "hidden" };
    return (
      <div style={{ width: 56, height: 78, overflow: "hidden", borderRadius: 4, flexShrink: 0, border: `1px solid ${tTheme.accent}55` }}>
        <div style={{ transform: "scale(0.112)", transformOrigin: "top left", width: 500, height: 700 }}>
          <InvitationCardArtwork
            data={{
              partner1: v.data?.partner1 || "—",
              partner2: v.data?.partner2 || "—",
              date: v.data?.date || "",
              venue: v.data?.venue || "",
              invitationLine: v.data?.invitationLine,
              photo: v.photo_url || v.data?.photo,
            }}
            theme={vTheme}
            width={500}
            page={{ ...firstPage, showQr: false, qrPosition: "hidden" }}
          />
        </div>
      </div>
    );
  };

  // ─── Export ──────────────────────────────────────────────────
  const renderPageNode = (page: PageContent) => {
    const { w, h } = pageSizeOf(page, defaultPaper);
    const cardAspect = 5 / 7;
    const pageAspect = w / h;
    const scaling: PageScaling = page.scaling ?? "fit";
    // Determine the rendered card size (in inches) inside the page (before bleed).
    let cardW = w, cardH = h;
    if (scaling === "fit") {
      if (pageAspect > cardAspect) { cardH = h; cardW = h * cardAspect; }
      else { cardW = w; cardH = w / cardAspect; }
    } else if (scaling === "fill") {
      if (pageAspect > cardAspect) { cardW = w; cardH = w / cardAspect; }
      else { cardH = h; cardW = h * cardAspect; }
    } // stretch: cardW=w cardH=h
    const cardWpx = Math.round(cardW * DPI);
    return (
      <div
        style={{
          width: w * DPI + bleed * 2 * DPI,
          height: h * DPI + bleed * 2 * DPI,
          background: theme.bg,
          padding: bleed * DPI,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: cardW * DPI,
            height: cardH * DPI,
            overflow: "hidden",
          }}
        >
          <div
            style={
              scaling === "stretch"
                ? { transform: `scale(${(cardW * DPI) / cardWpx}, ${(cardH * DPI) / (cardWpx * 1.4)})`, transformOrigin: "top left", width: cardWpx, height: cardWpx * 1.4 }
                : undefined
            }
          >
            <InvitationCardArtwork
              data={{
                partner1: form.partner1 || "Partner One",
                partner2: form.partner2 || "Partner Two",
                date: form.date || "Date TBA",
                time: form.time,
                venue: form.venue || "Venue TBA",
                message: form.message,
                invitationLine: form.invitationLine,
                photo: form.photo || undefined,
              }}
              theme={theme}
              width={cardWpx}
              page={page}
              qrPosition={page.showQr ? page.qrPosition : "hidden"}
              qrSlot={
                page.showQr ? (
                  <QRCodeSVG value={siteUrl} size={Math.round(cardWpx * 0.17)} level="H" bgColor="#ffffff" fgColor="#001F3F" />
                ) : undefined
              }
            />
          </div>
        </div>
      </div>
    );
  };

  // ─── Build PDF (used by both download + live preview) ─────────
  const buildPdf = async (): Promise<jsPDF | null> => {
    if (!exportContainerRef.current) return null;
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const nodes = Array.from(exportContainerRef.current.children) as HTMLElement[];
    let pdf: jsPDF | null = null;
    for (let i = 0; i < nodes.length; i++) {
      const page = pages[i];
      const { w: pw, h: ph } = pageSizeOf(page, defaultPaper);
      const pageW = pw + bleed * 2;
      const pageH = ph + bleed * 2;
      const orientation = pageW > pageH ? "landscape" : "portrait";
      if (!pdf) pdf = new jsPDF({ unit: "in", format: [pageW, pageH], orientation });
      else pdf.addPage([pageW, pageH], orientation);
      const canvas = await html2canvas(nodes[i], { scale: 1, backgroundColor: null, useCORS: true, allowTaint: true });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageW, pageH, undefined, "FAST");
      const showMarks = (page.cropMarks ?? cropMarks) && bleed > 0;
      if (showMarks) {
        const m = 0.18, o = bleed;
        pdf.setDrawColor(0); pdf.setLineWidth(0.005);
        const corners = [[o, o], [pageW - o, o], [o, pageH - o], [pageW - o, pageH - o]] as const;
        corners.forEach(([x, y]) => {
          pdf!.line(x - m, y, x - 0.02, y);
          pdf!.line(x + 0.02, y, x + m, y);
          pdf!.line(x, y - m, x, y - 0.02);
          pdf!.line(x, y + 0.02, x, y + m);
        });
      }
    }
    return pdf;
  };

  // ─── Live PDF preview (debounced) ─────────────────────────────
  useEffect(() => {
    if (!livePreview) return;
    let cancelled = false;
    setPreviewBuilding(true);
    const t = window.setTimeout(async () => {
      try {
        const pdf = await buildPdf();
        if (cancelled || !pdf) return;
        const blob = pdf.output("blob");
        const url = URL.createObjectURL(blob);
        setPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
      } catch (e) {
        console.error("PDF preview failed", e);
      } finally {
        if (!cancelled) setPreviewBuilding(false);
      }
    }, 700);
    return () => { cancelled = true; window.clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePreview, pages, bleed, cropMarks, defaultPaper, themeOverrides, selectedSlug, form]);

  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, []);

  const handleExport = async (type: "png" | "pdf") => {
    if (requiresUpgrade) {
      toast({ title: "Premium template", description: "Upgrade to download this design.", variant: "destructive" });
      return;
    }
    if (!exportContainerRef.current) return;
    try {
      setExporting(type);
      const filename = `${(form.partner1 || "wedding").replace(/\s+/g, "-")}-${(form.partner2 || "card").replace(/\s+/g, "-")}-invitation`;
      if (type === "png") {
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        const nodes = Array.from(exportContainerRef.current.children) as HTMLElement[];
        for (let i = 0; i < nodes.length; i++) {
          const canvas = await html2canvas(nodes[i], { scale: 1, backgroundColor: null, useCORS: true, allowTaint: true });
          const a = document.createElement("a");
          a.href = canvas.toDataURL("image/png");
          a.download = nodes.length === 1 ? `${filename}.png` : `${filename}-p${i + 1}.png`;
          a.click();
        }
      } else {
        const pdf = await buildPdf();
        if (pdf) pdf.save(`${filename}.pdf`);
      }
      toast({ title: `Downloaded ${type.toUpperCase()}`, description: `${pages.length} page${pages.length > 1 ? "s" : ""} exported.` });
    } catch (e: any) {
      toast({ title: "Download failed", description: e.message, variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  // (legacy block removed below)
  const _unusedLegacy = () => (
    <div
      style={{
        width: 5 * DPI,
        height: 7 * DPI,
        background: theme.bg,
        boxSizing: "border-box",
      }}
    />
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const colorField = (key: keyof CardTheme, label: string) => (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="color"
        value={(theme[key] as string) || "#000000"}
        onChange={(e) => setThemeOverrides((t) => ({ ...t, [key]: e.target.value }))}
        className="w-8 h-7 rounded border border-border cursor-pointer bg-transparent"
      />
    </label>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Invitation Card – Vowz" description="Design and download your wedding invitation card with QR code." robots="noindex, nofollow" />
      <header className="h-14 border-b border-border/50 bg-card/90 backdrop-blur-sm flex items-center px-3 sm:px-4 gap-2 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg font-semibold">Invitation Card</h1>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={saveVariant}>
          <Save className="w-4 h-4 mr-1" /> Save
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleExport("png")} disabled={!!exporting || requiresUpgrade}>
          <FileImage className="w-4 h-4 mr-1" /> PNG
        </Button>
        <Button variant="gold" size="sm" onClick={() => handleExport("pdf")} disabled={!!exporting || requiresUpgrade}>
          <FileText className="w-4 h-4 mr-1" /> PDF
        </Button>
      </header>

      <div className="grid lg:grid-cols-[1fr_480px] gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Preview area */}
        <div className="flex flex-col items-center">
          {/* Page picker */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <ol role="listbox" aria-label="Card pages — use arrow keys to reorder" className="flex items-center gap-2 flex-wrap p-0 m-0 list-none">
              {pages.map((p, i) => {
                const label = p.kind === "front" ? "Front" : p.kind === "back" ? "Back" : p.title || "Event";
                return (
                  <li key={p.id} className="inline-flex">
                    <div
                      role="option"
                      aria-selected={i === activePageIdx}
                      aria-label={`Page ${i + 1} of ${pages.length}: ${label}. Press Alt plus Arrow Left or Right to reorder, Enter to select.`}
                      tabIndex={0}
                      draggable
                      onDragStart={() => { dragIdx.current = i; }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); if (dragIdx.current !== null) reorderPages(dragIdx.current, i); dragIdx.current = null; }}
                      onClick={() => setActivePageIdx(i)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActivePageIdx(i); }
                        else if ((e.altKey || e.metaKey) && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
                          e.preventDefault();
                          movePage(i, e.key === "ArrowLeft" ? -1 : 1);
                        } else if (e.key === "ArrowLeft" && i > 0) {
                          e.preventDefault(); setActivePageIdx(i - 1);
                        } else if (e.key === "ArrowRight" && i < pages.length - 1) {
                          e.preventDefault(); setActivePageIdx(i + 1);
                        }
                      }}
                      title="Drag, or focus and press Alt + Arrow keys to reorder"
                      className={`focus:outline-none focus-visible:ring-2 focus-visible:ring-gold cursor-grab active:cursor-grabbing inline-flex items-center gap-1 text-xs pl-2 pr-1 py-1 rounded-full border ${i === activePageIdx ? "bg-gold text-gold-foreground border-gold" : "bg-card border-border/50 text-muted-foreground hover:text-foreground"}`}
                    >
                      <GripVertical className="w-3 h-3 opacity-60" aria-hidden />
                      <span>{i + 1}. {label}</span>
                      <button
                        type="button"
                        aria-label={`Move page ${i + 1} left`}
                        disabled={i === 0}
                        onClick={(e) => { e.stopPropagation(); movePage(i, -1); }}
                        className="ml-1 p-0.5 rounded hover:bg-background/30 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3 h-3 -rotate-90" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move page ${i + 1} right`}
                        disabled={i === pages.length - 1}
                        onClick={(e) => { e.stopPropagation(); movePage(i, 1); }}
                        className="p-0.5 rounded hover:bg-background/30 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3 h-3 -rotate-90" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => addPage("event")} className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Event
              </Button>
              <Button size="sm" variant="outline" onClick={() => addPage("back")} className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Back
              </Button>
              {pages.length > 1 && currentPage.kind !== "front" && (
                <Button size="sm" variant="ghost" onClick={() => removePage(activePageIdx)} className="h-7 text-xs text-destructive">
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
              <Button size="sm" variant={livePreview ? "gold" : "outline"} onClick={() => setLivePreview((v) => !v)} className="h-7 text-xs" aria-pressed={livePreview}>
                <Eye className="w-3 h-3 mr-1" /> PDF preview
              </Button>
            </div>
          </div>

          {livePreview && (
            <div className="w-full mb-4 rounded-lg border border-border/50 bg-card overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 bg-muted/40">
                <span className="text-xs font-medium">Live PDF preview {previewBuilding && "· updating…"}</span>
                <button onClick={() => setLivePreview(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close PDF preview">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              {pdfUrl ? (
                <iframe title="PDF preview" src={pdfUrl} className="w-full" style={{ height: 520, border: 0, background: "#f5f5f5" }} />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">Building preview…</div>
              )}
            </div>
          )}

          <div className="rounded-lg p-4 sm:p-8 bg-muted/30 w-full flex flex-col items-center">
            <div ref={cardRef}>
              <InvitationCardArtwork
                data={{
                  partner1: form.partner1 || "Partner One",
                  partner2: form.partner2 || "Partner Two",
                  date: form.date || "Date TBA",
                  time: form.time,
                  venue: form.venue || "Venue TBA",
                  message: form.message,
                  invitationLine: form.invitationLine,
                  photo: form.photo || undefined,
                }}
                theme={theme}
                width={460}
                page={currentPage}
                qrPosition={currentPage.showQr ? currentPage.qrPosition : "hidden"}
                qrSlot={
                  currentPage.showQr ? (
                    <QRCodeSVG value={siteUrl} size={84} level="H" bgColor="#ffffff" fgColor="#001F3F" />
                  ) : undefined
                }
              />
            </div>

            <p className="text-xs text-muted-foreground mt-4 font-body text-center max-w-md">
              5"×7" at 300 dpi · QR opens <span className="font-medium text-foreground break-all">{siteUrl}</span>
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Tabs defaultValue="template">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="template" className="text-xs">Template</TabsTrigger>
              <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
              <TabsTrigger value="page" className="text-xs">Page</TabsTrigger>
              <TabsTrigger value="style" className="text-xs"><PaletteIcon className="w-3 h-3" /></TabsTrigger>
              <TabsTrigger value="print" className="text-xs"><Printer className="w-3 h-3" /></TabsTrigger>
              <TabsTrigger value="saved" className="text-xs">Saved</TabsTrigger>
            </TabsList>

            {/* Template picker */}
            <TabsContent value="template" className="mt-3 space-y-3">
              <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as CardCategory)}>
                <TabsList className="grid grid-cols-2 gap-1 h-auto">
                  {(Object.keys(CATEGORY_LABELS) as CardCategory[]).map((c) => (
                    <TabsTrigger key={c} value={c} className="text-xs">{CATEGORY_LABELS[c]}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="grid grid-cols-2 gap-3">
                {visibleTemplates.map((t) => {
                  const tTheme = CARD_THEMES[t.slug];
                  const isSel = t.slug === selectedSlug;
                  const locked = t.is_premium && !isPremium;
                  return (
                    <button key={t.slug} onClick={() => { setSelectedSlug(t.slug); setThemeOverrides({}); }}
                      className={`relative rounded-lg border-2 overflow-hidden text-left transition-all ${isSel ? "border-gold shadow-md" : "border-border/50 hover:border-border"}`}>
                      <div className="aspect-[5/7] w-full flex items-center justify-center text-center p-2"
                        style={{ background: tTheme?.bg, color: tTheme?.ink, fontFamily: tTheme?.display }}>
                        <div>
                          <div style={{ fontSize: 14, fontStyle: "italic" }}>{form.partner1 || "Aarav"}</div>
                          <div style={{ fontSize: 10, color: tTheme?.accent, margin: "2px 0" }}>&amp;</div>
                          <div style={{ fontSize: 14, fontStyle: "italic" }}>{form.partner2 || "Meera"}</div>
                        </div>
                      </div>
                      <div className="px-2 py-1.5 bg-card border-t border-border/50 flex items-center justify-between">
                        <span className="text-xs font-body truncate">{t.name}</span>
                        {t.is_premium && <Lock className={`w-3 h-3 ${locked ? "text-muted-foreground" : "text-gold"}`} />}
                      </div>
                      {locked && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                          <Badge className="bg-gold text-gold-foreground">Premium</Badge>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {requiresUpgrade && (
                <div className="p-3 rounded-lg border border-gold/40 bg-gold/5 text-xs">
                  Premium template — upgrade to unlock download.
                  <Button size="sm" variant="gold" className="w-full mt-2" onClick={() => navigate("/pricing")}>Upgrade</Button>
                </div>
              )}
            </TabsContent>

            {/* Content (front-page fields + photo) */}
            <TabsContent value="content" className="mt-3 space-y-3 bg-card border border-border/50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Partner 1</Label><Input value={form.partner1} onChange={(e) => setForm({ ...form, partner1: e.target.value })} /></div>
                <div><Label className="text-xs">Partner 2</Label><Input value={form.partner2} onChange={(e) => setForm({ ...form, partner2: e.target.value })} /></div>
                <div><Label className="text-xs">Date</Label><Input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div><Label className="text-xs">Time</Label><Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
              </div>
              <div><Label className="text-xs">Venue</Label><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
              <div><Label className="text-xs">Invitation line</Label><Input value={form.invitationLine} onChange={(e) => setForm({ ...form, invitationLine: e.target.value })} /></div>
              <div><Label className="text-xs">Message / blessing</Label><Textarea rows={2} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>

              <div className="pt-2 border-t border-border/40">
                <Label className="text-xs flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Couple photo</Label>
                <div className="flex items-center gap-3 mt-1">
                  {form.photo ? (
                    <div className="relative">
                      <img src={form.photo} alt="Couple" className="w-14 h-14 rounded-full object-cover border border-border" />
                      <button onClick={() => setForm({ ...form, photo: "" })}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center">
                        <XIcon className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full border border-dashed border-border/60 flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                  <label className="text-xs">
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} />
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border/60 bg-background hover:bg-muted cursor-pointer">
                      <Upload className="w-3 h-3" /> {uploadingPhoto ? "Uploading…" : form.photo ? "Replace" : "Upload"}
                    </span>
                  </label>
                </div>
              </div>
            </TabsContent>

            {/* Per-page editor */}
            <TabsContent value="page" className="mt-3 space-y-3 bg-card border border-border/50 rounded-xl p-4">
              <div className="text-xs text-muted-foreground">Editing page {activePageIdx + 1} of {pages.length} · {currentPage.kind}</div>
              {currentPage.kind !== "front" && (
                <>
                  <div><Label className="text-xs">Title</Label><Input value={currentPage.title || ""} onChange={(e) => updatePage({ title: e.target.value })} /></div>
                  <div><Label className="text-xs">Subtitle</Label><Input value={currentPage.subtitle || ""} onChange={(e) => updatePage({ subtitle: e.target.value })} /></div>
                  <div><Label className="text-xs">Body</Label><Textarea rows={6} value={currentPage.body || ""} onChange={(e) => updatePage({ body: e.target.value })} /></div>
                </>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <Label className="text-xs">Show QR on this page</Label>
                <input type="checkbox" checked={currentPage.showQr} onChange={(e) => updatePage({ showQr: e.target.checked })} />
              </div>
              {currentPage.showQr && (
                <div>
                  <Label className="text-xs">QR position</Label>
                  <Select value={currentPage.qrPosition} onValueChange={(v) => updatePage({ qrPosition: v as QrPosition })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {QR_POSITIONS.filter((p) => p.value !== "hidden").map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>

            {/* Style: palette + fonts */}
            <TabsContent value="style" className="mt-3 space-y-4 bg-card border border-border/50 rounded-xl p-4">
              <div>
                <Label className="text-xs mb-2 block">Preset palettes</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_PALETTES.map((p) => (
                    <button key={p.label} onClick={() => setThemeOverrides((t) => ({ ...t, ...p.colors }))}
                      className="rounded-md border border-border/50 p-1.5 hover:border-gold text-left">
                      <div className="flex gap-1 mb-1">
                        {Object.values(p.colors).slice(0, 4).map((c, i) => (
                          <span key={i} className="w-3 h-3 rounded-full border border-border/30" style={{ background: c as string }} />
                        ))}
                      </div>
                      <span className="text-[10px] font-body text-muted-foreground">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {colorField("bg", "Background")}
                {colorField("panel", "Panel")}
                {colorField("ink", "Text")}
                {colorField("accent", "Accent")}
                {colorField("muted", "Muted")}
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border/40">
                <div>
                  <Label className="text-xs flex items-center gap-1"><TypeIcon className="w-3 h-3" /> Display font</Label>
                  <Select value={theme.display} onValueChange={(v) => setThemeOverrides((t) => ({ ...t, display: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DISPLAY_FONTS.map((f) => (
                        <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Body font</Label>
                  <Select value={theme.body} onValueChange={(v) => setThemeOverrides((t) => ({ ...t, body: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BODY_FONTS.map((f) => (
                        <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button variant="ghost" size="sm" className="w-full" onClick={() => setThemeOverrides({})}>
                Reset to template defaults
              </Button>
            </TabsContent>

            {/* Saved variants */}
            <TabsContent value="saved" className="mt-3 space-y-3 bg-card border border-border/50 rounded-xl p-4">
              <div className="flex items-end gap-2">
                <div className="flex-1"><Label className="text-xs">Design name</Label><Input value={variantName} onChange={(e) => setVariantName(e.target.value)} /></div>
                <Button onClick={saveVariant} size="sm" variant="gold"><Save className="w-3 h-3 mr-1" /> {variantId ? "Update" : "Save new"}</Button>
              </div>
              {variantId && (
                <Button size="sm" variant="outline" className="w-full" onClick={() => { setVariantId(null); setVariantName("My card"); toast({ title: "Started a new design" }); }}>
                  <Plus className="w-3 h-3 mr-1" /> New design
                </Button>
              )}
              <div className="space-y-2">
                {variants.length === 0 && <p className="text-xs text-muted-foreground">No saved designs yet. Customize and click Save.</p>}
                {variants.map((v) => (
                  <div key={v.id} className={`flex items-center justify-between gap-2 rounded-md border p-2 ${v.id === variantId ? "border-gold bg-gold/5" : "border-border/50"}`}>
                    <button onClick={() => loadVariant(v)} className="text-left flex-1 min-w-0 flex items-center gap-2">
                      <VariantThumb v={v} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{v.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{v.template_slug} · {(v.pages?.length ?? 1)} page{(v.pages?.length ?? 1) > 1 ? "s" : ""}</div>
                      </div>
                    </button>
                    <button onClick={() => deleteVariant(v.id)} className="text-destructive hover:opacity-80">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Print settings */}
            <TabsContent value="print" className="mt-3 space-y-3 bg-card border border-border/50 rounded-xl p-4">
              <div>
                <Label className="text-xs">Bleed</Label>
                <Select value={String(bleed)} onValueChange={(v) => setBleed(parseFloat(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BLEED_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Extends the background past the trim edge so press cuts don't show white slivers.
                </p>
              </div>
              <div>
                <Label className="text-xs">Safe margin</Label>
                <Select value={String(safeMargin)} onValueChange={(v) => setSafeMargin(parseFloat(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MARGIN_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Visual guide only — keeps important text away from the trim edge in preview.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <Label className="text-xs">Crop marks on PDF</Label>
                <input type="checkbox" checked={cropMarks} onChange={(e) => setCropMarks(e.target.checked)} />
              </div>
              <div className="text-[11px] text-muted-foreground rounded-md border border-border/40 p-2 bg-muted/30">
                Default page: <span className="font-medium text-foreground">{PAPER_SIZES[defaultPaper].label}</span><br />
                With bleed: <span className="font-medium text-foreground">{(PAPER_SIZES[defaultPaper].w + bleed * 2).toFixed(3)}" × {(PAPER_SIZES[defaultPaper].h + bleed * 2).toFixed(3)}"</span>
              </div>
            </TabsContent>
          </Tabs>

          {isPremium && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 text-gold" /> Premium plan — all templates unlocked.
            </div>
          )}
        </div>
      </div>

      {/* Hidden full-resolution export container (one node per page) */}
      <div
        ref={exportContainerRef}
        style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none", opacity: 0 }}
        aria-hidden
      >
        {pages.map((p) => <div key={p.id}>{renderPageNode(p)}</div>)}
      </div>
    </div>
  );
}