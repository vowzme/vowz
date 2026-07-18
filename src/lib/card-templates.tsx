import { ReactNode } from "react";

export type CardCategory = "hindu_sikh" | "christian_muslim" | "modern_minimal" | "royal_traditional";

export interface CardTemplateMeta {
  slug: string;
  name: string;
  category: CardCategory;
  is_premium: boolean;
  is_enabled?: boolean;
  description?: string;
  occasion?: Occasion;
}

// ─── Occasion taxonomy ─────────────────────────────────────────────
// Covers the full wedding-journey. Each template can belong to one occasion
// (defaults to "wedding" when not set). Occasion-specific templates are
// generated below by combining base themes with occasion-tuned copy.
export type Occasion =
  | "save_the_date"
  | "betrothal"
  | "engagement"
  | "mehendi_haldi"
  | "sangeet"
  | "nikah"
  | "wedding"
  | "reception"
  | "anniversary";

export const OCCASIONS: Occasion[] = [
  "save_the_date",
  "betrothal",
  "engagement",
  "mehendi_haldi",
  "sangeet",
  "nikah",
  "wedding",
  "reception",
  "anniversary",
];

export const OCCASION_LABELS: Record<Occasion, string> = {
  save_the_date: "Save the Date",
  betrothal: "Betrothal / Roka",
  engagement: "Engagement",
  mehendi_haldi: "Mehendi & Haldi",
  sangeet: "Sangeet",
  nikah: "Nikah",
  wedding: "Wedding",
  reception: "Reception",
  anniversary: "Anniversary",
};

export interface OccasionCopy {
  invitationLine: string;
  message: string;
  headline: string; // small short label, e.g. "Save the Date"
}
export const OCCASION_COPY: Record<Occasion, OccasionCopy> = {
  save_the_date: { headline: "Save the Date", invitationLine: "Mark your calendars", message: "We're getting married — full invitation to follow." },
  betrothal:     { headline: "Roka · Betrothal", invitationLine: "With the blessings of our families", message: "Join us as we mark the beginning of our journey together." },
  engagement:    { headline: "Engagement", invitationLine: "Together with their families", message: "Request the pleasure of your company at their ring ceremony." },
  mehendi_haldi: { headline: "Mehendi · Haldi", invitationLine: "An afternoon of color & blessings", message: "Bring your laughter — and wear something bright." },
  sangeet:       { headline: "Sangeet Night", invitationLine: "A night of music & dance", message: "Come celebrate with songs, dance and laughter." },
  nikah:         { headline: "Nikah", invitationLine: "By the grace of the Almighty", message: "We invite you to witness our Nikah and share in our joy." },
  wedding:       { headline: "Wedding", invitationLine: "Together with their families", message: "Request the pleasure of your company as they begin their forever." },
  reception:     { headline: "Reception", invitationLine: "Join us in celebration", message: "Dinner, dance and a toast to the newlyweds." },
  anniversary:   { headline: "Anniversary", invitationLine: "Celebrating another year of love", message: "Join us as we celebrate another beautiful chapter." },
};

// QR options for the card (used by CardTemplatesPreview and the editor).
export type QrMode = "platform" | "custom" | "none";
export interface QrOptions {
  mode: QrMode;
  url?: string;             // for "platform": couple/site URL
  imageDataUrl?: string;    // for "custom": uploaded PNG/JPG
  position: QrPosition;
  size: number;             // px, render size on a 1200-px artwork
  label?: string;
}
export const DEFAULT_QR: QrOptions = {
  mode: "none",
  position: "bottom-right",
  size: 110,
};

export interface CardTheme {
  bg: string;
  panel: string;
  ink: string;
  accent: string;
  muted: string;
  ornament: "mandala" | "cross" | "arch" | "damask" | "peacock" | "noir" | "editorial" | "sanskrit";
  display: string; // font-family
  body: string;
  // Photo framing
  photoShape?: "circle" | "rounded" | "square" | "arch" | "oval";
  photoAspect?: "1:1" | "4:5" | "3:4" | "16:9";
  photoRadius?: number; // px corner radius when shape = "rounded"
  // Typography hierarchy
  headingLetterSpacing?: number;
  bodyLetterSpacing?: number;
  headingScale?: number; // multiplier on h1/h2 font-size
  // QR + RSVP block styling
  qrStyle?: QrStyle;      // frame preset for the QR badge
  qrCaption?: string;     // e.g. "Scan to RSVP" — small caption under the QR
  qrFg?: string;          // QR module color (overrides preset)
  qrBg?: string;          // QR background color (overrides preset)
}

// ─── QR + RSVP block styling ────────────────────────────────────────
export type QrStyle = "classic" | "framed" | "rounded" | "ticket" | "ribbon" | "minimal" | "noir";
export interface QrStylePreset {
  id: QrStyle;
  label: string;
  description: string;
  // How the badge around the QR is drawn — colors resolve against theme.
  frame: "square" | "rounded" | "circle" | "ticket" | "ribbon" | "none";
  padding: number;         // px
  borderWidth: number;     // px
  borderStyle: "solid" | "dashed" | "double" | "none";
  useAccentBorder: boolean;
  captionUppercase: boolean;
  captionSerif: boolean;   // caption in display serif vs body sans
  defaultCaption: string;
}
export const QR_STYLE_PRESETS: QrStylePreset[] = [
  { id: "classic",  label: "Classic",       description: "Thin accent border, clean caption",
    frame: "square",  padding: 6,  borderWidth: 1, borderStyle: "solid",  useAccentBorder: true,  captionUppercase: true,  captionSerif: false, defaultCaption: "Scan to RSVP" },
  { id: "framed",   label: "Framed",        description: "Double accent frame, editorial",
    frame: "square",  padding: 10, borderWidth: 3, borderStyle: "double", useAccentBorder: true,  captionUppercase: true,  captionSerif: true,  defaultCaption: "Scan · RSVP · Reply by return" },
  { id: "rounded",  label: "Rounded card",  description: "Soft rounded badge",
    frame: "rounded", padding: 10, borderWidth: 1, borderStyle: "solid",  useAccentBorder: true,  captionUppercase: false, captionSerif: true,  defaultCaption: "Scan to reply" },
  { id: "ticket",   label: "Ticket stub",   description: "Punched-ticket look",
    frame: "ticket",  padding: 12, borderWidth: 1, borderStyle: "dashed", useAccentBorder: true,  captionUppercase: true,  captionSerif: false, defaultCaption: "Admit · Scan to RSVP" },
  { id: "ribbon",   label: "Ribbon caption",description: "Accent ribbon banner beneath QR",
    frame: "rounded", padding: 8,  borderWidth: 0, borderStyle: "none",   useAccentBorder: false, captionUppercase: true,  captionSerif: true,  defaultCaption: "R S V P" },
  { id: "minimal",  label: "Minimal",       description: "No border, quiet caption",
    frame: "none",    padding: 4,  borderWidth: 0, borderStyle: "none",   useAccentBorder: false, captionUppercase: false, captionSerif: false, defaultCaption: "Scan to RSVP" },
  { id: "noir",     label: "Noir gold",     description: "Dark card with gold rim (cinematic)",
    frame: "rounded", padding: 12, borderWidth: 2, borderStyle: "solid",  useAccentBorder: true,  captionUppercase: true,  captionSerif: true,  defaultCaption: "Scan · RSVP" },
];
export const getQrStylePreset = (id?: QrStyle): QrStylePreset =>
  QR_STYLE_PRESETS.find((p) => p.id === id) ?? QR_STYLE_PRESETS[0];

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

// ─── Typography presets (international wedding-stationery look) ─────
export interface TypographyPreset {
  id: string;
  label: string;
  description: string;
  display: string;
  body: string;
  headingLetterSpacing: number;
  bodyLetterSpacing: number;
  headingScale: number;
}
export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
  { id: "editorial-classic", label: "Editorial Classic", description: "Playfair + Inter, balanced",
    display: "'Playfair Display', serif", body: "'Inter', sans-serif",
    headingLetterSpacing: 0.5, bodyLetterSpacing: 6, headingScale: 1.0 },
  { id: "romantic-script", label: "Romantic Script", description: "Great Vibes display + Lato",
    display: "'Great Vibes', cursive", body: "'Lato', sans-serif",
    headingLetterSpacing: 0, bodyLetterSpacing: 4, headingScale: 1.25 },
  { id: "modern-roman", label: "Modern Roman", description: "Cinzel caps + Inter",
    display: "'Cinzel', serif", body: "'Inter', sans-serif",
    headingLetterSpacing: 4, bodyLetterSpacing: 5, headingScale: 0.85 },
  { id: "luxe-couture", label: "Luxe Couture", description: "DM Serif Display + Cormorant",
    display: "'DM Serif Display', serif", body: "'Cormorant Garamond', serif",
    headingLetterSpacing: 1, bodyLetterSpacing: 8, headingScale: 1.05 },
  { id: "soft-quiet", label: "Soft & Quiet", description: "Cormorant display + Inter",
    display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif",
    headingLetterSpacing: 2, bodyLetterSpacing: 3, headingScale: 0.95 },
];

