import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface QRCodeGeneratorProps {
  url: string;
  coupleNames: string;
  isPremium?: boolean;
  accent?: string;
}

export default function QRCodeGenerator({ url, coupleNames, isPremium, accent = "#D4AF37" }: QRCodeGeneratorProps) {
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [fgColor, setFgColor] = useState("#001F3F");
  const svgRef = useRef<HTMLDivElement>(null);

  const downloadPNG = () => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 1024, 1024);
      const a = document.createElement("a");
      a.download = `${coupleNames.replace(/\s+/g, "-")}-wedding-qr.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  };

  const downloadSVG = () => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.download = `${coupleNames.replace(/\s+/g, "-")}-wedding-qr.svg`;
    a.href = URL.createObjectURL(blob);
    a.click();
  };

  const copyImage = async () => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 1024, 1024);
      const data = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
      });
      ctx.drawImage(img, 0, 0, 1024, 1024);
      const blob: Blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b as Blob), "image/png")
      );
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast({ title: "QR image copied! 📋", description: "Paste it into any app or chat." });
    } catch {
      toast({ title: "Copy not supported", description: "Use Download PNG instead.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <QrCode className="w-5 h-5 text-gold" />
        <h3 className="font-display text-base font-semibold text-foreground">QR Code for Physical Invites</h3>
      </div>

      <div className="flex justify-center" ref={svgRef}>
        <QRCodeSVG
          value={url}
          size={200}
          bgColor={bgColor}
          fgColor={fgColor}
          level="H"
          imageSettings={{
            src: "/favicon.png",
            height: 40,
            width: 40,
            excavate: true,
          }}
        />
      </div>

      {isPremium && (
        <div className="flex gap-2 justify-center">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-body text-muted-foreground">BG</label>
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-6 h-6 rounded border border-border cursor-pointer" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-body text-muted-foreground">QR</label>
            <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-6 h-6 rounded border border-border cursor-pointer" />
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-center">
        <Button variant="outline" size="sm" className="font-body text-xs" onClick={copyImage}>
          <Copy className="w-3.5 h-3.5 mr-1" /> Copy
        </Button>
        <Button variant="outline" size="sm" className="font-body text-xs" onClick={downloadPNG}>
          <Download className="w-3.5 h-3.5 mr-1" /> PNG
        </Button>
        <Button variant="outline" size="sm" className="font-body text-xs" onClick={downloadSVG}>
          <Download className="w-3.5 h-3.5 mr-1" /> SVG
        </Button>
      </div>

      <p className="text-xs text-muted-foreground font-body text-center">
        Print this QR on save-the-dates or place cards
      </p>
    </div>
  );
}
