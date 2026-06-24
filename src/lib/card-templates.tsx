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
        <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke={c} strokeWidth={1.2}>
          <circle cx="50" cy="50" r="46" />
          <circle cx="50" cy="50" r="34" strokeDasharray="2 3" />
          <circle cx="50" cy="50" r="22" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1="50" y1="6" x2="50" y2="20"
              transform={`rotate(${i * 30} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="8" fill={c} />
        </svg>
      );
    case "cross":
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke={c} strokeWidth={1.5}>
          <line x1="50" y1="15" x2="50" y2="85" />
          <line x1="25" y1="42" x2="75" y2="42" />
          <circle cx="50" cy="50" r="40" strokeDasharray="3 5" />
          <path d="M30 65 Q50 80 70 65" />
        </svg>
      );
    case "arch":
      return (
        <svg viewBox="0 0 100 120" width={size} height={size * 1.2} fill="none" stroke={c} strokeWidth={1.4}>
          <path d="M15 115 V55 Q50 5 85 55 V115" />
          <path d="M25 115 V60 Q50 20 75 60 V115" strokeDasharray="2 3" />
          <circle cx="50" cy="50" r="3" fill={c} />
        </svg>
      );
    case "peacock":
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke={c} strokeWidth={1.2}>
          {Array.from({ length: 7 }).map((_, i) => (
            <ellipse key={i} cx="50" cy="35" rx="6" ry="22"
              transform={`rotate(${(i - 3) * 18} 50 55)`} />
          ))}
          <circle cx="50" cy="65" r="6" fill={c} />
        </svg>
      );
    case "damask":
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} fill={c} opacity={0.85}>
          <path d="M50 8 C58 24 78 24 78 42 C78 58 58 60 50 76 C42 60 22 58 22 42 C22 24 42 24 50 8 Z" />
          <circle cx="50" cy="50" r="4" fill="none" stroke={c} strokeWidth={1.5} />
        </svg>
      );
    case "noir":
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke={c} strokeWidth={1}>
          <rect x="15" y="15" width="70" height="70" />
          <rect x="25" y="25" width="50" height="50" />
          <circle cx="50" cy="50" r="3" fill={c} />
        </svg>
      );
    case "editorial":
    default:
      return (
        <svg viewBox="0 0 120 20" width={size * 2} height={20} stroke={c} strokeWidth={1}>
          <line x1="0" y1="10" x2="50" y2="10" />
          <circle cx="60" cy="10" r="3" fill={c} stroke="none" />
          <line x1="70" y1="10" x2="120" y2="10" />
        </svg>
      );
  }
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