// ─── Photo framing options ──────────────────────────────────────────
export const PHOTO_SHAPES: { value: NonNullable<CardTheme["photoShape"]>; label: string }[] = [
  { value: "circle", label: "Circle" },
  { value: "oval", label: "Oval portrait" },
  { value: "rounded", label: "Rounded square" },
  { value: "square", label: "Sharp square" },
  { value: "arch", label: "Cathedral arch" },
];
export const PHOTO_ASPECTS: { value: NonNullable<CardTheme["photoAspect"]>; label: string; ratio: number }[] = [
  { value: "1:1", label: "Square (1:1)", ratio: 1 },
  { value: "4:5", label: "Portrait (4:5)", ratio: 4 / 5 },
  { value: "3:4", label: "Tall (3:4)", ratio: 3 / 4 },
  { value: "16:9", label: "Wide (16:9)", ratio: 16 / 9 },
];

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

// ─── Gallery facets: searchable tags, orientation, and layout focus ──
export type TemplateOrientation = "portrait" | "landscape" | "square";
export type TemplateFocus = "photo-first" | "text-first" | "ornament-first";
export interface TemplateFacets {
  tags: string[];            // free-text style tags for search/filter
  orientation: TemplateOrientation;
  focus: TemplateFocus;
}
export const TEMPLATE_FACETS: Record<string, TemplateFacets> = {
  "hindu-ganesha-classic":  { tags: ["traditional", "mandala", "warm", "gold"],        orientation: "portrait", focus: "ornament-first" },
  "hindu-royal-mandala":    { tags: ["traditional", "royal", "mandala", "maroon"],     orientation: "portrait", focus: "ornament-first" },
  "christian-floral-cross": { tags: ["floral", "soft", "ivory", "classic"],            orientation: "portrait", focus: "text-first" },
  "muslim-emerald-arch":    { tags: ["geometric", "arch", "emerald", "gold"],          orientation: "portrait", focus: "ornament-first" },
  "modern-typographic":     { tags: ["minimal", "editorial", "modern"],                orientation: "portrait", focus: "text-first" },
  "modern-noir":            { tags: ["minimal", "dark", "luxe", "modern"],             orientation: "portrait", focus: "photo-first" },
  "royal-peacock":          { tags: ["royal", "peacock", "ornate", "maroon"],          orientation: "portrait", focus: "photo-first" },
  "royal-velvet":           { tags: ["royal", "damask", "velvet", "luxe"],             orientation: "portrait", focus: "ornament-first" },
};
// Computed after NEW_PREMIUM_TEMPLATES merge below.
export let ALL_TEMPLATE_TAGS: string[] = [];
export const ORIENTATION_LABELS: Record<TemplateOrientation, string> = {
  portrait: "Portrait", landscape: "Landscape", square: "Square",
};
export const FOCUS_LABELS: Record<TemplateFocus, string> = {
  "photo-first": "Photo-first",
  "text-first": "Text-first",
  "ornament-first": "Ornament-first",
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

// ─── 25 Premium International Templates ─────────────────────────────
// Reuses the eight built-in ornaments with a wide palette range.
interface NewTpl {
  slug: string; name: string; category: CardCategory; description: string;
  theme: CardTheme; facets: TemplateFacets;
}
const NEW_PREMIUM_TEMPLATES: NewTpl[] = [
  // Hindu / Sikh (8)
  { slug: "hindu-saffron-marigold", name: "Saffron Marigold", category: "hindu_sikh", description: "Saffron + ivory with mandala motif",
    theme: { bg: "#FFF1D6", panel: "#FFFAEC", ink: "#7A2410", accent: "#D97706", muted: "#9A4A1A", ornament: "mandala", display: "'Playfair Display', serif", body: "'Inter', sans-serif", photoShape: "circle", photoAspect: "1:1" },
    facets: { tags: ["traditional", "saffron", "mandala", "warm"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "hindu-sindoor-rose", name: "Sindoor Rose", category: "hindu_sikh", description: "Crimson + rose-gold mandala",
    theme: { bg: "#5C0A1A", panel: "#6E0F22", ink: "#FFE8D6", accent: "#E5A07A", muted: "#D88A6E", ornament: "mandala", display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif", photoShape: "oval", photoAspect: "4:5" },
    facets: { tags: ["royal", "crimson", "mandala", "rose-gold"], orientation: "portrait", focus: "photo-first" } },
  { slug: "sikh-anand-karaj", name: "Anand Karaj", category: "hindu_sikh", description: "Kesari & navy with sacred geometry",
    theme: { bg: "#0B1E3C", panel: "#13294F", ink: "#FFE7B0", accent: "#E1A23B", muted: "#C68F38", ornament: "sanskrit", display: "'Cinzel', serif", body: "'Inter', sans-serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["traditional", "navy", "geometric", "gold"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "hindu-om-ivory", name: "Om Ivory", category: "hindu_sikh", description: "Ivory + soft gold, light & airy",
    theme: { bg: "#FAF5EB", panel: "#FFFFFF", ink: "#3F2A1B", accent: "#B8860B", muted: "#8A6E45", ornament: "sanskrit", display: "'Playfair Display', serif", body: "'Cormorant Garamond', serif", photoShape: "circle", photoAspect: "1:1" },
    facets: { tags: ["minimal", "ivory", "soft", "gold"], orientation: "portrait", focus: "text-first" } },
  { slug: "hindu-jaipur-pink", name: "Jaipur Pink", category: "hindu_sikh", description: "Hot pink palace tones with mandala",
    theme: { bg: "#A6135C", panel: "#B91D6B", ink: "#FFF1C9", accent: "#F5C26B", muted: "#F2B27A", ornament: "mandala", display: "'Playfair Display', serif", body: "'Lato', sans-serif", photoShape: "rounded", photoAspect: "1:1", photoRadius: 24 },
    facets: { tags: ["royal", "pink", "mandala", "vibrant"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "hindu-banarasi-silk", name: "Banarasi Silk", category: "hindu_sikh", description: "Wine silk with gold zari damask",
    theme: { bg: "#4A0A24", panel: "#5C0E2B", ink: "#FFE8C7", accent: "#D4AF37", muted: "#B89968", ornament: "damask", display: "'Playfair Display', serif", body: "'Cormorant Garamond', serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["royal", "silk", "damask", "wine"], orientation: "portrait", focus: "photo-first" } },
  { slug: "hindu-mehendi-green", name: "Mehendi Garden", category: "hindu_sikh", description: "Olive green + gold with peacock",
    theme: { bg: "#2A3A1A", panel: "#36481F", ink: "#F0E6C2", accent: "#D4AF37", muted: "#B0A36A", ornament: "peacock", display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif", photoShape: "circle", photoAspect: "1:1" },
    facets: { tags: ["traditional", "green", "peacock", "garden"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "hindu-kalash-cream", name: "Kalash Cream", category: "hindu_sikh", description: "Cream + terracotta with sacred motif",
    theme: { bg: "#F3E7CF", panel: "#FBF3DE", ink: "#5C2A14", accent: "#C76E3B", muted: "#9A553A", ornament: "mandala", display: "'Playfair Display', serif", body: "'Inter', sans-serif", photoShape: "oval", photoAspect: "4:5" },
    facets: { tags: ["warm", "cream", "terracotta", "mandala"], orientation: "portrait", focus: "text-first" } },

  // Christian / Muslim (6)
  { slug: "chapel-rose", name: "Chapel Rose", category: "christian_muslim", description: "Blush + ivory with floral cross",
    theme: { bg: "#FBEDE7", panel: "#FFFFFF", ink: "#4A2B2B", accent: "#C49A86", muted: "#9F7967", ornament: "cross", display: "'Playfair Display', serif", body: "'Inter', sans-serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["soft", "blush", "cross", "romantic"], orientation: "portrait", focus: "photo-first" } },
  { slug: "sacred-dove", name: "Sacred Dove", category: "christian_muslim", description: "Pale sage + cream with editorial trim",
    theme: { bg: "#EFEDE3", panel: "#FBFAF3", ink: "#2C3A2A", accent: "#7A8C6A", muted: "#5E6E58", ornament: "cross", display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif", photoShape: "circle", photoAspect: "1:1" },
    facets: { tags: ["minimal", "sage", "cross", "soft"], orientation: "portrait", focus: "text-first" } },
  { slug: "lace-pearl", name: "Lace & Pearl", category: "christian_muslim", description: "Pearl white with delicate damask",
    theme: { bg: "#F6F1EA", panel: "#FFFFFF", ink: "#2E2A26", accent: "#A8895C", muted: "#7E6B4F", ornament: "damask", display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif", photoShape: "rounded", photoAspect: "4:5", photoRadius: 14 },
    facets: { tags: ["minimal", "pearl", "lace", "luxe"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "mehrab-gold", name: "Mehrab Gold", category: "christian_muslim", description: "Deep teal arch with gold geometry",
    theme: { bg: "#0E2E2C", panel: "#15403D", ink: "#F2E6BD", accent: "#D4AF37", muted: "#C2A572", ornament: "arch", display: "'Cinzel', serif", body: "'Inter', sans-serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["geometric", "teal", "arch", "gold"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "henna-noir", name: "Henna Noir", category: "christian_muslim", description: "Charcoal with copper Islamic motifs",
    theme: { bg: "#161311", panel: "#1F1A17", ink: "#F2D9B5", accent: "#C57E3F", muted: "#A06A38", ornament: "arch", display: "'DM Serif Display', serif", body: "'Inter', sans-serif", photoShape: "rounded", photoAspect: "1:1", photoRadius: 8 },
    facets: { tags: ["dark", "luxe", "copper", "arch"], orientation: "portrait", focus: "photo-first" } },
  { slug: "crescent-ivory", name: "Crescent Ivory", category: "christian_muslim", description: "Ivory + emerald accent, refined",
    theme: { bg: "#F4EFE3", panel: "#FFFFFF", ink: "#173B30", accent: "#1F6B4E", muted: "#3D7A5E", ornament: "arch", display: "'Playfair Display', serif", body: "'Inter', sans-serif", photoShape: "oval", photoAspect: "4:5" },
    facets: { tags: ["minimal", "ivory", "emerald", "arch"], orientation: "portrait", focus: "text-first" } },

  // Modern / Minimal (6)
  { slug: "paris-blanc", name: "Paris Blanc", category: "modern_minimal", description: "Editorial all-white with hairline rules",
    theme: { bg: "#FFFFFF", panel: "#FAFAF7", ink: "#1A1A1A", accent: "#8A7A56", muted: "#6E6452", ornament: "editorial", display: "'DM Serif Display', serif", body: "'Inter', sans-serif", photoShape: "square", photoAspect: "1:1", headingLetterSpacing: 1.5 },
    facets: { tags: ["minimal", "editorial", "white", "modern"], orientation: "portrait", focus: "text-first" } },
  { slug: "scandi-mist", name: "Scandi Mist", category: "modern_minimal", description: "Cool grey-blue with quiet typography",
    theme: { bg: "#EDEFF1", panel: "#F8F9FA", ink: "#1E2A35", accent: "#5C7B8C", muted: "#7C8B96", ornament: "noir", display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif", photoShape: "rounded", photoAspect: "4:5", photoRadius: 4 },
    facets: { tags: ["minimal", "cool", "modern", "scandi"], orientation: "portrait", focus: "text-first" } },
  { slug: "tokyo-ink", name: "Tokyo Ink", category: "modern_minimal", description: "Cream with sumi-ink black accents",
    theme: { bg: "#F4EFE6", panel: "#FFFFFF", ink: "#0C0C0C", accent: "#0C0C0C", muted: "#3A3A3A", ornament: "editorial", display: "'Cinzel', serif", body: "'Inter', sans-serif", photoShape: "square", photoAspect: "1:1", headingLetterSpacing: 4 },
    facets: { tags: ["minimal", "editorial", "modern", "monochrome"], orientation: "portrait", focus: "text-first" } },
  { slug: "monaco-marble", name: "Monaco Marble", category: "modern_minimal", description: "Soft marble cream with gold accents",
    theme: { bg: "#F2EDE3", panel: "#FBF7EE", ink: "#2A241D", accent: "#B8860B", muted: "#7E6A48", ornament: "editorial", display: "'Playfair Display', serif", body: "'Cormorant Garamond', serif", photoShape: "rounded", photoAspect: "4:5", photoRadius: 12 },
    facets: { tags: ["luxe", "marble", "modern", "gold"], orientation: "portrait", focus: "photo-first" } },
  { slug: "atelier-sand", name: "Atelier Sand", category: "modern_minimal", description: "Warm sand neutrals, gallery-style",
    theme: { bg: "#E8DFD0", panel: "#F2EBDB", ink: "#3A2D20", accent: "#9C7A4A", muted: "#7A6147", ornament: "editorial", display: "'DM Serif Display', serif", body: "'Inter', sans-serif", photoShape: "square", photoAspect: "4:5" },
    facets: { tags: ["minimal", "sand", "modern", "editorial"], orientation: "portrait", focus: "photo-first" } },
  { slug: "copenhagen-rose", name: "Copenhagen Rose", category: "modern_minimal", description: "Dusty rose with thin serif type",
    theme: { bg: "#EFDCD6", panel: "#FBEFEA", ink: "#3A1F1F", accent: "#9C5A53", muted: "#7E4B47", ornament: "editorial", display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif", photoShape: "circle", photoAspect: "1:1" },
    facets: { tags: ["soft", "rose", "modern", "romantic"], orientation: "portrait", focus: "text-first" } },

  // Royal / Traditional (5)
  { slug: "mughal-court", name: "Mughal Court", category: "royal_traditional", description: "Indigo + gold mehrab arch grandeur",
    theme: { bg: "#13204A", panel: "#1B2C5E", ink: "#F5E6C8", accent: "#E1B84B", muted: "#C8A148", ornament: "arch", display: "'Cinzel', serif", body: "'Cormorant Garamond', serif", photoShape: "arch", photoAspect: "3:4", headingScale: 1.05 },
    facets: { tags: ["royal", "indigo", "arch", "gold"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "venetian-rouge", name: "Venetian Rouge", category: "royal_traditional", description: "Rich red velvet with damask filigree",
    theme: { bg: "#5A0E1B", panel: "#6E1224", ink: "#F8E3B8", accent: "#E0B654", muted: "#C49A4A", ornament: "damask", display: "'DM Serif Display', serif", body: "'Cormorant Garamond', serif", photoShape: "oval", photoAspect: "4:5", headingScale: 1.05 },
    facets: { tags: ["royal", "red", "damask", "velvet"], orientation: "portrait", focus: "photo-first" } },
  { slug: "hyderabad-nawab", name: "Hyderabad Nawab", category: "royal_traditional", description: "Forest green + antique gold peacock",
    theme: { bg: "#142D24", panel: "#1B3C30", ink: "#F2E2B8", accent: "#D4AF37", muted: "#B89968", ornament: "peacock", display: "'Playfair Display', serif", body: "'Inter', sans-serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["royal", "green", "peacock", "nawab"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "rajputana-crimson", name: "Rajputana Crimson", category: "royal_traditional", description: "Crimson + ivory with mandala crest",
    theme: { bg: "#6B0E18", panel: "#7C1322", ink: "#FFF1C9", accent: "#E5BB55", muted: "#D4AF37", ornament: "mandala", display: "'Cinzel', serif", body: "'Inter', sans-serif", photoShape: "rounded", photoAspect: "4:5", photoRadius: 10 },
    facets: { tags: ["royal", "crimson", "mandala", "regal"], orientation: "portrait", focus: "photo-first" } },
  { slug: "baroque-emerald", name: "Baroque Emerald", category: "royal_traditional", description: "Emerald + champagne with baroque damask",
    theme: { bg: "#0E3D34", panel: "#13533D", ink: "#F5EBC8", accent: "#E1C896", muted: "#C9B98A", ornament: "damask", display: "'DM Serif Display', serif", body: "'Cormorant Garamond', serif", photoShape: "oval", photoAspect: "4:5", headingScale: 1.05 },
    facets: { tags: ["royal", "emerald", "damask", "baroque"], orientation: "portrait", focus: "ornament-first" } },

  // ─── Expansion: 20+ per category ──────────────────────────────────
  // Hindu / Sikh (+10)
  { slug: "hindu-temple-bell", name: "Temple Bell", category: "hindu_sikh", description: "Temple gold with vermilion accents",
    theme: { bg: "#3A0E12", panel: "#4A1218", ink: "#FFE8B8", accent: "#E8B339", muted: "#C8953A", ornament: "mandala", display: "'Cinzel', serif", body: "'Inter', sans-serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["traditional", "vermilion", "mandala", "gold"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "hindu-lotus-pond", name: "Lotus Pond", category: "hindu_sikh", description: "Soft pink lotus with sage borders",
    theme: { bg: "#F6E2E0", panel: "#FFF1EE", ink: "#3C2238", accent: "#B95E7C", muted: "#7E6A5C", ornament: "mandala", display: "'Playfair Display', serif", body: "'Inter', sans-serif", photoShape: "oval", photoAspect: "4:5" },
    facets: { tags: ["soft", "pink", "lotus", "romantic"], orientation: "portrait", focus: "photo-first" } },
  { slug: "hindu-tilak-gold", name: "Tilak Gold", category: "hindu_sikh", description: "Ivory with regal gold tilak motif",
    theme: { bg: "#FAF1DE", panel: "#FFFAEC", ink: "#5A1A0E", accent: "#B8860B", muted: "#8A6E45", ornament: "sanskrit", display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif", photoShape: "circle", photoAspect: "1:1" },
    facets: { tags: ["minimal", "ivory", "gold", "regal"], orientation: "portrait", focus: "text-first" } },
  { slug: "hindu-vermilion-veil", name: "Vermilion Veil", category: "hindu_sikh", description: "Vermilion red with mandala veil",
    theme: { bg: "#8E1A1F", panel: "#A02226", ink: "#FFE8C7", accent: "#F2C66B", muted: "#D8B070", ornament: "mandala", display: "'Playfair Display', serif", body: "'Cormorant Garamond', serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["royal", "vermilion", "mandala", "warm"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "hindu-haldi-sunshine", name: "Haldi Sunshine", category: "hindu_sikh", description: "Turmeric yellow with marigold trim",
    theme: { bg: "#FBE49B", panel: "#FFF1B8", ink: "#5A2A0E", accent: "#D97706", muted: "#9A4A1A", ornament: "mandala", display: "'Playfair Display', serif", body: "'Lato', sans-serif", photoShape: "circle", photoAspect: "1:1" },
    facets: { tags: ["warm", "yellow", "marigold", "vibrant"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "sikh-khanda-royal", name: "Khanda Royal", category: "hindu_sikh", description: "Sapphire blue with antique gold",
    theme: { bg: "#0E1A3A", panel: "#162348", ink: "#FFE8B8", accent: "#D4AF37", muted: "#B8993A", ornament: "sanskrit", display: "'Cinzel', serif", body: "'Inter', sans-serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["royal", "sapphire", "gold", "sikh"], orientation: "portrait", focus: "photo-first" } },
  { slug: "hindu-rangoli-bloom", name: "Rangoli Bloom", category: "hindu_sikh", description: "Cream with vibrant rangoli border",
    theme: { bg: "#FFF5E1", panel: "#FFFAEC", ink: "#7A1A2E", accent: "#C13A5A", muted: "#9A4A5A", ornament: "mandala", display: "'Playfair Display', serif", body: "'Inter', sans-serif", photoShape: "rounded", photoAspect: "1:1", photoRadius: 18 },
    facets: { tags: ["traditional", "rangoli", "cream", "vibrant"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "hindu-paisley-noir", name: "Paisley Noir", category: "hindu_sikh", description: "Charcoal with gold paisley damask",
    theme: { bg: "#161311", panel: "#1F1A17", ink: "#F2D9B5", accent: "#D4AF37", muted: "#B8993A", ornament: "damask", display: "'DM Serif Display', serif", body: "'Inter', sans-serif", photoShape: "oval", photoAspect: "4:5" },
    facets: { tags: ["dark", "luxe", "paisley", "gold"], orientation: "portrait", focus: "photo-first" } },
  { slug: "hindu-kanjivaram", name: "Kanjivaram Silk", category: "hindu_sikh", description: "Forest green silk with gold zari",
    theme: { bg: "#1F3A2C", panel: "#284A38", ink: "#F2E2B8", accent: "#E1B84B", muted: "#C8A148", ornament: "damask", display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["royal", "silk", "zari", "green"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "hindu-marigold-arch", name: "Marigold Arch", category: "hindu_sikh", description: "Saffron with mandala arch crown",
    theme: { bg: "#F4C063", panel: "#F8D58E", ink: "#5A1A0E", accent: "#A93226", muted: "#7A2410", ornament: "mandala", display: "'Cinzel', serif", body: "'Cormorant Garamond', serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["traditional", "saffron", "marigold", "warm"], orientation: "portrait", focus: "ornament-first" } },

  // Christian / Muslim (+12)
  { slug: "cathedral-arch", name: "Cathedral Arch", category: "christian_muslim", description: "Stone ivory with gothic gold arch",
    theme: { bg: "#F4EFE3", panel: "#FFFFFF", ink: "#2A2620", accent: "#B8860B", muted: "#7E6A48", ornament: "arch", display: "'Cinzel', serif", body: "'Inter', sans-serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["minimal", "ivory", "arch", "gold"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "vow-garden", name: "Vow Garden", category: "christian_muslim", description: "Pale rose with botanical filigree",
    theme: { bg: "#FBEDE7", panel: "#FFF6F0", ink: "#3A1F1F", accent: "#B0707A", muted: "#8C5E60", ornament: "cross", display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif", photoShape: "oval", photoAspect: "4:5" },
    facets: { tags: ["soft", "rose", "botanical", "romantic"], orientation: "portrait", focus: "photo-first" } },
  { slug: "vatican-cream", name: "Vatican Cream", category: "christian_muslim", description: "Cream with gold cross medallion",
    theme: { bg: "#FAF4E6", panel: "#FFFFFF", ink: "#2E2419", accent: "#C9A14B", muted: "#9E7E3A", ornament: "cross", display: "'Playfair Display', serif", body: "'Cormorant Garamond', serif", photoShape: "circle", photoAspect: "1:1" },
    facets: { tags: ["minimal", "cream", "cross", "luxe"], orientation: "portrait", focus: "text-first" } },
  { slug: "tuscan-vine", name: "Tuscan Vine", category: "christian_muslim", description: "Olive cream with grapevine motif",
    theme: { bg: "#EFE7D2", panel: "#FAF3DE", ink: "#3A3220", accent: "#8C6A3F", muted: "#6E5436", ornament: "damask", display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif", photoShape: "rounded", photoAspect: "4:5", photoRadius: 10 },
    facets: { tags: ["warm", "olive", "vine", "tuscan"], orientation: "portrait", focus: "photo-first" } },
  { slug: "midnight-chapel", name: "Midnight Chapel", category: "christian_muslim", description: "Midnight navy with gold cross",
    theme: { bg: "#0F1A30", panel: "#172541", ink: "#F2E6BD", accent: "#D4AF37", muted: "#B8993A", ornament: "cross", display: "'Cinzel', serif", body: "'Inter', sans-serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["dark", "navy", "cross", "luxe"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "santorini-blue", name: "Santorini Blue", category: "christian_muslim", description: "Whitewashed cream with aegean blue",
    theme: { bg: "#F5F4EE", panel: "#FFFFFF", ink: "#0F3A5C", accent: "#1F6FAA", muted: "#3D7AA0", ornament: "cross", display: "'Playfair Display', serif", body: "'Inter', sans-serif", photoShape: "circle", photoAspect: "1:1" },
    facets: { tags: ["minimal", "blue", "aegean", "soft"], orientation: "portrait", focus: "text-first" } },
  { slug: "nikah-noor", name: "Nikah Noor", category: "christian_muslim", description: "Pearl with crescent arch motif",
    theme: { bg: "#F4EFE6", panel: "#FFFFFF", ink: "#1F3A2C", accent: "#1F6B4E", muted: "#3D7A5E", ornament: "arch", display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["soft", "pearl", "arch", "emerald"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "andalusia-arch", name: "Andalusia Arch", category: "christian_muslim", description: "Terracotta with moorish geometry",
    theme: { bg: "#5A2418", panel: "#6E2C1F", ink: "#F8E3B8", accent: "#E0B654", muted: "#C49A4A", ornament: "arch", display: "'Cinzel', serif", body: "'Inter', sans-serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["royal", "terracotta", "moorish", "arch"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "ivory-rosary", name: "Ivory Rosary", category: "christian_muslim", description: "Ivory with pearl rosary border",
    theme: { bg: "#F8F1E4", panel: "#FFFFFF", ink: "#3A2820", accent: "#A8895C", muted: "#7E6B4F", ornament: "damask", display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif", photoShape: "oval", photoAspect: "4:5" },
    facets: { tags: ["minimal", "ivory", "pearl", "luxe"], orientation: "portrait", focus: "text-first" } },
  { slug: "olive-grove", name: "Olive Grove", category: "christian_muslim", description: "Soft sage with olive branch frame",
    theme: { bg: "#EAEDE0", panel: "#F6F8EE", ink: "#2C3A2A", accent: "#6A8A56", muted: "#5E6E58", ornament: "cross", display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif", photoShape: "circle", photoAspect: "1:1" },
    facets: { tags: ["minimal", "sage", "olive", "soft"], orientation: "portrait", focus: "photo-first" } },
  { slug: "alhambra-night", name: "Alhambra Night", category: "christian_muslim", description: "Inky teal with gold lattice arch",
    theme: { bg: "#0E2E2C", panel: "#15403D", ink: "#F2E6BD", accent: "#D4AF37", muted: "#C2A572", ornament: "arch", display: "'DM Serif Display', serif", body: "'Cormorant Garamond', serif", photoShape: "arch", photoAspect: "3:4", headingScale: 1.05 },
    facets: { tags: ["dark", "teal", "lattice", "luxe"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "marrakech-rose", name: "Marrakech Rose", category: "christian_muslim", description: "Rose clay with copper arch",
    theme: { bg: "#C26A52", panel: "#D7866E", ink: "#FFF1DE", accent: "#7A2410", muted: "#5A1A0E", ornament: "arch", display: "'Cinzel', serif", body: "'Inter', sans-serif", photoShape: "rounded", photoAspect: "1:1", photoRadius: 12 },
    facets: { tags: ["warm", "rose", "clay", "arch"], orientation: "portrait", focus: "photo-first" } },

  // Modern / Minimal (+12)
  { slug: "milano-mono", name: "Milano Mono", category: "modern_minimal", description: "Stark white with monogram crest",
    theme: { bg: "#FFFFFF", panel: "#F6F6F4", ink: "#0C0C0C", accent: "#6E6452", muted: "#8A7A56", ornament: "editorial", display: "'Cinzel', serif", body: "'Inter', sans-serif", photoShape: "circle", photoAspect: "1:1", headingLetterSpacing: 3 },
    facets: { tags: ["minimal", "white", "monogram", "editorial"], orientation: "portrait", focus: "text-first" } },
  { slug: "kyoto-rice", name: "Kyoto Rice", category: "modern_minimal", description: "Rice paper cream with ink strokes",
    theme: { bg: "#F6F0E2", panel: "#FFFAEC", ink: "#181410", accent: "#7A4A1A", muted: "#5A3A1A", ornament: "editorial", display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif", photoShape: "square", photoAspect: "1:1" },
    facets: { tags: ["minimal", "rice", "ink", "modern"], orientation: "portrait", focus: "text-first" } },
  { slug: "noir-monogram", name: "Noir Monogram", category: "modern_minimal", description: "Charcoal with brushed gold monogram",
    theme: { bg: "#1A1A1A", panel: "#222222", ink: "#F2E6BD", accent: "#D4AF37", muted: "#B8993A", ornament: "noir", display: "'DM Serif Display', serif", body: "'Inter', sans-serif", photoShape: "circle", photoAspect: "1:1", headingLetterSpacing: 2 },
    facets: { tags: ["dark", "modern", "monogram", "gold"], orientation: "portrait", focus: "text-first" } },
  { slug: "linen-fold", name: "Linen Fold", category: "modern_minimal", description: "Linen beige with hairline rules",
    theme: { bg: "#EFE7D5", panel: "#F8F1DE", ink: "#3A2D20", accent: "#7A6147", muted: "#9C7A4A", ornament: "editorial", display: "'Playfair Display', serif", body: "'Inter', sans-serif", photoShape: "square", photoAspect: "4:5" },
    facets: { tags: ["minimal", "linen", "neutral", "editorial"], orientation: "portrait", focus: "photo-first" } },
  { slug: "modern-blush", name: "Modern Blush", category: "modern_minimal", description: "Blush rose with editorial type",
    theme: { bg: "#F8E2DC", panel: "#FBEFEA", ink: "#3A1F1F", accent: "#9C5A53", muted: "#7E4B47", ornament: "editorial", display: "'DM Serif Display', serif", body: "'Inter', sans-serif", photoShape: "rounded", photoAspect: "4:5", photoRadius: 8 },
    facets: { tags: ["soft", "blush", "modern", "editorial"], orientation: "portrait", focus: "photo-first" } },
  { slug: "stockholm-stone", name: "Stockholm Stone", category: "modern_minimal", description: "Cool stone grey with thin serif",
    theme: { bg: "#E2E4E6", panel: "#F0F1F3", ink: "#1A2530", accent: "#4F6A7B", muted: "#7C8B96", ornament: "editorial", display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif", photoShape: "square", photoAspect: "1:1" },
    facets: { tags: ["minimal", "stone", "cool", "scandi"], orientation: "portrait", focus: "text-first" } },
  { slug: "new-york-ink", name: "New York Ink", category: "modern_minimal", description: "Newsprint cream with bold serif",
    theme: { bg: "#F2EEE3", panel: "#FFFAEC", ink: "#0C0C0C", accent: "#0C0C0C", muted: "#3A3A3A", ornament: "editorial", display: "'DM Serif Display', serif", body: "'Inter', sans-serif", photoShape: "square", photoAspect: "1:1", headingLetterSpacing: 2.5 },
    facets: { tags: ["minimal", "editorial", "modern", "monochrome"], orientation: "portrait", focus: "text-first" } },
  { slug: "sahara-dune", name: "Sahara Dune", category: "modern_minimal", description: "Warm dune with sand accents",
    theme: { bg: "#E6D6BC", panel: "#F2E4CC", ink: "#3A2D20", accent: "#9C7A4A", muted: "#7A6147", ornament: "editorial", display: "'Playfair Display', serif", body: "'Inter', sans-serif", photoShape: "oval", photoAspect: "4:5" },
    facets: { tags: ["warm", "dune", "modern", "neutral"], orientation: "portrait", focus: "photo-first" } },
  { slug: "amalfi-citrus", name: "Amalfi Citrus", category: "modern_minimal", description: "Crisp white with citrus yellow trim",
    theme: { bg: "#FFFFFF", panel: "#FBF9F0", ink: "#1F3A2C", accent: "#E1B84B", muted: "#9C7A4A", ornament: "editorial", display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif", photoShape: "circle", photoAspect: "1:1" },
    facets: { tags: ["minimal", "citrus", "modern", "fresh"], orientation: "portrait", focus: "text-first" } },
  { slug: "berlin-graphite", name: "Berlin Graphite", category: "modern_minimal", description: "Graphite with sharp typography",
    theme: { bg: "#2A2A2C", panel: "#36363A", ink: "#F2EEE3", accent: "#C9B98A", muted: "#9E9080", ornament: "noir", display: "'Cinzel', serif", body: "'Inter', sans-serif", photoShape: "square", photoAspect: "1:1", headingLetterSpacing: 3 },
    facets: { tags: ["dark", "graphite", "modern", "editorial"], orientation: "portrait", focus: "text-first" } },
  { slug: "porto-terracotta", name: "Porto Terracotta", category: "modern_minimal", description: "Terracotta with cream editorial",
    theme: { bg: "#C26A52", panel: "#D7866E", ink: "#FFF1DE", accent: "#5A1A0E", muted: "#7A2410", ornament: "editorial", display: "'Playfair Display', serif", body: "'Inter', sans-serif", photoShape: "rounded", photoAspect: "4:5", photoRadius: 8 },
    facets: { tags: ["warm", "terracotta", "modern", "editorial"], orientation: "portrait", focus: "photo-first" } },
  { slug: "lisbon-tile", name: "Lisbon Tile", category: "modern_minimal", description: "Azulejo blue with white frames",
    theme: { bg: "#FFFFFF", panel: "#F4F7FB", ink: "#0F3A5C", accent: "#1F6FAA", muted: "#3D7AA0", ornament: "editorial", display: "'DM Serif Display', serif", body: "'Inter', sans-serif", photoShape: "square", photoAspect: "1:1" },
    facets: { tags: ["minimal", "blue", "tile", "modern"], orientation: "portrait", focus: "photo-first" } },

  // Royal / Traditional (+13)
  { slug: "udaipur-palace", name: "Udaipur Palace", category: "royal_traditional", description: "Palace blue with antique gold",
    theme: { bg: "#0F2A52", panel: "#173565", ink: "#FFE8B8", accent: "#E1B84B", muted: "#C8A148", ornament: "arch", display: "'Cinzel', serif", body: "'Cormorant Garamond', serif", photoShape: "arch", photoAspect: "3:4", headingScale: 1.05 },
    facets: { tags: ["royal", "blue", "palace", "gold"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "jodhpur-saffron", name: "Jodhpur Saffron", category: "royal_traditional", description: "Saffron with mandala medallion",
    theme: { bg: "#C0651F", panel: "#D67B33", ink: "#FFF1C9", accent: "#FFFFFF", muted: "#F2E6BD", ornament: "mandala", display: "'Cinzel', serif", body: "'Inter', sans-serif", photoShape: "rounded", photoAspect: "4:5", photoRadius: 10 },
    facets: { tags: ["royal", "saffron", "mandala", "warm"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "mysore-gold", name: "Mysore Gold", category: "royal_traditional", description: "Royal gold with deep maroon",
    theme: { bg: "#5A0E1B", panel: "#6E1224", ink: "#F8E3B8", accent: "#E0B654", muted: "#C49A4A", ornament: "damask", display: "'DM Serif Display', serif", body: "'Cormorant Garamond', serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["royal", "maroon", "gold", "damask"], orientation: "portrait", focus: "photo-first" } },
  { slug: "agra-marble", name: "Agra Marble", category: "royal_traditional", description: "Marble cream with mehrab arch",
    theme: { bg: "#F2EDE3", panel: "#FBF7EE", ink: "#2A241D", accent: "#B8860B", muted: "#7E6A48", ornament: "arch", display: "'Cinzel', serif", body: "'Cormorant Garamond', serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["royal", "marble", "arch", "gold"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "bengal-jamdani", name: "Bengal Jamdani", category: "royal_traditional", description: "Off-white silk with red borders",
    theme: { bg: "#F8F1E4", panel: "#FFFAEC", ink: "#7A1A2E", accent: "#A93226", muted: "#7A2410", ornament: "damask", display: "'Playfair Display', serif", body: "'Cormorant Garamond', serif", photoShape: "oval", photoAspect: "4:5" },
    facets: { tags: ["traditional", "silk", "bengal", "red"], orientation: "portrait", focus: "text-first" } },
  { slug: "kerala-temple", name: "Kerala Temple", category: "royal_traditional", description: "Off-white kasavu with gold border",
    theme: { bg: "#FAF4E6", panel: "#FFFFFF", ink: "#2A1A0E", accent: "#C9A14B", muted: "#9E7E3A", ornament: "mandala", display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["traditional", "kasavu", "kerala", "gold"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "mughal-emerald", name: "Mughal Emerald", category: "royal_traditional", description: "Emerald with gold mehrab arch",
    theme: { bg: "#0E3D34", panel: "#13533D", ink: "#F5EBC8", accent: "#E1C896", muted: "#C9B98A", ornament: "arch", display: "'Cinzel', serif", body: "'Cormorant Garamond', serif", photoShape: "arch", photoAspect: "3:4", headingScale: 1.05 },
    facets: { tags: ["royal", "emerald", "arch", "mughal"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "ottoman-court", name: "Ottoman Court", category: "royal_traditional", description: "Wine velvet with ottoman damask",
    theme: { bg: "#4A0A24", panel: "#5C0E2B", ink: "#FFE8C7", accent: "#D4AF37", muted: "#B89968", ornament: "damask", display: "'DM Serif Display', serif", body: "'Cormorant Garamond', serif", photoShape: "oval", photoAspect: "4:5" },
    facets: { tags: ["royal", "wine", "ottoman", "damask"], orientation: "portrait", focus: "photo-first" } },
  { slug: "persian-sapphire", name: "Persian Sapphire", category: "royal_traditional", description: "Sapphire with gold mosaic",
    theme: { bg: "#0E1A3A", panel: "#162348", ink: "#FFE8B8", accent: "#D4AF37", muted: "#B8993A", ornament: "arch", display: "'Cinzel', serif", body: "'Inter', sans-serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["royal", "sapphire", "persian", "gold"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "maharaja-noir", name: "Maharaja Noir", category: "royal_traditional", description: "Black velvet with peacock crown",
    theme: { bg: "#161311", panel: "#1F1A17", ink: "#F2D9B5", accent: "#D4AF37", muted: "#B8993A", ornament: "peacock", display: "'Cinzel', serif", body: "'Cormorant Garamond', serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["royal", "noir", "peacock", "luxe"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "tuscany-villa", name: "Tuscany Villa", category: "royal_traditional", description: "Tuscan red with damask crest",
    theme: { bg: "#7A2410", panel: "#8C2E18", ink: "#F8E3B8", accent: "#E0B654", muted: "#C49A4A", ornament: "damask", display: "'Playfair Display', serif", body: "'Cormorant Garamond', serif", photoShape: "oval", photoAspect: "4:5" },
    facets: { tags: ["royal", "tuscan", "damask", "warm"], orientation: "portrait", focus: "photo-first" } },
  { slug: "versailles-cream", name: "Versailles Cream", category: "royal_traditional", description: "Royal cream with baroque gold",
    theme: { bg: "#FAF1DE", panel: "#FFFAEC", ink: "#3A2A1B", accent: "#B8860B", muted: "#8A6E45", ornament: "damask", display: "'DM Serif Display', serif", body: "'Cormorant Garamond', serif", photoShape: "arch", photoAspect: "3:4" },
    facets: { tags: ["royal", "cream", "baroque", "gold"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "vienna-opera", name: "Vienna Opera", category: "royal_traditional", description: "Opera red with champagne ornament",
    theme: { bg: "#6B0E18", panel: "#7C1322", ink: "#FFF1C9", accent: "#E1C896", muted: "#C9B98A", ornament: "damask", display: "'Cinzel', serif", body: "'Cormorant Garamond', serif", photoShape: "oval", photoAspect: "4:5", headingScale: 1.05 },
    facets: { tags: ["royal", "opera", "red", "champagne"], orientation: "portrait", focus: "photo-first" } },

  // ─── Amora-inspired premium series ───────────────────────────────
  // Editorial storytelling & cinematic script looks inspired by leading
  // international wedding-invite studios (AmoraRSVP, AmoraWeds).
  { slug: "amora-burgundy-editorial", name: "Amora Burgundy", category: "modern_minimal",
    description: "Cream paper with burgundy editorial chapter headings",
    theme: { bg: "#F6EFE4", panel: "#FBF5EA", ink: "#2A1A1A", accent: "#7A1220", muted: "#8B6A5E", ornament: "editorial", display: "'Playfair Display', serif", body: "'Inter', sans-serif", photoShape: "arch", photoAspect: "3:4", headingLetterSpacing: 0.5, headingScale: 1.05 },
    facets: { tags: ["editorial", "burgundy", "chapter", "romantic"], orientation: "portrait", focus: "text-first" } },
  { slug: "amora-noir-script", name: "Amora Noir", category: "modern_minimal",
    description: "Cinematic black stage with glowing gold script monogram",
    theme: { bg: "#0A0A0A", panel: "#111111", ink: "#F2E6BD", accent: "#D4AF37", muted: "#B8993A", ornament: "noir", display: "'Great Vibes', cursive", body: "'Cormorant Garamond', serif", photoShape: "oval", photoAspect: "4:5", headingLetterSpacing: 0, headingScale: 1.35 },
    facets: { tags: ["dark", "cinematic", "script", "luxe"], orientation: "portrait", focus: "text-first" } },
  { slug: "amora-blush-cinema", name: "Amora Blush", category: "modern_minimal",
    description: "Warm cream with rose-pink script names, cinematic hero",
    theme: { bg: "#FBF2E4", panel: "#FFF8EE", ink: "#3A2229", accent: "#C25E7A", muted: "#8E6474", ornament: "editorial", display: "'Great Vibes', cursive", body: "'Cormorant Garamond', serif", photoShape: "rounded", photoAspect: "3:4", photoRadius: 22, headingScale: 1.4 },
    facets: { tags: ["romantic", "blush", "script", "cinematic"], orientation: "portrait", focus: "photo-first" } },
  { slug: "amora-navy-together", name: "Amora Together", category: "modern_minimal",
    description: "Warm cream with navy script and coral diamond accent",
    theme: { bg: "#FDF5E4", panel: "#FFFAEA", ink: "#243A5A", accent: "#DB6A48", muted: "#5A6B85", ornament: "editorial", display: "'Great Vibes', cursive", body: "'Inter', sans-serif", photoShape: "circle", photoAspect: "1:1", headingScale: 1.35 },
    facets: { tags: ["romantic", "navy", "coral", "script"], orientation: "portrait", focus: "text-first" } },
  { slug: "amora-parchment-chapter", name: "Amora Parchment", category: "modern_minimal",
    description: "Old-book parchment with Roman chapter numerals",
    theme: { bg: "#EFE6D2", panel: "#F8F0DA", ink: "#2A1F14", accent: "#8A5A1A", muted: "#6E5436", ornament: "editorial", display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif", photoShape: "arch", photoAspect: "3:4", headingLetterSpacing: 2, headingScale: 0.95 },
    facets: { tags: ["editorial", "parchment", "chapter", "vintage"], orientation: "portrait", focus: "ornament-first" } },
  { slug: "amora-plum-luxe", name: "Amora Plum", category: "royal_traditional",
    description: "Deep plum velvet with soft-gold script names",
    theme: { bg: "#2A0E22", panel: "#3A122E", ink: "#F5E6C8", accent: "#E1B84B", muted: "#C8A16A", ornament: "damask", display: "'Great Vibes', cursive", body: "'Cormorant Garamond', serif", photoShape: "oval", photoAspect: "4:5", headingScale: 1.4 },
    facets: { tags: ["royal", "plum", "script", "luxe"], orientation: "portrait", focus: "photo-first" } },
  { slug: "amora-ivory-hero", name: "Amora Ivory", category: "modern_minimal",
    description: "All-ivory with italic accent word and hairline rules",
    theme: { bg: "#F8F2E6", panel: "#FFFBF0", ink: "#1A1A1A", accent: "#7A1220", muted: "#6E6452", ornament: "editorial", display: "'Playfair Display', serif", body: "'Inter', sans-serif", photoShape: "square", photoAspect: "1:1", headingLetterSpacing: 0.8, headingScale: 1.1 },
    facets: { tags: ["minimal", "ivory", "editorial", "italic"], orientation: "portrait", focus: "text-first" } },
  { slug: "amora-forest-cinema", name: "Amora Forest", category: "royal_traditional",
    description: "Deep forest with gold script and cinematic arch",
    theme: { bg: "#0E2A22", panel: "#153A2E", ink: "#F5EBC8", accent: "#E1B84B", muted: "#B8A374", ornament: "arch", display: "'Great Vibes', cursive", body: "'Cormorant Garamond', serif", photoShape: "arch", photoAspect: "3:4", headingScale: 1.35 },
    facets: { tags: ["dark", "forest", "script", "cinematic"], orientation: "portrait", focus: "ornament-first" } },
];

// Merge into the exported maps so every consumer sees the new templates.
NEW_PREMIUM_TEMPLATES.forEach((t) => {
  CARD_THEMES[t.slug] = t.theme;
  TEMPLATE_FACETS[t.slug] = t.facets;
  FALLBACK_TEMPLATES.push({
    slug: t.slug, name: t.name, category: t.category,
    is_premium: true, is_enabled: true, description: t.description,
    occasion: "wedding",
  });
});
ALL_TEMPLATE_TAGS = Array.from(
  new Set(Object.values(TEMPLATE_FACETS).flatMap((f) => f.tags))
).sort();

// ─── Occasion templates ───────────────────────────────────────────
// For every occasion, derive ≥10 templates by combining a curated set of
// base themes (across religion categories) with occasion-tuned copy.
// Slugs use the pattern `${occasion}__${baseSlug}` so existing CARD_THEMES
// can be aliased and rendered without duplicating theme objects.
const OCCASION_BASE_THEMES: Record<Occasion, string[]> = {
  // ≥20 per occasion, spread across all four religion / style categories
  // (≥5 per category × 4 categories) so combined filters still surface results.
  save_the_date: [
    // hindu_sikh
    "hindu-om-ivory", "hindu-saffron-marigold", "hindu-lotus-pond", "hindu-tilak-gold", "hindu-rangoli-bloom",
    // christian_muslim
    "lace-pearl", "sacred-dove", "crescent-ivory", "vow-garden", "ivory-rosary",
    // modern_minimal
    "modern-typographic", "modern-noir", "paris-blanc", "scandi-mist", "tokyo-ink",
    "monaco-marble", "atelier-sand", "copenhagen-rose",
    "amora-ivory-hero", "amora-blush-cinema", "amora-parchment-chapter",
    // royal_traditional
    "agra-marble", "versailles-cream",
  ],
  betrothal: [
    "hindu-ganesha-classic", "hindu-saffron-marigold", "hindu-jaipur-pink", "hindu-kalash-cream", "hindu-mehendi-green",
    "sikh-anand-karaj", "hindu-om-ivory", "hindu-tilak-gold",
    "chapel-rose", "lace-pearl", "crescent-ivory", "vow-garden", "ivory-rosary",
    "modern-typographic", "monaco-marble", "copenhagen-rose", "modern-blush",
    "rajputana-crimson", "kerala-temple", "bengal-jamdani",
  ],
  engagement: [
    "chapel-rose", "sacred-dove", "lace-pearl", "crescent-ivory", "vatican-cream",
    "copenhagen-rose", "modern-typographic", "paris-blanc", "monaco-marble", "modern-blush",
    "amora-blush-cinema", "amora-burgundy-editorial", "amora-navy-together",
    "hindu-om-ivory", "hindu-saffron-marigold", "hindu-lotus-pond", "hindu-tilak-gold", "hindu-rangoli-bloom",
    "versailles-cream", "agra-marble", "kerala-temple", "tuscany-villa", "bengal-jamdani",
  ],
  mehendi_haldi: [
    "hindu-saffron-marigold", "hindu-jaipur-pink", "hindu-mehendi-green", "hindu-kalash-cream",
    "hindu-ganesha-classic", "hindu-banarasi-silk", "hindu-sindoor-rose", "hindu-haldi-sunshine",
    "hindu-rangoli-bloom", "hindu-marigold-arch", "sikh-anand-karaj",
    "marrakech-rose", "henna-noir", "tuscan-vine", "olive-grove",
    "amalfi-citrus", "porto-terracotta", "sahara-dune",
    "jodhpur-saffron", "rajputana-crimson",
  ],
  sangeet: [
    "hindu-royal-mandala", "hindu-banarasi-silk", "hindu-sindoor-rose", "hindu-jaipur-pink",
    "hindu-paisley-noir", "sikh-khanda-royal",
    "midnight-chapel", "henna-noir", "alhambra-night", "marrakech-rose", "andalusia-arch",
    "modern-noir", "berlin-graphite", "noir-monogram", "new-york-ink",
    "royal-peacock", "royal-velvet", "venetian-rouge", "mughal-court", "baroque-emerald",
  ],
  nikah: [
    "muslim-emerald-arch", "mehrab-gold", "henna-noir", "crescent-ivory", "nikah-noor",
    "alhambra-night", "marrakech-rose", "andalusia-arch", "midnight-chapel", "lace-pearl",
    "mughal-court", "mughal-emerald", "ottoman-court", "persian-sapphire", "baroque-emerald",
    "modern-noir", "atelier-sand", "scandi-mist", "monaco-marble",
    "hindu-om-ivory",
  ],
  wedding: [
    "hindu-ganesha-classic", "hindu-royal-mandala", "hindu-banarasi-silk", "hindu-kanjivaram", "hindu-marigold-arch",
    "christian-floral-cross", "muslim-emerald-arch", "cathedral-arch", "mehrab-gold", "nikah-noor",
    "modern-typographic", "modern-noir", "monaco-marble", "noir-monogram", "milano-mono",
    "amora-burgundy-editorial", "amora-noir-script", "amora-blush-cinema", "amora-navy-together",
    "amora-parchment-chapter", "amora-ivory-hero", "amora-forest-cinema",
    "royal-peacock", "royal-velvet", "mughal-court", "venetian-rouge", "baroque-emerald",
    "amora-plum-luxe",
  ],
  reception: [
    "modern-noir", "monaco-marble", "paris-blanc", "tokyo-ink", "noir-monogram",
    "milano-mono", "berlin-graphite", "new-york-ink", "linen-fold",
    "amora-noir-script", "amora-plum-luxe", "amora-forest-cinema",
    "venetian-rouge", "royal-velvet", "baroque-emerald", "mughal-court", "ottoman-court",
    "hyderabad-nawab", "vienna-opera",
    "hindu-banarasi-silk", "hindu-paisley-noir",
    "henna-noir", "midnight-chapel",
  ],
  anniversary: [
    "monaco-marble", "paris-blanc", "linen-fold", "modern-typographic", "atelier-sand",
    "scandi-mist", "modern-blush", "copenhagen-rose", "amalfi-citrus",
    "lace-pearl", "sacred-dove", "vow-garden", "ivory-rosary", "vatican-cream", "tuscan-vine",
    "hindu-om-ivory", "hindu-lotus-pond", "hindu-tilak-gold",
    "versailles-cream", "agra-marble",
  ],
};

function _titleCase(slug: string): string {
  return slug.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

/** Returns the base theme slug for an occasion-aliased slug, or itself. */
export function baseSlugOf(slug: string): string {
  const idx = slug.indexOf("__");
  return idx === -1 ? slug : slug.slice(idx + 2);
}
/** Returns the occasion encoded in the slug, if any. */
export function occasionOf(slug: string): Occasion | undefined {
  const idx = slug.indexOf("__");
  if (idx === -1) return undefined;
  const candidate = slug.slice(0, idx) as Occasion;
  return OCCASIONS.includes(candidate) ? candidate : undefined;
}

(Object.keys(OCCASION_BASE_THEMES) as Occasion[]).forEach((occ) => {
  const baseSlugs = OCCASION_BASE_THEMES[occ];
  baseSlugs.forEach((baseSlug) => {
    const baseMeta = FALLBACK_TEMPLATES.find((t) => t.slug === baseSlug);
    const baseTheme = CARD_THEMES[baseSlug];
    if (!baseMeta || !baseTheme) return;
    const slug = `${occ}__${baseSlug}`;
    if (CARD_THEMES[slug]) return; // already added
    CARD_THEMES[slug] = baseTheme;
    if (TEMPLATE_FACETS[baseSlug]) {
      TEMPLATE_FACETS[slug] = {
        ...TEMPLATE_FACETS[baseSlug],
        tags: Array.from(new Set([...(TEMPLATE_FACETS[baseSlug].tags || []), occ])),
      };
    }
    FALLBACK_TEMPLATES.push({
      slug,
      name: `${OCCASION_COPY[occ].headline} · ${baseMeta.name}`,
      category: baseMeta.category,
      // All occasion variants are premium-standard so every (occasion)
      // filter surfaces ≥20 premium templates.
      is_premium: true,
      is_enabled: true,
      description: `${OCCASION_LABELS[occ]} card — ${baseMeta.description ?? ""}`.trim(),
      occasion: occ,
    });
  });
});

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
  const hScale = theme.headingScale ?? 1;
  const hSpace = theme.headingLetterSpacing ?? 0.5;
  const bSpace = theme.bodyLetterSpacing ?? 6;
  // ── Photo framing geometry
  const aspect = (PHOTO_ASPECTS.find((a) => a.value === (theme.photoAspect ?? "1:1"))?.ratio) ?? 1;
  const photoW = width * 0.34;
  const photoH = photoW / aspect;
  const shape = theme.photoShape ?? "circle";
  const radius =
    shape === "circle" ? "50%" :
    shape === "oval" ? "50%" :
    shape === "rounded" ? `${theme.photoRadius ?? 18}px` :
    shape === "arch" ? `${Math.round(photoW / 2)}px ${Math.round(photoW / 2)}px 6px 6px` :
    "2px";
  const qrAnchorStyle: Record<QrPosition, React.CSSProperties> = {
    bottom: { position: "absolute", left: 0, right: 0, bottom: pad * 0.7, display: "flex", justifyContent: "center" },
    "bottom-left": { position: "absolute", left: pad * 0.8, bottom: pad * 0.7 },
    "bottom-right": { position: "absolute", right: pad * 0.8, bottom: pad * 0.7 },
    "top-right": { position: "absolute", right: pad * 0.8, top: pad * 0.8 },
    hidden: { display: "none" },
  };
  // ── QR block styling
  const qrPreset = getQrStylePreset(theme.qrStyle);
  const qrCaption = theme.qrCaption ?? qrPreset.defaultCaption;
  const qrBg = theme.qrBg ?? "#ffffff";
  const qrBorderColor = qrPreset.useAccentBorder ? theme.accent : theme.muted;
  const qrFrameRadius =
    qrPreset.frame === "circle" ? "50%" :
    qrPreset.frame === "rounded" ? "14px" :
    qrPreset.frame === "ticket" ? "10px" :
    qrPreset.frame === "ribbon" ? "10px" :
    "4px";
  const qrBadgeStyle: React.CSSProperties = {
    background: qrBg,
    padding: qrPreset.padding,
    borderRadius: qrFrameRadius,
    border: qrPreset.borderStyle === "none" ? "none" : `${qrPreset.borderWidth}px ${qrPreset.borderStyle} ${qrBorderColor}${qrPreset.useAccentBorder ? "" : "88"}`,
    display: "inline-block",
    boxShadow: qrPreset.id === "noir" ? `0 0 0 6px ${theme.bg}, 0 0 0 7px ${theme.accent}66` : undefined,
    position: "relative",
  };
  const qrCaptionStyle: React.CSSProperties = {
    marginTop: 4,
    fontFamily: qrPreset.captionSerif ? theme.display : theme.body,
    color: theme.muted,
    fontSize: Math.max(9, Math.round(width * 0.020)),
    letterSpacing: qrPreset.captionUppercase ? 2 : 0.4,
    textTransform: qrPreset.captionUppercase ? "uppercase" : "none",
    textAlign: "center",
    lineHeight: 1.2,
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
      {/* Subtle paper / vignette wash */}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(120% 80% at 50% 0%, ${theme.accent}10 0%, transparent 55%),
                       radial-gradient(120% 80% at 50% 100%, ${theme.accent}12 0%, transparent 55%)`,
        }}
      />
      {/* Outer thin hairline */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: pad * 0.35,
          border: `0.5px solid ${theme.accent}55`,
        }}
      />
      {/* Inner panel with double-rule gold frame */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: pad * 0.6,
          background: theme.panel,
          border: `1px solid ${theme.accent}aa`,
          boxShadow: `inset 0 0 0 3px ${theme.bg}, inset 0 0 0 3.5px ${theme.accent}55`,
        }}
      />
      {/* Corner flourishes anchored to the inner frame */}
      {(["tl", "tr", "bl", "br"] as const).map((corner) => {
        const rot = corner === "tl" ? 0 : corner === "tr" ? 90 : corner === "br" ? 180 : 270;
        const pos: React.CSSProperties = {
          position: "absolute",
          [corner.includes("t") ? "top" : "bottom"]: pad * 0.7,
          [corner.includes("l") ? "left" : "right"]: pad * 0.7,
          pointerEvents: "none",
        };
        return (
          <div key={corner} style={pos} aria-hidden>
            <CornerFlourish color={theme.accent} size={width * 0.11} rotate={rot} />
          </div>
        );
      })}
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
        <div style={{ marginTop: pad * 0.25 }}>
          <Ornament kind={theme.ornament} color={theme.accent} size={width * 0.22} />
        </div>

        {kind === "front" ? (
          <>
            {data.photo && (
              <div
                style={{
                  marginTop: pad * 0.45,
                  width: photoW,
                  height: photoH,
                  borderRadius: radius,
                  overflow: "hidden",
                  border: `1.5px solid ${theme.accent}`,
                  boxShadow: `0 0 0 4px ${theme.panel}, 0 0 0 5.5px ${theme.accent}66, 0 18px 30px -16px rgba(0,0,0,0.45)`,
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

            {!data.photo && (
              <div style={{ marginTop: pad * 0.55 }}>
                <Monogram
                  a={data.partner1} b={data.partner2}
                  color={theme.accent} ink={theme.ink} family={theme.display}
                  size={width * 0.22}
                />
              </div>
            )}

            <p
              style={{
                marginTop: pad * 0.55,
                fontFamily: theme.body,
                color: theme.muted,
                letterSpacing: bSpace,
                fontSize: width * 0.022,
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ width: 18, height: 1, background: theme.accent, opacity: 0.6 }} />
              <span>{data.invitationLine || "Together with their families"}</span>
              <span style={{ width: 18, height: 1, background: theme.accent, opacity: 0.6 }} />
            </p>

            <h1 style={{ fontFamily: theme.display, fontSize: width * 0.108 * hScale, lineHeight: 1.02, margin: `${pad * 0.45}px 0 0`, color: theme.ink, fontStyle: "italic", letterSpacing: hSpace }}>
              {data.partner1}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: `${pad * 0.28}px 0`, width: "72%" }}>
              <span style={{ flex: 1, height: 0.5, background: theme.accent, opacity: 0.55 }} />
              <span style={{ flex: 1, height: 1, background: theme.accent }} />
              <span style={{ fontFamily: theme.display, color: theme.accent, fontSize: width * 0.072 * hScale, fontStyle: "italic", lineHeight: 1 }}>&amp;</span>
              <span style={{ flex: 1, height: 1, background: theme.accent }} />
              <span style={{ flex: 1, height: 0.5, background: theme.accent, opacity: 0.55 }} />
            </div>
            <h1 style={{ fontFamily: theme.display, fontSize: width * 0.108 * hScale, lineHeight: 1.02, margin: 0, color: theme.ink, fontStyle: "italic", letterSpacing: hSpace }}>
              {data.partner2}
            </h1>

            {/* Date bar with thin double rule */}
            <div style={{ marginTop: pad * 0.85, fontFamily: theme.body, color: theme.ink, width: "70%" }}>
              <div style={{ height: 1, background: theme.accent, opacity: 0.7 }} />
              <div style={{ height: 0.5, background: theme.accent, opacity: 0.4, marginTop: 2 }} />
              <div style={{ fontSize: width * 0.038, letterSpacing: bSpace * 0.7, textTransform: "uppercase", padding: `${pad * 0.28}px 0 ${pad * 0.18}px`, fontWeight: 500 }}>
                {data.date}
              </div>
              <div style={{ height: 0.5, background: theme.accent, opacity: 0.4, marginBottom: 2 }} />
              <div style={{ height: 1, background: theme.accent, opacity: 0.7 }} />
              {data.time && (
                <div style={{ fontSize: width * 0.026, color: theme.muted, marginTop: 8, letterSpacing: 3, textTransform: "uppercase" }}>{data.time}</div>
              )}
              <div style={{ fontSize: width * 0.028, color: theme.muted, marginTop: 8, maxWidth: "100%", fontStyle: "italic" }}>{data.venue}</div>
            </div>

            {data.message && (
              <p style={{ marginTop: pad * 0.5, fontFamily: theme.display, fontStyle: "italic", color: theme.muted, fontSize: width * 0.028, maxWidth: width * 0.78, lineHeight: 1.55 }}>
                “{data.message}”
              </p>
            )}
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: theme.display, fontSize: width * 0.086 * hScale, margin: `${pad * 0.5}px 0 0`, color: theme.ink, fontStyle: "italic", letterSpacing: hSpace }}>
              {page?.title || "Event"}
            </h2>
            {page?.subtitle && (
              <p style={{ marginTop: pad * 0.25, color: theme.muted, fontSize: width * 0.026, letterSpacing: 4, textTransform: "uppercase" }}>
                {page.subtitle}
              </p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10, width: "60%", margin: `${pad * 0.5}px 0` }}>
              <span style={{ flex: 1, height: 0.5, background: theme.accent, opacity: 0.5 }} />
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: theme.accent }} />
              <span style={{ flex: 1, height: 0.5, background: theme.accent, opacity: 0.5 }} />
            </div>
            <p style={{ fontSize: width * 0.03, color: theme.ink, lineHeight: 1.75, whiteSpace: "pre-wrap", maxWidth: width * 0.82, fontFamily: theme.body }}>
              {page?.body || ""}
            </p>
          </>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ marginTop: pad * 0.3, opacity: 0.9, transform: "rotate(180deg)" }}>
          <Ornament kind={theme.ornament} color={theme.accent} size={width * 0.13} />
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