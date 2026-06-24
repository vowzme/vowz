import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ArrowLeft, Download, Lock, FileImage, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import SEOHead from "@/components/SEOHead";
import {
  CARD_THEMES,
  CATEGORY_LABELS,
  CardCategory,
  CardTemplateMeta,
  FALLBACK_TEMPLATES,
  InvitationCardArtwork,
} from "@/lib/card-templates";

export default function InvitationCard() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);

  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<CardTemplateMeta[]>(FALLBACK_TEMPLATES);
  const [isPremium, setIsPremium] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CardCategory>("hindu_sikh");
  const [selectedSlug, setSelectedSlug] = useState<string>("hindu-ganesha-classic");
  const [exporting, setExporting] = useState<null | "png" | "pdf">(null);

  const [form, setForm] = useState({
    partner1: "",
    partner2: "",
    date: "",
    time: "",
    venue: "",
    message: "",
    invitationLine: "Together with their families",
  });

  useEffect(() => {
    (async () => {
      if (!user || !siteId) return;
      setLoading(true);
      const { data: s } = await supabase
        .from("wedding_sites")
        .select("*")
        .eq("id", siteId)
        .maybeSingle();
      if (s) {
        setSite(s);
        const sec = (s.sections as any[]) || [];
        const hero = sec.find((x: any) => x.type === "hero")?.content || {};
        const events = sec.find((x: any) => x.type === "events")?.content?.events || [];
        const first = events[0] || {};
        setForm({
          partner1: s.partner1 || "",
          partner2: s.partner2 || "",
          date: first.date || hero.weddingDate || "",
          time: first.time || "",
          venue: first.venue || first.location || "",
          message: s.tagline || "",
          invitationLine: "Together with their families",
        });
      }

      // premium check
      const { data: sub } = await (supabase as any)
        .from("user_subscriptions")
        .select("plan,status,expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      if (sub && (!sub.expires_at || new Date(sub.expires_at) > new Date())) {
        setIsPremium(["premium", "premium_6mo", "premium_yearly"].includes(sub.plan));
      }

      // templates
      const { data: tpl } = await (supabase as any)
        .from("card_templates")
        .select("slug,name,category,is_premium,is_enabled,description")
        .eq("is_enabled", true)
        .order("sort_order");
      if (tpl && tpl.length) setTemplates(tpl as any);
      setLoading(false);
    })();
  }, [user, siteId]);

  const visibleTemplates = useMemo(
    () => templates.filter((t) => t.category === activeCategory),
    [templates, activeCategory]
  );

  const selected = templates.find((t) => t.slug === selectedSlug) ?? templates[0];
  const theme = CARD_THEMES[selectedSlug] ?? CARD_THEMES["hindu-ganesha-classic"];

  const siteUrl = site?.slug
    ? `${window.location.origin}/site/${site.slug}`
    : `${window.location.origin}/`;

  const requiresUpgrade = selected?.is_premium && !isPremium;

  const handleExport = async (type: "png" | "pdf") => {
    if (!cardRef.current) return;
    if (requiresUpgrade) {
      toast({
        title: "Premium template",
        description: "Upgrade to premium to download this design.",
        variant: "destructive",
      });
      return;
    }
    try {
      setExporting(type);
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
      });
      const filename = `${(site?.partner1 || "wedding").replace(/\s+/g, "-")}-${(site?.partner2 || "card").replace(/\s+/g, "-")}-invitation`;
      if (type === "png") {
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = `${filename}.png`;
        a.click();
      } else {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ unit: "in", format: [5, 7], orientation: "portrait" });
        pdf.addImage(imgData, "PNG", 0, 0, 5, 7, undefined, "FAST");
        pdf.save(`${filename}.pdf`);
      }
      toast({ title: `Downloaded ${type.toUpperCase()}`, description: "Your invitation card is ready to share or print." });
    } catch (e: any) {
      toast({ title: "Download failed", description: e.message, variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Invitation Card – Vowz" description="Design and download your wedding invitation card with QR code." robots="noindex, nofollow" />
      <header className="h-14 border-b border-border/50 bg-card/90 backdrop-blur-sm flex items-center px-3 sm:px-4 gap-2 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg font-semibold">Invitation Card</h1>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => handleExport("png")} disabled={!!exporting || requiresUpgrade}>
          <FileImage className="w-4 h-4 mr-1" /> PNG
        </Button>
        <Button variant="gold" size="sm" onClick={() => handleExport("pdf")} disabled={!!exporting || requiresUpgrade}>
          <FileText className="w-4 h-4 mr-1" /> PDF
        </Button>
      </header>

      <div className="grid lg:grid-cols-[1fr_460px] gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Preview */}
        <div className="flex flex-col items-center">
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
                  qrSlot: (
                    <QRCodeSVG
                      value={siteUrl}
                      size={100}
                      level="H"
                      bgColor="#ffffff"
                      fgColor="#001F3F"
                    />
                  ),
                }}
                theme={theme}
                width={460}
              />
            </div>

            <p className="text-xs text-muted-foreground mt-4 font-body text-center max-w-md">
              Card prints at 5"×7" (300 dpi). The QR code links guests to{" "}
              <span className="font-medium text-foreground break-all">{siteUrl}</span>.
            </p>
          </div>

          <div className="flex gap-2 mt-4 lg:hidden">
            <Button variant="outline" size="sm" onClick={() => handleExport("png")} disabled={!!exporting || requiresUpgrade}>
              <Download className="w-4 h-4 mr-1" /> PNG
            </Button>
            <Button variant="gold" size="sm" onClick={() => handleExport("pdf")} disabled={!!exporting || requiresUpgrade}>
              <Download className="w-4 h-4 mr-1" /> PDF
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Templates */}
          <div className="bg-card border border-border/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-semibold">Choose a template</h2>
              {isPremium ? (
                <Badge className="bg-gold/20 text-gold border-gold/30"><Sparkles className="w-3 h-3 mr-1" /> Premium</Badge>
              ) : (
                <Badge variant="outline">Free plan</Badge>
              )}
            </div>
            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as CardCategory)}>
              <TabsList className="grid grid-cols-2 gap-1 h-auto">
                {(Object.keys(CATEGORY_LABELS) as CardCategory[]).map((c) => (
                  <TabsTrigger key={c} value={c} className="text-xs">
                    {CATEGORY_LABELS[c]}
                  </TabsTrigger>
                ))}
              </TabsList>
              {(Object.keys(CATEGORY_LABELS) as CardCategory[]).map((c) => (
                <TabsContent key={c} value={c} className="mt-3">
                  <div className="grid grid-cols-2 gap-3">
                    {visibleTemplates.map((t) => {
                      const tTheme = CARD_THEMES[t.slug];
                      const isSel = t.slug === selectedSlug;
                      const locked = t.is_premium && !isPremium;
                      return (
                        <button
                          key={t.slug}
                          onClick={() => setSelectedSlug(t.slug)}
                          className={`relative rounded-lg border-2 overflow-hidden text-left transition-all ${
                            isSel ? "border-gold shadow-md" : "border-border/50 hover:border-border"
                          }`}
                        >
                          <div
                            className="aspect-[5/7] w-full flex items-center justify-center text-center p-2"
                            style={{ background: tTheme?.bg, color: tTheme?.ink, fontFamily: tTheme?.display }}
                          >
                            <div>
                              <div style={{ fontSize: 14, fontStyle: "italic" }}>
                                {form.partner1 || "Aarav"}
                              </div>
                              <div style={{ fontSize: 10, color: tTheme?.accent, margin: "2px 0" }}>&amp;</div>
                              <div style={{ fontSize: 14, fontStyle: "italic" }}>
                                {form.partner2 || "Meera"}
                              </div>
                            </div>
                          </div>
                          <div className="px-2 py-1.5 bg-card border-t border-border/50 flex items-center justify-between">
                            <span className="text-xs font-body truncate">{t.name}</span>
                            {t.is_premium && (
                              <Lock className={`w-3 h-3 ${locked ? "text-muted-foreground" : "text-gold"}`} />
                            )}
                          </div>
                          {locked && (
                            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                              <Badge className="bg-gold text-gold-foreground">Premium</Badge>
                            </div>
                          )}
                        </button>
                      );
                    })}
                    {visibleTemplates.length === 0 && (
                      <p className="text-xs text-muted-foreground col-span-2">No templates in this category yet.</p>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {requiresUpgrade && (
              <div className="mt-3 p-3 rounded-lg border border-gold/40 bg-gold/5 text-xs">
                This is a premium template. Upgrade your plan to download it.
                <Button size="sm" variant="gold" className="w-full mt-2" onClick={() => navigate("/pricing")}>
                  Upgrade to Premium
                </Button>
              </div>
            )}
          </div>

          {/* Edit fields */}
          <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
            <h2 className="font-display text-base font-semibold">Edit card</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Partner 1</Label>
                <Input value={form.partner1} onChange={(e) => setForm({ ...form, partner1: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Partner 2</Label>
                <Input value={form.partner2} onChange={(e) => setForm({ ...form, partner2: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input placeholder="June 12, 2026" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Time</Label>
                <Input placeholder="6:00 PM onwards" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Venue</Label>
              <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Invitation line</Label>
              <Input value={form.invitationLine} onChange={(e) => setForm({ ...form, invitationLine: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Message / blessing</Label>
              <Textarea rows={2} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <p className="text-xs text-muted-foreground">
              QR code points to your published site URL — scanning opens the full online invitation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}