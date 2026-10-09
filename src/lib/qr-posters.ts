import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";

export const QR_BASE_URL = "https://vowz.me/q/";
export const qrUrl = (code: string) => `${QR_BASE_URL}${code}`;

export type QrDesign = { id: string; name: string; bg: string; fg: string; accent: string; font: string; headline: string; sub: string };

export const QR_DESIGNS: QrDesign[] = [
  { id: "qr-only", name: "QR only", bg: "#ffffff", fg: "#000000", accent: "#000000", font: "Inter, sans-serif", headline: "", sub: "" },
  { id: "royal-gold", name: "Royal Gold", bg: "#001F3F", fg: "#001F3F", accent: "#D4AF37", font: "'Playfair Display', serif", headline: "Your Wedding Website & E‑Invite", sub: "Scan to create yours in minutes · WhatsApp RSVP · 250+ themes" },
  { id: "floral-blush", name: "Floral Blush", bg: "#FBEDEE", fg: "#6B2737", accent: "#C76B7E", font: "'Playfair Display', serif", headline: "Digital Wedding Invitations", sub: "Scan for an exclusive discount on Vowz" },
  { id: "emerald", name: "Emerald Palace", bg: "#0F3D33", fg: "#0F3D33", accent: "#E9C46A", font: "'Playfair Display', serif", headline: "Invite Everyone on WhatsApp", sub: "Beautiful wedding sites & cards · Scan to start" },
  { id: "modern-mono", name: "Modern Mono", bg: "#F5F5F0", fg: "#111111", accent: "#111111", font: "Inter, sans-serif", headline: "Wedding website. Done.", sub: "Scan · Pick a theme · Share with guests" },
];

export const getDesign = (id: string) => QR_DESIGNS.find((d) => d.id === id) ?? QR_DESIGNS[0];

function qrSvg(code: string, fg: string, size: number) {
  return renderToStaticMarkup(createElement(QRCodeSVG, { value: qrUrl(code), size, level: "H", fgColor: fg, bgColor: "#ffffff", marginSize: 2 }));
}

const escapeHtml = (v: string) =>
  String(v).replace(/[&<>"'`]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" })[c] as string);

function tile(rawCode: string, d: QrDesign, rawShop?: string) {
  const code = escapeHtml(rawCode);
  const shop = rawShop ? escapeHtml(rawShop) : "";
  if (d.id === "qr-only") {
    return `<div class="tile plain">${qrSvg(rawCode, d.fg, 200)}<div class="code">${code}</div></div>`;
  }
  return `<div class="tile poster" style="background:${d.bg};font-family:${d.font};border-color:${d.accent}">
    <div class="brand" style="color:${d.accent}">VOWZ.ME</div>
    <h2 style="color:${d.id === "floral-blush" || d.id === "modern-mono" ? d.fg : "#fff"}">${d.headline}</h2>
    <div class="qrbox" style="border-color:${d.accent}">${qrSvg(rawCode, d.fg, 260)}</div>
    <p style="color:${d.id === "floral-blush" || d.id === "modern-mono" ? d.fg : "#f5f5dc"}">${d.sub}</p>
    ${shop ? `<div class="shop" style="color:${d.accent}">${shop}</div>` : ""}
    <div class="code" style="color:${d.accent}">${code}</div>
  </div>`;
}

/** Opens a print window with the given codes, each in its design. */
export function printQrCodes(items: { code: string; design: string; shop?: string }[]) {
  const w = window.open("", "_blank");
  if (!w) return false;
  const anyPoster = items.some((i) => i.design !== "qr-only");
  w.document.write(`<!doctype html><html><head><title>Vowz QR codes</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:10mm}body{margin:0;font-family:Inter,sans-serif}
.grid{display:grid;grid-template-columns:repeat(${anyPoster ? 2 : 3},1fr);gap:8mm}
.tile{break-inside:avoid;text-align:center}
.plain{border:1px dashed #bbb;padding:6mm}
.poster{border:3px solid;border-radius:6mm;padding:8mm 6mm;min-height:125mm;display:flex;flex-direction:column;align-items:center;justify-content:space-between}
.brand{letter-spacing:.3em;font-weight:600;font-size:11pt}
h2{font-size:17pt;margin:3mm 0;line-height:1.2}
.qrbox{background:#fff;padding:3mm;border:2px solid;border-radius:3mm;line-height:0}
p{font-size:9.5pt;margin:3mm 0}.shop{font-weight:700;font-size:12pt}
.code{font-family:monospace;font-size:10pt;margin-top:2mm;letter-spacing:.1em}
*{-webkit-print-color-adjust:exact;print-color-adjust:exact}
</style></head><body><div class="grid">${items.map((i) => tile(i.code, getDesign(i.design), i.shop)).join("")}</div>
<script>window.onload=()=>setTimeout(()=>window.print(),400)</script></body></html>`);
  w.document.close();
  return true;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newQrCode() {
  const a = new Uint32Array(6);
  crypto.getRandomValues(a);
  return "VZ" + Array.from(a, (n) => ALPHABET[n % ALPHABET.length]).join("");
}

/** Extracts a QR code id from a scanned URL or raw text. */
export function parseScanned(text: string): string | null {
  const m = text.match(/\/q\/([A-Z0-9]+)/i) || text.trim().match(/^(VZ[A-Z0-9]{6})$/i);
  return m ? m[1].toUpperCase() : null;
}
