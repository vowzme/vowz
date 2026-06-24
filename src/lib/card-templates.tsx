import { ReactNode } from "react";

export type CardCategory = "hindu_sikh" | "christian_muslim" | "modern_minimal" | "royal_traditional";

export interface CardTemplateMeta {
  slug: string;
  name: string;
  category: CardCategory;
  is_premium: boolean;
  is_enabled?: boolean;
  description?: string;
}

export interface CardTheme {
  bg: string;
  panel: string;
  ink: string;
  accent: string;
  muted: string;
  ornament: "mandala" | "cross" | "arch" | "damask" | "peacock" | "noir" | "editorial" | "sanskrit";
  display: string; // font-family
  body: string;
}

export type QrPosition = "bottom" | "bottom-left" | "bottom-right" | "top-right" | "hidden";

export type PaperSize = "5x7" | "6x9" | "a5" | "a6" | "letter";
export type PageScaling = "fit" | "fill" | "stretch";

export const PAPER_SIZES: Record<PaperSize, { label: string; w: number; h: number }> = {
  "5x7": { label: '5" × 7" (card)', w: 5, h: 7 },
  "6x9": { label: '6" × 9"', w: 6, h: 9 },
  a5: { label: "A5 (5.83 × 8.27)", w: 5.83, h: 8.27 },
  a6: { label: "A6 (4.13 × 5.83)", w: 4.13, h: 5.83 },
  letter: { label: 'US Letter (8.5 × 11)', w: 8.5, h: 11 },
};

