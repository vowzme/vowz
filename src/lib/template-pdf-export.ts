import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { InvitationCardArtwork, CARD_THEMES, type CardTheme } from "@/lib/card-templates";

export type PdfMode = "phone" | "print";
export type PdfPaper = "card" | "a4" | "letter";

export interface ExportInput {
  slug: string;
  name: string;
  data: Parameters<typeof InvitationCardArtwork>[0]["data"];
  theme?: CardTheme;
}

/**
 * Renders the invitation artwork to an off-screen DOM node, snapshots it
 * with html2canvas, and emits a single-page PDF.
 *
 * - phone: 4×6 in (postcard-ish, fits phone screen previews)
 * - print: 5×7 in with 0.25" bleed + corner crop marks
 */
export async function exportTemplateToPdf({
  slug, name, data, theme,
}: ExportInput, mode: PdfMode = "print", paper: PdfPaper = "card"): Promise<void> {
  const themeToUse = theme ?? CARD_THEMES[slug];
  if (!themeToUse) throw new Error("Template theme not found");

  // Render artwork as static HTML inside an off-screen host so html2canvas can paint it.
  const ARTWORK_WIDTH = 1200; // px, high-res source
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = `${ARTWORK_WIDTH}px`;
  host.style.background = "#ffffff";
  host.innerHTML = renderToStaticMarkup(
    createElement(InvitationCardArtwork, { data, theme: themeToUse, width: ARTWORK_WIDTH }),
  );
  document.body.appendChild(host);

  try {
    // Wait a tick so fonts / images settle
    await new Promise((r) => setTimeout(r, 60));
    // scale=3 ≈ 300dpi at our artwork width — sharp crop marks & text in print.
    const canvas = await html2canvas(host, {
      backgroundColor: "#ffffff",
      scale: 3,
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // Trim sizes by paper choice. "card" keeps the original postcard/5x7 look,
    // "a4" and "letter" produce full standard sheets with margins.
    const cropOn = mode === "print";
    const bleed = cropOn ? 0.125 : 0;
    const margin = 0.4; // inches, for A4/Letter sheets
    const sizes: Record<PdfPaper, { w: number; h: number }> = {
      card: mode === "phone" ? { w: 4, h: 6 } : { w: 5, h: 7 },
      a4: { w: 8.27, h: 11.69 },
      letter: { w: 8.5, h: 11 },
    };
    const trim = sizes[paper];
    const cfg = { w: trim.w, h: trim.h, bleed, crop: cropOn };

    const pageW = cfg.w + cfg.bleed * 2;
    const pageH = cfg.h + cfg.bleed * 2;
    const pdf = new jsPDF({ unit: "in", format: [pageW, pageH], orientation: pageW > pageH ? "landscape" : "portrait" });

    // Fit artwork into the trim area, centered
    const trimW = cfg.w;
    const trimH = cfg.h;
    const aspect = canvas.width / canvas.height;
    let drawW = trimW, drawH = trimW / aspect;
    if (drawH > trimH) { drawH = trimH; drawW = trimH * aspect; }
    const x = cfg.bleed + (trimW - drawW) / 2;
    const y = cfg.bleed + (trimH - drawH) / 2;
    pdf.addImage(imgData, "JPEG", x, y, drawW, drawH, undefined, "FAST");

    if (cfg.crop) {
      // Draw crop marks at the four trim corners
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.006);
      const len = 0.18; // mark length in inches
      const off = 0.04; // gap from trim
      const trimX0 = cfg.bleed, trimY0 = cfg.bleed;
      const trimX1 = cfg.bleed + trimW, trimY1 = cfg.bleed + trimH;
      // TL
      pdf.line(trimX0 - off - len, trimY0, trimX0 - off, trimY0);
      pdf.line(trimX0, trimY0 - off - len, trimX0, trimY0 - off);
      // TR
      pdf.line(trimX1 + off, trimY0, trimX1 + off + len, trimY0);
      pdf.line(trimX1, trimY0 - off - len, trimX1, trimY0 - off);
      // BL
      pdf.line(trimX0 - off - len, trimY1, trimX0 - off, trimY1);
      pdf.line(trimX0, trimY1 + off, trimX0, trimY1 + off + len);
      // BR
      pdf.line(trimX1 + off, trimY1, trimX1 + off + len, trimY1);
      pdf.line(trimX1, trimY1 + off, trimX1, trimY1 + off + len);
    }

    const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    pdf.save(`${safeName || slug}-${mode}.pdf`);
  } finally {
    host.remove();
  }
}