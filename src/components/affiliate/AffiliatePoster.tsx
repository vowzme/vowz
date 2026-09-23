import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Share2, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import vowzLogo from "@/assets/vowz-logo-full.png";

type PosterSize = "poster" | "square" | "story";

const SIZES: Record<PosterSize, { w: number; h: number; label: string }> = {
  poster: { w: 1240, h: 1754, label: "A4 poster (print)" },
  square: { w: 1080, h: 1080, label: "Square (social post)" },
  story: { w: 1080, h: 1920, label: "Story / status" },
};

const NAVY = "#001F3F";
const GOLD = "#D4AF37";
const IVORY = "#F5F5DC";

const FEATURES = [
  "Beautiful wedding website in minutes",
  "100+ premium designs to choose from",
  "Digital invitation cards — free to download",
  "RSVP on WhatsApp, guest list & reminders",
  "Photo album, budget & checklist included",
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

interface Props {
  referralLink: string;
  referralCode: string;
  couponCode?: string | null;
  shopName?: string | null;
  shopLogoUrl?: string | null;
  discountLine: string;
}

export default function AffiliatePoster({
  referralLink,
  referralCode,
  couponCode,
  shopName,
  shopLogoUrl,
  discountLine,
}: Props) {
  const [size, setSize] = useState<PosterSize>("poster");
  const [busy, setBusy] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const draw = async (canvas: HTMLCanvasElement) => {
    const { w, h } = SIZES[size];
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = w / 1240; // scale factor relative to the A4 design

    // Background
    ctx.fillStyle = NAVY;
    ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w / 2, h * 0.18, 10, w / 2, h * 0.18, w * 0.9);
    glow.addColorStop(0, "rgba(212,175,55,0.22)");
    glow.addColorStop(1, "rgba(0,31,63,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Gilt frame
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 4 * s;
    roundRect(ctx, 34 * s, 34 * s, w - 68 * s, h - 68 * s, 28 * s);
    ctx.stroke();
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1.5 * s;
    roundRect(ctx, 52 * s, 52 * s, w - 104 * s, h - 104 * s, 20 * s);
    ctx.stroke();
    ctx.globalAlpha = 1;

    let y = 150 * s;

    // Vowz logo
    try {
      const logo = await loadImage(vowzLogo);
      const lw = 360 * s;
      const lh = (logo.height / logo.width) * lw;
      // logo artwork is dark — draw it on a light plate for contrast
      ctx.fillStyle = IVORY;
      roundRect(ctx, (w - lw - 56 * s) / 2, y - 28 * s, lw + 56 * s, lh + 56 * s, 22 * s);
      ctx.fill();
      ctx.drawImage(logo, (w - lw) / 2, y, lw, lh);
      y += lh + 70 * s;
    } catch {
      y += 40 * s;
    }

    const center = (text: string, font: string, color: string, lineY: number) => {
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.fillText(text, w / 2, lineY);
    };

    center("WEDDING WEBSITES  ·  INVITATION CARDS", `${Math.round(26 * s)}px Inter, sans-serif`, GOLD, y);
    y += 76 * s;
    center("Your Wedding,", `700 ${Math.round(74 * s)}px Georgia, serif`, IVORY, y);
    y += 84 * s;
    center("Beautifully Online", `700 ${Math.round(74 * s)}px Georgia, serif`, GOLD, y);
    y += 66 * s;
    center("Try it free — no card needed", `${Math.round(32 * s)}px Inter, sans-serif`, "rgba(245,245,220,0.85)", y);
    y += 70 * s;

    // Features
    ctx.textAlign = "left";
    const fx = 200 * s;
    FEATURES.forEach((f) => {
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(fx - 26 * s, y - 9 * s, 7 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = IVORY;
      ctx.font = `${Math.round(29 * s)}px Inter, sans-serif`;
      ctx.fillText(f, fx, y);
      y += 52 * s;
    });

    y += 40 * s;

    // QR plate
    const qrCanvas = qrRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    const plate = 430 * s;
    const px = (w - plate) / 2;
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, px, y, plate, plate, 28 * s);
    ctx.fill();
    if (qrCanvas) {
      const pad = 34 * s;
      ctx.drawImage(qrCanvas, px + pad, y + pad, plate - pad * 2, plate - pad * 2);
    }
    y += plate + 62 * s;

    center("SCAN TO START FREE", `700 ${Math.round(34 * s)}px Inter, sans-serif`, GOLD, y);
    y += 50 * s;
    center(discountLine, `${Math.round(27 * s)}px Inter, sans-serif`, "rgba(245,245,220,0.9)", y);
    y += 48 * s;
    if (couponCode) {
      center(`Use code ${couponCode.toUpperCase()}`, `700 ${Math.round(30 * s)}px Inter, sans-serif`, IVORY, y);
      y += 48 * s;
    }

    // Shop footer
    const footerY = h - 110 * s;
    ctx.fillStyle = "rgba(212,175,55,0.35)";
    ctx.fillRect(140 * s, footerY - 70 * s, w - 280 * s, 1.5 * s);
    if (shopLogoUrl) {
      try {
        const sl = await loadImage(shopLogoUrl);
        const sh = 78 * s;
        const sw = Math.min((sl.width / sl.height) * sh, 300 * s);
        ctx.drawImage(sl, (w - sw) / 2, footerY - 58 * s, sw, sh);
      } catch {
        /* ignore logo load failure */
      }
    }
    center(
      shopName ? `Available at ${shopName}` : "www.vowz.me",
      `${Math.round(30 * s)}px Inter, sans-serif`,
      IVORY,
      footerY + 40 * s,
    );
    if (shopName) {
      center("www.vowz.me", `${Math.round(25 * s)}px Inter, sans-serif`, GOLD, footerY + 80 * s);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (previewRef.current) void draw(previewRef.current);
    }, 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, shopName, shopLogoUrl, couponCode, referralLink, discountLine]);

  const download = async () => {
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      await draw(canvas);
      const a = document.createElement("a");
      a.download = `vowz-poster-${referralCode}-${size}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      toast({ title: "Poster downloaded 🖼️", description: "Print it for your shop or share it online." });
    } catch {
      toast({ title: "Could not create the poster", variant: "destructive" });
    }
    setBusy(false);
  };

  const shareWhatsApp = () => {
    const text = `Planning a wedding? Create your wedding website & invitation cards on Vowz — free to try.\n${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* hidden QR source */}
      <div ref={qrRef} className="hidden">
        <QRCodeCanvas value={referralLink} size={640} level="H" includeMargin={false} />
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(SIZES) as PosterSize[]).map((k) => (
          <Button
            key={k}
            size="sm"
            variant={size === k ? "default" : "outline"}
            className="h-10 font-body text-xs"
            onClick={() => setSize(k)}
          >
            {SIZES[k].label}
          </Button>
        ))}
      </div>

      <div className="flex justify-center bg-muted/30 border border-border/40 rounded-2xl p-4">
        <canvas
          ref={previewRef}
          className="w-full max-w-[280px] h-auto rounded-xl shadow-elegant"
          aria-label="Vowz promotional poster preview"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="gold" className="h-11 font-body" onClick={download} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Download poster
        </Button>
        <Button variant="outline" className="h-11 font-body" onClick={shareWhatsApp}>
          <Share2 className="w-4 h-4 mr-2" /> Share on WhatsApp
        </Button>
      </div>
      <p className="text-xs text-muted-foreground font-body flex items-start gap-1.5">
        <ImageIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        Print the A4 poster for your counter, or share the square/story version on Instagram, Facebook and WhatsApp status.
        Every scan is tracked to your partner code.
      </p>
    </div>
  );
}