export const DISPLAY_FONTS = [
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { label: "Cinzel", value: "'Cinzel', serif" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
  { label: "DM Serif Display", value: "'DM Serif Display', serif" },
] as const;

export const BODY_FONTS = [
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Lato", value: "'Lato', sans-serif" },
  { label: "Cormorant", value: "'Cormorant Garamond', serif" },
  { label: "Georgia", value: "Georgia, serif" },
] as const;

export const PRESET_PALETTES: { label: string; colors: Pick<CardTheme, "bg" | "panel" | "ink" | "accent" | "muted"> }[] = [
  { label: "Maroon & Gold", colors: { bg: "#4A0E11", panel: "#5B121A", ink: "#FFF1C9", accent: "#E5BB55", muted: "#D4AF37" } },
  { label: "Ivory & Blush", colors: { bg: "#FBF4EE", panel: "#FFFFFF", ink: "#3A2A24", accent: "#C49A86", muted: "#8E6F62" } },
  { label: "Emerald & Gold", colors: { bg: "#0F3D2E", panel: "#13533D", ink: "#F5EBC8", accent: "#D4AF37", muted: "#C9B98A" } },
  { label: "Noir & Gold", colors: { bg: "#111111", panel: "#181818", ink: "#F2EAD3", accent: "#D4AF37", muted: "#BFB69C" } },
  { label: "Cream & Sage", colors: { bg: "#F4EFE6", panel: "#FFFFFF", ink: "#1A1A1A", accent: "#7A8C6A", muted: "#6B6056" } },
  { label: "Navy & Champagne", colors: { bg: "#0E1B3A", panel: "#15244A", ink: "#F5E6C8", accent: "#D4AF37", muted: "#C8B98A" } },
];

export const CATEGORY_LABELS: Record<CardCategory, string> = {
  hindu_sikh: "Hindu & Sikh",
  christian_muslim: "Christian & Muslim",
  modern_minimal: "Modern / Minimal",
  royal_traditional: "Royal / Traditional",
};

// Built-in palette/ornament configs. The DB row controls availability + premium gating;
// rendering details live here so they can ship with the bundle.
export const CARD_THEMES: Record<string, CardTheme> = {
  "hindu-ganesha-classic": {
    bg: "#FBEFD6", panel: "#FFF8E7", ink: "#5B0E14", accent: "#B8860B", muted: "#8A5A1A",
    ornament: "mandala", display: "'Playfair Display', serif", body: "'Inter', sans-serif",
  },
  "hindu-royal-mandala": {
    bg: "#4A0E11", panel: "#5B121A", ink: "#FFF1C9", accent: "#E5BB55", muted: "#D4AF37",
    ornament: "sanskrit", display: "'Playfair Display', serif", body: "'Inter', sans-serif",
  },
  "christian-floral-cross": {
    bg: "#FBF4EE", panel: "#FFFFFF", ink: "#3A2A24", accent: "#C49A86", muted: "#8E6F62",
    ornament: "cross", display: "'Playfair Display', serif", body: "'Inter', sans-serif",
  },
  "muslim-emerald-arch": {
    bg: "#0F3D2E", panel: "#13533D", ink: "#F5EBC8", accent: "#D4AF37", muted: "#C9B98A",
    ornament: "arch", display: "'Playfair Display', serif", body: "'Inter', sans-serif",
  },
  "modern-typographic": {
    bg: "#F4EFE6", panel: "#FFFFFF", ink: "#1A1A1A", accent: "#7A6A4F", muted: "#6B6056",
    ornament: "editorial", display: "'Playfair Display', serif", body: "'Inter', sans-serif",
  },
  "modern-noir": {
    bg: "#111111", panel: "#181818", ink: "#F2EAD3", accent: "#D4AF37", muted: "#BFB69C",
    ornament: "noir", display: "'Playfair Display', serif", body: "'Inter', sans-serif",
  },
  "royal-peacock": {
    bg: "#5B0E14", panel: "#6E121B", ink: "#FFF1C9", accent: "#E5BB55", muted: "#D4AF37",
    ornament: "peacock", display: "'Playfair Display', serif", body: "'Inter', sans-serif",
  },
  "royal-velvet": {
    bg: "#3A0A18", panel: "#4A0E20", ink: "#F5E6C8", accent: "#D4AF37", muted: "#B89968",
    ornament: "damask", display: "'Playfair Display', serif", body: "'Inter', sans-serif",
  },
};

// Fallback list shown if DB is unreachable.
export const FALLBACK_TEMPLATES: CardTemplateMeta[] = [
  { slug: "hindu-ganesha-classic", name: "Ganesha Classic", category: "hindu_sikh", is_premium: false, description: "Maroon & gold with mandala border" },
  { slug: "hindu-royal-mandala", name: "Royal Mandala", category: "hindu_sikh", is_premium: true, description: "Deep red palette with gold mandala" },
  { slug: "christian-floral-cross", name: "Floral Cross", category: "christian_muslim", is_premium: false, description: "Ivory & blush with floral cross" },
  { slug: "muslim-emerald-arch", name: "Emerald Arch", category: "christian_muslim", is_premium: true, description: "Islamic geometric arch, emerald & gold" },
  { slug: "modern-typographic", name: "Modern Typographic", category: "modern_minimal", is_premium: false, description: "Editorial typography on cream" },
  { slug: "modern-noir", name: "Noir Minimal", category: "modern_minimal", is_premium: true, description: "Charcoal palette with gold accents" },
  { slug: "royal-peacock", name: "Royal Peacock", category: "royal_traditional", is_premium: true, description: "Maroon & gold with peacock crown" },
  { slug: "royal-velvet", name: "Velvet Damask", category: "royal_traditional", is_premium: true, description: "Wine velvet with damask gold ornament" },
];

// ─── SVG ornaments ────────────────────────────────────────────────
function Ornament({ kind, color, size = 90 }: { kind: CardTheme["ornament"]; color: string; size?: number }) {
  const c = color;
  switch (kind) {
    case "mandala":
    case "sanskrit":
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke={c} strokeWidth={0.7}>
          <circle cx="50" cy="50" r="48" />
          <circle cx="50" cy="50" r="44" strokeWidth={0.4} />
          {Array.from({ length: 24 }).map((_, i) => (
            <line key={`a${i}`} x1="50" y1="6" x2="50" y2="12" transform={`rotate(${i * 15} 50 50)`} strokeWidth={0.6} />
          ))}
          <circle cx="50" cy="50" r="34" strokeDasharray="1 2" />
          {Array.from({ length: 12 }).map((_, i) => (
            <path key={`p${i}`} d="M50 16 Q54 26 50 34 Q46 26 50 16 Z" transform={`rotate(${i * 30} 50 50)`} fill={c} opacity={0.85} stroke="none" />
          ))}
          <circle cx="50" cy="50" r="22" />
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={`d${i}`} cx="50" cy="28" r="1.2" fill={c} stroke="none" transform={`rotate(${i * 45} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="10" />
          <circle cx="50" cy="50" r="4" fill={c} stroke="none" />
        </svg>
      );
    case "cross":
      return (
        <svg viewBox="0 0 100 110" width={size} height={size * 1.1} fill="none" stroke={c} strokeWidth={0.8}>
          <path d="M50 6 C58 20 70 24 70 36 C70 46 60 50 50 50 C40 50 30 46 30 36 C30 24 42 20 50 6 Z" opacity={0.7} />
          <line x1="50" y1="20" x2="50" y2="92" strokeWidth={1.1} />
          <line x1="28" y1="44" x2="72" y2="44" strokeWidth={1.1} />
          <circle cx="50" cy="44" r="3.5" fill={c} stroke="none" />
          <path d="M22 78 Q35 96 50 88 Q65 96 78 78" strokeWidth={0.8} />
          <path d="M30 82 Q40 92 50 85 Q60 92 70 82" strokeWidth={0.5} />
          {[28, 72].map((x) => <circle key={x} cx={x} cy={44} r="1.2" fill={c} stroke="none" />)}
        </svg>
      );
    case "arch":
      return (
        <svg viewBox="0 0 100 120" width={size} height={size * 1.2} fill="none" stroke={c} strokeWidth={0.8}>
          <path d="M10 118 V58 Q50 0 90 58 V118" strokeWidth={1.1} />
          <path d="M18 118 V62 Q50 10 82 62 V118" strokeWidth={0.5} />
          <path d="M26 118 V64 Q50 22 74 64 V118" strokeDasharray="1 2" />
          {/* eight-point geometric star */}
          <g transform="translate(50 56)">
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={i} x1="0" y1="-12" x2="0" y2="12" transform={`rotate(${i * 22.5})`} strokeWidth={0.6} />
            ))}
            <circle r="6" />
            <circle r="2" fill={c} stroke="none" />
          </g>
          {/* hanging lamp */}
          <line x1="50" y1="68" x2="50" y2="92" />
          <circle cx="50" cy="96" r="3.5" fill={c} stroke="none" />
        </svg>
      );
    case "peacock":
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke={c} strokeWidth={0.7}>
          {Array.from({ length: 11 }).map((_, i) => {
            const a = (i - 5) * 14;
            return (
              <g key={i} transform={`rotate(${a} 50 70)`}>
                <ellipse cx="50" cy="34" rx="5" ry="24" />
                <ellipse cx="50" cy="22" rx="3" ry="5" fill={c} stroke="none" opacity={0.9} />
                <circle cx="50" cy="22" r="1.2" fill={c} stroke="none" opacity={0.4} />
              </g>
            );
          })}
          <path d="M40 70 Q50 60 60 70 Q50 78 40 70 Z" fill={c} stroke="none" />
          <circle cx="50" cy="72" r="2.5" fill={c} stroke="none" />
          <path d="M50 74 Q46 82 44 90" strokeWidth={0.6} />
          <path d="M50 74 Q54 82 56 90" strokeWidth={0.6} />
        </svg>
      );
    case "damask":
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke={c} strokeWidth={0.6}>
          <path d="M50 4 C62 18 84 22 80 42 C76 60 60 56 50 72 C40 56 24 60 20 42 C16 22 38 18 50 4 Z" fill={c} opacity={0.9} stroke="none" />
          <path d="M50 14 C58 24 72 26 70 40 C68 52 58 50 50 62 C42 50 32 52 30 40 C28 26 42 24 50 14 Z" fill={"#FBF4EE"} opacity={0.18} stroke="none" />
          <path d="M50 76 Q56 84 50 96 Q44 84 50 76 Z" fill={c} stroke="none" />
          <circle cx="50" cy="42" r="3.5" fill="none" strokeWidth={0.8} />
          <circle cx="50" cy="42" r="1.2" fill={c} stroke="none" />
        </svg>
      );
    case "noir":
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke={c} strokeWidth={0.6}>
          <rect x="14" y="14" width="72" height="72" />
          <rect x="20" y="20" width="60" height="60" strokeDasharray="0.5 2.5" />
          <line x1="50" y1="18" x2="50" y2="36" />
          <line x1="50" y1="64" x2="50" y2="82" />
          <line x1="18" y1="50" x2="36" y2="50" />
          <line x1="64" y1="50" x2="82" y2="50" />
          <circle cx="50" cy="50" r="14" />
          <circle cx="50" cy="50" r="3" fill={c} stroke="none" />
        </svg>
      );
    case "editorial":
    default:
      return (
        <svg viewBox="0 0 200 24" width={size * 2.2} height={26} stroke={c} strokeWidth={0.7} fill="none">
          <line x1="0" y1="12" x2="78" y2="12" />
          <line x1="0" y1="15" x2="78" y2="15" strokeWidth={0.3} />
          <path d="M86 12 L94 6 L102 12 L94 18 Z" fill={c} stroke="none" />
          <circle cx="110" cy="12" r="2.2" fill={c} stroke="none" />
          <path d="M118 12 L110 6" strokeWidth={0.3} />
          <line x1="122" y1="12" x2="200" y2="12" />
          <line x1="122" y1="15" x2="200" y2="15" strokeWidth={0.3} />
        </svg>
      );
  }
}

// Decorative corner flourish — placed in each corner of the inner gold frame.
function CornerFlourish({ color, size = 36, rotate = 0 }: { color: string; size?: number; rotate?: number }) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} fill="none" stroke={color} strokeWidth={0.7}
      style={{ transform: `rotate(${rotate}deg)`, transformOrigin: "center" }}>
      <path d="M2 2 L40 2" />
      <path d="M2 2 L2 40" />
      <path d="M2 2 L18 18" strokeWidth={0.4} />
      <path d="M8 2 Q22 6 22 16 Q22 22 16 22 Q6 22 2 8" />
      <circle cx="22" cy="22" r="1.6" fill={color} stroke="none" />
      <path d="M2 14 Q10 18 14 26" strokeWidth={0.4} />
    </svg>
  );
}

// Couple monogram — initials joined by an italic ampersand inside a thin gold roundel.
function Monogram({ a, b, color, ink, family, size = 64 }: { a: string; b: string; color: string; ink: string; family: string; size?: number }) {
  const i1 = (a || "").trim().charAt(0).toUpperCase() || "A";
  const i2 = (b || "").trim().charAt(0).toUpperCase() || "B";
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth={0.6} />
      <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth={0.3} />
      {Array.from({ length: 24 }).map((_, i) => (
        <line key={i} x1="50" y1="6" x2="50" y2="9" stroke={color} strokeWidth={0.4} transform={`rotate(${i * 15} 50 50)`} />
      ))}
      <text x="30" y="62" fontSize="34" fontFamily={family} fontStyle="italic" fill={ink} textAnchor="middle">{i1}</text>
      <text x="50" y="58" fontSize="22" fontFamily={family} fontStyle="italic" fill={color} textAnchor="middle">&amp;</text>
      <text x="70" y="62" fontSize="34" fontFamily={family} fontStyle="italic" fill={ink} textAnchor="middle">{i2}</text>
    </svg>
  );
}

// ─── The card itself ──────────────────────────────────────────────
export interface CardData {
  partner1: string;
  partner2: string;
  date: string;
  time?: string;
  venue: string;
  message?: string;
  invitationLine?: string;
  qrSlot?: ReactNode;
  photo?: string;
}

export interface PageContent {
  id: string;
  kind: "front" | "event" | "back";
  title?: string;
  subtitle?: string;
  body?: string;
  showQr: boolean;
  qrPosition: QrPosition;
  // Per-page export controls (optional — fall back to variant defaults)
  paperSize?: PaperSize;
  scaling?: PageScaling;
  cropMarks?: boolean;
}

export function InvitationCardArtwork({
  data,
  theme,
  width = 500,
  page,
  qrSlot,
  qrPosition = "bottom",
}: {
  data: CardData;
  theme: CardTheme;
  width?: number;
  page?: PageContent;
  qrSlot?: ReactNode;
  qrPosition?: QrPosition;
}) {
  const height = Math.round(width * 1.4); // 5:7
  const pad = Math.round(width * 0.07);
  const kind = page?.kind ?? "front";
  const qrAnchorStyle: Record<QrPosition, React.CSSProperties> = {
    bottom: { position: "absolute", left: 0, right: 0, bottom: pad * 0.7, display: "flex", justifyContent: "center" },
    "bottom-left": { position: "absolute", left: pad * 0.8, bottom: pad * 0.7 },
    "bottom-right": { position: "absolute", right: pad * 0.8, bottom: pad * 0.7 },
    "top-right": { position: "absolute", right: pad * 0.8, top: pad * 0.8 },
    hidden: { display: "none" },
  };
  return (
    <div
      style={{
        width,
        height,
        background: theme.bg,
        color: theme.ink,
        fontFamily: theme.body,
        position: "relative",
        boxShadow: "0 18px 50px -20px rgba(0,0,0,0.35)",
        overflow: "hidden",
      }}
    >
      {/* Inner panel + border */}
      <div
        style={{
          position: "absolute",
          inset: pad * 0.6,
          background: theme.panel,
          border: `1px solid ${theme.accent}55`,
          outline: `1px solid ${theme.accent}33`,
          outlineOffset: 6,
        }}
      />
      <div
        style={{
          position: "relative",
          padding: pad,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Top ornament */}
        <div style={{ marginTop: pad * 0.2 }}>
          <Ornament kind={theme.ornament} color={theme.accent} size={width * 0.18} />
        </div>

        {kind === "front" ? (
          <>
            {data.photo && (
              <div
                style={{
                  marginTop: pad * 0.5,
                  width: width * 0.32,
                  height: width * 0.32,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: `3px solid ${theme.accent}`,
                  boxShadow: `0 0 0 4px ${theme.panel}`,
                }}
              >
                <img
                  src={data.photo}
                  alt="Couple"
                  crossOrigin="anonymous"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}

            <p
              style={{
                marginTop: pad * 0.5,
                fontFamily: theme.body,
                color: theme.muted,
                letterSpacing: 4,
                fontSize: width * 0.024,
                textTransform: "uppercase",
              }}
            >
              {data.invitationLine || "Together with their families"}
            </p>

            <h1 style={{ fontFamily: theme.display, fontSize: width * 0.095, lineHeight: 1.05, margin: `${pad * 0.4}px 0 0`, color: theme.ink, fontStyle: "italic" }}>
              {data.partner1}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: `${pad * 0.25}px 0`, width: "70%" }}>
              <span style={{ flex: 1, height: 1, background: theme.accent }} />
              <span style={{ fontFamily: theme.display, color: theme.accent, fontSize: width * 0.06 }}>&amp;</span>
              <span style={{ flex: 1, height: 1, background: theme.accent }} />
            </div>
            <h1 style={{ fontFamily: theme.display, fontSize: width * 0.095, lineHeight: 1.05, margin: 0, color: theme.ink, fontStyle: "italic" }}>
              {data.partner2}
            </h1>

            <div style={{ marginTop: pad * 0.8, fontFamily: theme.body, color: theme.ink }}>
              <div style={{ fontSize: width * 0.04, letterSpacing: 2, textTransform: "uppercase" }}>{data.date}</div>
              {data.time && (
                <div style={{ fontSize: width * 0.028, color: theme.muted, marginTop: 4, letterSpacing: 1 }}>{data.time}</div>
              )}
              <div style={{ fontSize: width * 0.028, color: theme.muted, marginTop: 8, maxWidth: width * 0.78 }}>{data.venue}</div>
            </div>

            {data.message && (
              <p style={{ marginTop: pad * 0.5, fontFamily: theme.display, fontStyle: "italic", color: theme.muted, fontSize: width * 0.026, maxWidth: width * 0.78, lineHeight: 1.5 }}>
                “{data.message}”
              </p>
            )}
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: theme.display, fontSize: width * 0.075, margin: `${pad * 0.5}px 0 0`, color: theme.ink, fontStyle: "italic" }}>
              {page?.title || "Event"}
            </h2>
            {page?.subtitle && (
              <p style={{ marginTop: pad * 0.25, color: theme.muted, fontSize: width * 0.028, letterSpacing: 2, textTransform: "uppercase" }}>
                {page.subtitle}
              </p>
            )}
            <div style={{ width: "60%", height: 1, background: theme.accent, margin: `${pad * 0.5}px 0` }} />
            <p style={{ fontSize: width * 0.028, color: theme.ink, lineHeight: 1.7, whiteSpace: "pre-wrap", maxWidth: width * 0.82 }}>
              {page?.body || ""}
            </p>
          </>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ marginTop: pad * 0.3 }}>
          <Ornament kind={theme.ornament} color={theme.accent} size={width * 0.1} />
        </div>

        {/* Absolutely-positioned QR overlay */}
        {qrSlot && qrPosition !== "hidden" && (
          <div style={qrAnchorStyle[qrPosition]}>
            <div
              style={{
                background: "#fff",
                padding: 6,
                borderRadius: 4,
                border: `1px solid ${theme.accent}55`,
                display: "inline-block",
              }}
            >
              {qrSlot}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}