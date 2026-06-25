import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import {
  CARD_THEMES,
  CATEGORY_LABELS,
  FALLBACK_TEMPLATES,
  InvitationCardArtwork,
  type CardData,
  type CardTemplateMeta,
} from "@/lib/card-templates";
import { exportTemplateToPdf } from "@/lib/template-pdf-export";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, ImageIcon, FileText, Eye, ArrowLeft, Lock } from "lucide-react";
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
  const [active, setActive] = useState<CardTemplateMeta | null>(null);
  const [mode, setMode] = useState<"image" | "pdf" | "offline">("image");
  const [busy, setBusy] = useState(false);

  const templates = useMemo(
    () => FALLBACK_TEMPLATES.filter((t) => CARD_THEMES[t.slug]),
    [],
  );

  async function handleDownloadImage(tpl: CardTemplateMeta) {
    const theme = CARD_THEMES[tpl.slug];
    if (!theme) return;
    setBusy(true);
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
      await exportTemplateToPdf(
        { slug: tpl.slug, name: tpl.name, data: SAMPLE },
        "print",
        "card",
        "high",
      );
      toast.success("PDF downloaded");
    } catch {
      toast.error("PDF export failed");
    } finally {
      setBusy(false);
    }
  }

  if (active) {
    const theme = CARD_THEMES[active.slug];
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
                  {active.is_premium && (
                    <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />Premium</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{CATEGORY_LABELS[active.category]}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {active.description && (
                  <p className="text-sm">{active.description}</p>
                )}

                <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="image"><ImageIcon className="h-3.5 w-3.5 mr-1" />Image</TabsTrigger>
                    <TabsTrigger value="pdf"><FileText className="h-3.5 w-3.5 mr-1" />PDF</TabsTrigger>
                    <TabsTrigger value="offline"><Eye className="h-3.5 w-3.5 mr-1" />Offline</TabsTrigger>
                  </TabsList>
                </Tabs>

                {mode === "image" && (
                  <Button disabled={busy} className="w-full" onClick={() => handleDownloadImage(active)}>
                    <Download className="h-4 w-4 mr-2" /> Download PNG
                  </Button>
                )}
                {mode === "pdf" && (
                  <Button disabled={busy} className="w-full" onClick={() => handleDownloadPdf(active)}>
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                  </Button>
                )}
                {mode === "offline" && (
                  <div className="text-sm text-muted-foreground">
                    This preview works fully offline — no network required. You're already viewing the offline-ready render on the left.
                  </div>
                )}

                <Button variant="outline" className="w-full" onClick={() => navigate(`/card-gallery?template=${active.slug}`)}>
                  Use this template
                </Button>
              </CardContent>
            </Card>
          </div>
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
            Browse templates and preview them as image, PDF, or offline card.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {templates.map((tpl) => {
            const theme = CARD_THEMES[tpl.slug];
            return (
              <Card
                key={tpl.slug}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActive(tpl)}
              >
                <div className="bg-muted/30 p-3 flex justify-center">
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
      </div>
    </Layout>
  );
}