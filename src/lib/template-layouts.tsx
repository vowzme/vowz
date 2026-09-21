// One hundred premium design recipes for the wedding website templates.
// Every recipe combines a structural layout with its own framing treatment.

import { Heart, MapPin, Calendar } from "lucide-react";

export type TemplateLayoutId =
  | "portrait-frame"
  | "editorial-split"
  | "poster-band"
  | "arch-window"
  | "monogram-crest"
  | "postcard-stamp"
  | "ribbon-marquee"
  | "duo-collage"
  | "minimal-rule"
  | "circle-halo";

export const TEMPLATE_LAYOUTS: { id: TemplateLayoutId; label: string }[] = [
  { id: "portrait-frame", label: "Portrait frame" },
  { id: "editorial-split", label: "Editorial split" },
  { id: "poster-band", label: "Bold poster" },
  { id: "arch-window", label: "Arched window" },
  { id: "monogram-crest", label: "Monogram crest" },
  { id: "postcard-stamp", label: "Postcard stamp" },
  { id: "ribbon-marquee", label: "Ribbon marquee" },
  { id: "duo-collage", label: "Duo collage" },
  { id: "minimal-rule", label: "Minimal rule" },
  { id: "circle-halo", label: "Halo portrait" },
];

export const TEMPLATE_LAYOUT_LABELS: Record<TemplateLayoutId, string> = TEMPLATE_LAYOUTS.reduce(
  (acc, l) => ({ ...acc, [l.id]: l.label }),
  {} as Record<TemplateLayoutId, string>,
);

const RECIPE_EDITIONS = [
  "Gilded edge",
  "Botanical corners",
  "Pearl frame",
  "Temple lines",
  "Festive confetti",
  "Silk ribbon",
  "Heritage seal",
  "Moonlit border",
  "Modern rails",
  "Fine art mat",
] as const;

export type TemplateRecipe = {
  id: string;
  label: string;
  layout: TemplateLayoutId;
  edition: number;
};

/** 10 compositions × 10 art directions = 100 unique, stable recipes. */
export const TEMPLATE_RECIPES: TemplateRecipe[] = RECIPE_EDITIONS.flatMap((edition, editionIndex) =>
  TEMPLATE_LAYOUTS.map((layout, layoutIndex) => ({
    id: `${layout.id}-${editionIndex + 1}`,
    label: `${layout.label} · ${edition}`,
    layout: layout.id,
    edition: editionIndex,
  })),
);

/** Stable hash so a template always keeps the same layout across renders. */
function hash(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

export function getTemplateRecipe(name: string, designIndex?: number): TemplateRecipe {
  const index = typeof designIndex === "number" ? designIndex : hash(name);
  return TEMPLATE_RECIPES[((index % TEMPLATE_RECIPES.length) + TEMPLATE_RECIPES.length) % TEMPLATE_RECIPES.length];
}

export function getTemplateLayout(name: string, designIndex?: number): TemplateLayoutId {
  return getTemplateRecipe(name, designIndex).layout;
}

export function getTemplateRecipeLabel(name: string, designIndex?: number): string {
  return getTemplateRecipe(name, designIndex).label;
}

type Art = {
  name?: string;
  couple: string;
  partner1: string;
  partner2: string;
  tagline: string;
  weddingDate: string;
  location: string;
  venue: string;
  couplePhoto: string;
  heroPhoto: string;
  colors: [string, string, string];
};


/** Relative luminance of a hex colour. */
function lum(hex: string) {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Keeps headline text readable on pale palettes. */
function readable(text: string, bg: string) {
  return Math.abs(lum(text) - lum(bg)) < 0.3 ? (lum(bg) > 0.5 ? "#1F1A16" : "#FFFFFF") : text;
}

const initials = (t: Art) => `${t.partner1.charAt(0)}${t.partner2.charAt(0)}`.toUpperCase();

/**
 * Per-edition decorative surface: pure CSS gradients, so it costs no extra
 * network requests and stays crisp on every screen density.
 */
function luxeTexture(edition: number, accent: string, bg: string): string {
  const a = (o: string) => `${accent}${o}`;
  switch (edition % 10) {
    case 0: // Gilded edge — soft foil glow from the corners
      return `radial-gradient(120% 80% at 0% 0%, ${a("22")} 0%, transparent 55%), radial-gradient(120% 80% at 100% 100%, ${a("22")} 0%, transparent 55%)`;
    case 1: // Botanical corners — leafy arcs
      return `radial-gradient(60% 40% at 0% 100%, ${a("26")} 0%, transparent 60%), radial-gradient(50% 35% at 100% 0%, ${a("1f")} 0%, transparent 60%)`;
    case 2: // Pearl frame — pearly sheen
      return `linear-gradient(135deg, ${a("1a")} 0%, transparent 35%, ${a("14")} 65%, transparent 100%)`;
    case 3: // Temple lines — fine vertical rhythm
      return `repeating-linear-gradient(90deg, ${a("18")} 0px, ${a("18")} 1px, transparent 1px, transparent 14px)`;
    case 4: // Festive confetti — dotted scatter
      return `radial-gradient(${a("2e")} 1.2px, transparent 1.4px), radial-gradient(${a("1c")} 1px, transparent 1.2px)`;
    case 5: // Silk ribbon — diagonal silk weave
      return `repeating-linear-gradient(45deg, ${a("14")} 0px, ${a("14")} 2px, transparent 2px, transparent 12px)`;
    case 6: // Heritage seal — aged medallion wash
      return `radial-gradient(70% 70% at 50% 50%, ${a("1f")} 0%, transparent 70%)`;
    case 7: // Moonlit border — top-lit halo
      return `radial-gradient(90% 55% at 50% 0%, ${a("2a")} 0%, transparent 65%)`;
    case 8: // Modern rails — horizontal rails
      return `repeating-linear-gradient(0deg, ${a("14")} 0px, ${a("14")} 1px, transparent 1px, transparent 18px)`;
    case 9:
    default: // Fine art mat — museum mat wash
      return `linear-gradient(180deg, ${bg}00 0%, ${a("16")} 100%)`;
  }
}

function LuxeSurface({ edition, accent, bg, rounded }: { edition: number; accent: string; bg: string; rounded?: boolean }) {
  const dotted = edition % 10 === 4;
  return (
    <div className={`pointer-events-none absolute inset-0 z-10 ${rounded ? "rounded-xl" : ""}`} aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: luxeTexture(edition, accent, bg),
          backgroundSize: dotted ? "22px 22px, 34px 34px" : undefined,
          backgroundPosition: dotted ? "0 0, 11px 17px" : undefined,
        }}
      />
      {/* foil sheen */}
      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{ background: `linear-gradient(115deg, #ffffff00 20%, #ffffff55 42%, #ffffff00 60%)` }}
      />
      {/* vignette for depth */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: `inset 0 0 60px ${bg}80, inset 0 -40px 60px -40px #00000055` }}
      />
    </div>
  );
}

/**
 * The tile artwork shown in the template grid. Fills its parent box.
 * Mobile-first: no fixed pixel widths, type scales with the breakpoint.
 */
function TemplateTileComposition({ t, layout }: { t: Art; layout: TemplateLayoutId }) {
  const l = layout;
  const [bg, accent, rawText] = t.colors;
  const text = readable(rawText, bg);

  const Photo = ({ className = "" }: { className?: string }) => (
    <img src={t.heroPhoto} alt={`${t.couple} wedding template preview`} className={`w-full h-full object-cover ${className}`} loading="lazy" decoding="async" />
  );
  const Portrait = ({ className = "" }: { className?: string }) => (
    <img src={t.couplePhoto} alt={`Portrait of ${t.couple}`} className={`w-full h-full object-cover ${className}`} loading="lazy" decoding="async" />
  );

  switch (l) {
    case "editorial-split":
      return (
        <div className="absolute inset-0 flex" style={{ backgroundColor: bg }}>
          <div className="w-1/2 relative">
            <Photo />
            <div className="absolute inset-0" style={{ background: `${bg}44` }} />
          </div>
          <div className="w-1/2 flex flex-col justify-center px-4 text-left">
            <span className="font-body text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: `${text}99` }}>
              The Wedding of
            </span>
            <p className="font-display text-xl sm:text-2xl leading-tight font-bold" style={{ color: text }}>
              {t.partner1}
            </p>
            <p className="font-display italic text-sm my-1" style={{ color: accent }}>and</p>
            <p className="font-display text-xl sm:text-2xl leading-tight font-bold" style={{ color: text }}>
              {t.partner2}
            </p>
            <div className="h-px w-8 my-3" style={{ backgroundColor: accent }} />
            <p className="font-body text-[10px]" style={{ color: `${text}bb` }}>{t.weddingDate}</p>
          </div>
        </div>
      );

    case "poster-band":
      return (
        <div className="absolute inset-0" style={{ backgroundColor: bg }}>
          <Photo className="opacity-60" />
          <div className="absolute inset-0 flex flex-col justify-end p-4">
            <p
              className="font-display font-black uppercase leading-[0.85] tracking-tight text-3xl sm:text-4xl"
              style={{ color: text }}
            >
              {t.partner1}
              <br />
              <span style={{ color: accent }}>&amp;</span> {t.partner2}
            </p>
            <div className="mt-3 flex items-center justify-between border-t pt-2" style={{ borderColor: `${accent}88` }}>
              <span className="font-body text-[10px] uppercase tracking-[0.2em]" style={{ color: text }}>{t.weddingDate}</span>
              <span className="font-body text-[10px] uppercase tracking-[0.2em]" style={{ color: accent }}>{t.location}</span>
            </div>
          </div>
        </div>
      );

    case "arch-window":
      return (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: bg }}>
          <div className="relative h-[84%] w-[58%] overflow-hidden rounded-t-full border-2 shadow-xl" style={{ borderColor: accent }}>
            <Photo />
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 text-center" style={{ background: `linear-gradient(to top, ${bg}ee, transparent 60%)` }}>
              <p className="font-display text-lg font-bold" style={{ color: text }}>{t.couple}</p>
              <p className="font-body text-[9px] mt-0.5" style={{ color: accent }}>{t.weddingDate}</p>
            </div>
          </div>
        </div>
      );

    case "monogram-crest":
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{ backgroundColor: bg }}>
          <Photo className="absolute inset-0 opacity-25" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2" style={{ borderColor: accent }}>
            <span className="font-display text-xl font-bold tracking-widest" style={{ color: accent }}>{initials(t)}</span>
          </div>
          <p className="relative font-display text-xl font-bold mt-3" style={{ color: text }}>{t.couple}</p>
          <p className="relative font-body text-[10px] tracking-[0.25em] uppercase mt-1" style={{ color: `${text}aa` }}>
            {t.weddingDate}
          </p>
        </div>
      );

    case "postcard-stamp":
      return (
        <div className="absolute inset-0 p-3" style={{ backgroundColor: bg }}>
          <div className="relative h-full w-full border border-dashed p-3 flex flex-col" style={{ borderColor: `${accent}aa` }}>
            <div className="flex items-start gap-3">
              <div className="h-16 w-14 flex-shrink-0 overflow-hidden border-2" style={{ borderColor: accent }}>
                <Portrait />
              </div>
              <div className="text-left">
                <p className="font-display text-base font-bold leading-tight" style={{ color: text }}>{t.couple}</p>
                <p className="font-body text-[9px] mt-1" style={{ color: `${text}aa` }}>{t.location}</p>
              </div>
            </div>
            <div className="mt-auto flex items-center justify-between">
              <span className="font-body text-[9px] tracking-[0.25em] uppercase" style={{ color: accent }}>Save the date</span>
              <span className="font-body text-[10px]" style={{ color: text }}>{t.weddingDate}</span>
            </div>
          </div>
        </div>
      );

    case "ribbon-marquee":
      return (
        <div className="absolute inset-0" style={{ backgroundColor: bg }}>
          <Photo className="opacity-70" />
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 py-3 text-center shadow-lg" style={{ backgroundColor: accent }}>
            <p className="font-display text-xl sm:text-2xl font-bold" style={{ color: bg }}>{t.couple}</p>
            <p className="font-body text-[9px] tracking-[0.3em] uppercase mt-0.5" style={{ color: `${bg}cc` }}>{t.weddingDate}</p>
          </div>
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <p className="font-body text-[10px] flex items-center justify-center gap-1" style={{ color: text }}>
              <MapPin className="w-3 h-3" /> {t.location}
            </p>
          </div>
        </div>
      );

    case "duo-collage":
      return (
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-1" style={{ backgroundColor: bg }}>
          <div className="col-span-2 row-span-2 overflow-hidden rounded-md"><Photo /></div>
          <div className="row-span-1 overflow-hidden rounded-md"><Portrait /></div>
          <div className="row-span-1 flex items-center justify-center rounded-md" style={{ backgroundColor: accent }}>
            <Heart className="w-4 h-4" style={{ color: bg }} fill="currentColor" />
          </div>
          <div className="col-span-3 flex flex-col items-center justify-center rounded-md" style={{ backgroundColor: `${bg}` }}>
            <p className="font-display text-lg font-bold" style={{ color: text }}>{t.couple}</p>
            <p className="font-body text-[9px]" style={{ color: accent }}>{t.weddingDate} · {t.location}</p>
          </div>
        </div>
      );

    case "minimal-rule":
      return (
        <div className="absolute inset-0 flex flex-col justify-center px-6" style={{ backgroundColor: bg }}>
          <Photo className="absolute inset-0 opacity-15" />
          <div className="relative">
            <div className="h-px w-full mb-4" style={{ backgroundColor: `${accent}88` }} />
            <p className="font-display text-2xl sm:text-3xl font-light tracking-wide" style={{ color: text }}>
              {t.partner1} <span style={{ color: accent }}>&amp;</span> {t.partner2}
            </p>
            <p className="font-body text-[10px] tracking-[0.35em] uppercase mt-3" style={{ color: `${text}99` }}>
              {t.weddingDate}
            </p>
            <div className="h-px w-full mt-4" style={{ backgroundColor: `${accent}88` }} />
          </div>
        </div>
      );

    case "circle-halo":
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: bg }}>
          <Photo className="absolute inset-0 opacity-35" />
          <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 shadow-xl" style={{ borderColor: accent }}>
            <Portrait />
          </div>
          <p className="relative font-display text-xl font-bold mt-3" style={{ color: text }}>{t.couple}</p>
          <p className="relative font-display italic text-[11px] mt-0.5" style={{ color: accent }}>{t.tagline?.slice(0, 40)}</p>
        </div>
      );

    case "portrait-frame":
    default:
      return (
        <div className="absolute inset-0" style={{ backgroundColor: bg }}>
          <Photo />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${bg}66 0%, ${bg}cc 55%, ${bg}ee 100%)` }} />
          <div className="absolute inset-3 border flex flex-col items-center justify-center text-center p-3" style={{ borderColor: `${accent}99` }}>
            <Heart className="w-3.5 h-3.5 mb-2" style={{ color: accent }} fill="currentColor" />
            <p className="font-display text-2xl font-bold" style={{ color: text }}>{t.couple}</p>
            <p className="font-body text-[10px] mt-1.5" style={{ color: `${text}cc` }}>{t.weddingDate}</p>
            <p className="font-body text-[10px] mt-0.5 flex items-center gap-1" style={{ color: `${text}99` }}>
              <MapPin className="w-3 h-3" /> {t.location}
            </p>
          </div>
        </div>
      );
  }
}

/**
 * The full-width hero used at the top of the template preview — one composition
 * per layout style so the preview matches the tile.
 */
function TemplateHeroComposition({ t, layout, parallaxY = 0 }: { t: Art; layout: TemplateLayoutId; parallaxY?: number }) {
  const l = layout;
  const [bg, accent, rawText] = t.colors;
  const text = readable(rawText, bg);

  const Bg = ({ opacity = 1 }: { opacity?: number }) => (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 will-change-transform" style={{ transform: `translateY(${parallaxY}px) scale(1.15)` }}>
        <img src={t.heroPhoto} alt={`${t.couple} wedding venue at ${t.venue}`} className="w-full h-full object-cover" style={{ opacity }} loading="lazy" decoding="async" />
      </div>
      <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${bg}bb 0%, ${bg}88 40%, ${bg}dd 100%)` }} />
    </div>
  );

  const Meta = () => (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-sm" style={{ color: `${text}cc` }}>
      <span className="flex items-center gap-1.5 font-body"><Calendar className="w-4 h-4" /> {t.weddingDate}</span>
      <span className="w-1 h-1 rounded-full hidden sm:block" style={{ backgroundColor: accent }} />
      <span className="flex items-center gap-1.5 font-body"><MapPin className="w-4 h-4" /> {t.location}</span>
    </div>
  );

  const wrap = "relative" as const;

  switch (l) {
    case "editorial-split":
      return (
        <div className="relative grid grid-cols-1 md:grid-cols-2" style={{ backgroundColor: bg, minHeight: "min(480px, 85vh)" }}>
          <div className="relative min-h-[220px] md:min-h-full">
            <img src={t.heroPhoto} alt={t.couple} className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
          </div>
          <div className="flex flex-col justify-center px-6 sm:px-10 py-10 text-left">
            <p className="font-body text-xs tracking-[0.35em] uppercase mb-4" style={{ color: `${text}99` }}>The Wedding of</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold leading-tight" style={{ color: text }}>
              {t.partner1}<br />
              <span className="italic font-normal" style={{ color: accent }}>and</span><br />
              {t.partner2}
            </h2>
            <div className="h-px w-16 my-6" style={{ backgroundColor: accent }} />
            <p className="font-display text-lg italic mb-6" style={{ color: accent }}>{t.tagline}</p>
            <div className="flex flex-col gap-2 text-sm font-body" style={{ color: `${text}cc` }}>
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {t.weddingDate}</span>
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {t.location}</span>
            </div>
          </div>
        </div>
      );

    case "poster-band":
      return (
        <div className={wrap} style={{ minHeight: "min(480px, 85vh)", backgroundColor: bg }}>
          <Bg opacity={0.65} />
          <div className="relative z-10 flex h-full flex-col justify-end px-6 sm:px-10 pt-24 pb-10">
            <h2 className="font-display font-black uppercase leading-[0.85] tracking-tight text-5xl sm:text-7xl" style={{ color: text }}>
              {t.partner1}<br /><span style={{ color: accent }}>&amp;</span> {t.partner2}
            </h2>
            <p className="font-display italic text-lg mt-4" style={{ color: accent }}>{t.tagline}</p>
            <div className="mt-6 border-t pt-4" style={{ borderColor: `${accent}88` }}><Meta /></div>
          </div>
        </div>
      );

    case "arch-window":
      return (
        <div className={wrap} style={{ minHeight: "min(480px, 85vh)", backgroundColor: bg }}>
          <Bg opacity={0.4} />
          <div className="relative z-10 flex flex-col items-center px-6 pt-14 pb-10 text-center">
            <div className="h-56 w-40 sm:h-72 sm:w-56 overflow-hidden rounded-t-full border-4 shadow-2xl" style={{ borderColor: accent }}>
              <img src={t.couplePhoto} alt={t.couple} className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mt-6" style={{ color: text }}>
              {t.partner1} <span className="italic font-normal" style={{ color: accent }}>&amp;</span> {t.partner2}
            </h2>
            <p className="font-display italic text-lg my-4" style={{ color: accent }}>{t.tagline}</p>
            <Meta />
          </div>
        </div>
      );

    case "monogram-crest":
      return (
        <div className={wrap} style={{ minHeight: "min(480px, 85vh)", backgroundColor: bg }}>
          <Bg opacity={0.3} />
          <div className="relative z-10 flex flex-col items-center px-6 pt-16 pb-10 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2" style={{ borderColor: accent }}>
              <span className="font-display text-3xl font-bold tracking-widest" style={{ color: accent }}>{initials(t)}</span>
            </div>
            <p className="font-body text-xs tracking-[0.35em] uppercase mt-6 mb-3" style={{ color: `${text}99` }}>You are invited</p>
            <h2 className="font-display text-4xl sm:text-6xl font-bold" style={{ color: text }}>{t.couple}</h2>
            <p className="font-display italic text-lg my-4" style={{ color: accent }}>{t.tagline}</p>
            <Meta />
          </div>
        </div>
      );

    case "postcard-stamp":
      return (
        <div className={wrap} style={{ minHeight: "min(480px, 85vh)", backgroundColor: bg }}>
          <Bg opacity={0.35} />
          <div className="relative z-10 px-4 sm:px-8 py-10">
            <div className="mx-auto max-w-xl border-2 border-dashed p-5 sm:p-8" style={{ borderColor: `${accent}aa` }}>
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="h-32 w-28 flex-shrink-0 overflow-hidden border-4" style={{ borderColor: accent }}>
                  <img src={t.couplePhoto} alt={t.couple} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-body text-[11px] tracking-[0.3em] uppercase" style={{ color: accent }}>Save the date</p>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2" style={{ color: text }}>{t.couple}</h2>
                  <p className="font-display italic mt-2" style={{ color: accent }}>{t.tagline}</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t" style={{ borderColor: `${accent}66` }}><Meta /></div>
            </div>
          </div>
        </div>
      );

    case "ribbon-marquee":
      return (
        <div className={wrap} style={{ minHeight: "min(480px, 85vh)", backgroundColor: bg }}>
          <Bg opacity={0.75} />
          <div className="relative z-10 pt-24 pb-10">
            <div className="py-6 px-4 text-center shadow-2xl" style={{ backgroundColor: accent }}>
              <p className="font-body text-[11px] tracking-[0.4em] uppercase" style={{ color: `${bg}cc` }}>The wedding of</p>
              <h2 className="font-display text-4xl sm:text-6xl font-bold mt-1" style={{ color: bg }}>{t.couple}</h2>
            </div>
            <div className="text-center mt-6 px-6">
              <p className="font-display italic text-lg mb-4" style={{ color: accent }}>{t.tagline}</p>
              <Meta />
            </div>
          </div>
        </div>
      );

    case "duo-collage":
      return (
        <div className={wrap} style={{ minHeight: "min(480px, 85vh)", backgroundColor: bg }}>
          <div className="grid grid-cols-2 gap-1 p-1">
            <div className="aspect-[4/5] overflow-hidden"><img src={t.heroPhoto} alt={t.couple} className="w-full h-full object-cover" loading="lazy" decoding="async" /></div>
            <div className="aspect-[4/5] overflow-hidden"><img src={t.couplePhoto} alt={t.couple} className="w-full h-full object-cover" loading="lazy" decoding="async" /></div>
          </div>
          <div className="px-6 py-8 text-center">
            <h2 className="font-display text-3xl sm:text-5xl font-bold" style={{ color: text }}>
              {t.partner1} <span className="italic font-normal" style={{ color: accent }}>&amp;</span> {t.partner2}
            </h2>
            <p className="font-display italic text-lg my-4" style={{ color: accent }}>{t.tagline}</p>
            <Meta />
          </div>
        </div>
      );

    case "minimal-rule":
      return (
        <div className={wrap} style={{ minHeight: "min(480px, 85vh)", backgroundColor: bg }}>
          <Bg opacity={0.2} />
          <div className="relative z-10 flex flex-col justify-center px-6 sm:px-14 py-20">
            <div className="h-px w-full mb-8" style={{ backgroundColor: `${accent}88` }} />
            <h2 className="font-display text-4xl sm:text-6xl font-light tracking-wide text-center" style={{ color: text }}>
              {t.partner1} <span style={{ color: accent }}>&amp;</span> {t.partner2}
            </h2>
            <p className="font-body text-xs tracking-[0.4em] uppercase mt-6 text-center" style={{ color: `${text}99` }}>{t.tagline}</p>
            <div className="h-px w-full mt-8 mb-6" style={{ backgroundColor: `${accent}88` }} />
            <Meta />
          </div>
        </div>
      );

    case "circle-halo":
      return (
        <div className={wrap} style={{ minHeight: "min(480px, 85vh)", backgroundColor: bg }}>
          <Bg opacity={0.45} />
          <div className="relative z-10 flex flex-col items-center px-6 pt-16 pb-10 text-center">
            <div className="relative mb-6">
              <div className="absolute -inset-3 rounded-full" style={{ border: `1px solid ${accent}66` }} />
              <div className="h-36 w-36 sm:h-48 sm:w-48 rounded-full overflow-hidden border-4 shadow-2xl" style={{ borderColor: accent }}>
                <img src={t.couplePhoto} alt={t.couple} className="w-full h-full object-cover" loading="lazy" decoding="async" />
              </div>
            </div>
            <h2 className="font-display text-4xl sm:text-6xl font-bold" style={{ color: text }}>{t.couple}</h2>
            <p className="font-display italic text-lg my-4" style={{ color: accent }}>{t.tagline}</p>
            <Meta />
          </div>
        </div>
      );

    case "portrait-frame":
    default:
      return (
        <div className={wrap} style={{ minHeight: "min(480px, 85vh)", backgroundColor: bg }}>
          <Bg />
          <div className="relative z-10 px-4 sm:px-8 py-10">
            <div className="border p-6 sm:p-10 text-center" style={{ borderColor: `${accent}99` }}>
              <Heart className="w-8 h-8 mx-auto mb-4" style={{ color: accent }} fill="currentColor" />
              <p className="font-body text-sm tracking-[0.25em] uppercase mb-3" style={{ color: `${text}90` }}>
                You're Invited to the Wedding of
              </p>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-3 drop-shadow-lg" style={{ color: text }}>
                {t.partner1} <span className="font-normal italic text-2xl sm:text-3xl mx-1" style={{ color: accent }}>&amp;</span> {t.partner2}
              </h2>
              <p className="font-display text-xl italic mb-6" style={{ color: accent }}>{t.tagline}</p>
              <div className="mx-auto mb-6 w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 shadow-xl" style={{ borderColor: accent }}>
                <img src={t.couplePhoto} alt={`Portrait of ${t.couple}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
              </div>
              <Meta />
            </div>
          </div>
        </div>
      );
  }
}

function RecipeOrnament({ edition, accent }: { edition: number; accent: string }) {
  const common = "pointer-events-none absolute z-20";
  switch (edition) {
    case 0:
      return <div className={`${common} inset-2 border`} style={{ borderColor: `${accent}99` }} />;
    case 1:
      return <><span className={`${common} left-3 top-3 h-8 w-8 rounded-tl-3xl border-l-2 border-t-2`} style={{ borderColor: accent }} /><span className={`${common} bottom-3 right-3 h-8 w-8 rounded-br-3xl border-b-2 border-r-2`} style={{ borderColor: accent }} /></>;
    case 2:
      return <div className={`${common} inset-2 rounded-[1.5rem] border-2`} style={{ borderColor: `${accent}88` }} />;
    case 3:
      return <><span className={`${common} left-4 top-0 h-full w-px`} style={{ backgroundColor: `${accent}77` }} /><span className={`${common} right-4 top-0 h-full w-px`} style={{ backgroundColor: `${accent}77` }} /></>;
    case 4:
      return <div className={`${common} left-3 right-3 top-3 flex justify-between`} style={{ color: accent }}><span>✦</span><span>•</span><span>✦</span><span>•</span><span>✦</span></div>;
    case 5:
      return <div className={`${common} -right-8 top-6 w-28 rotate-45 border-y py-1 text-center text-[8px] font-semibold uppercase tracking-widest`} style={{ color: accent, borderColor: accent }}>Together</div>;
    case 6:
      return <div className={`${common} bottom-3 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border text-[10px] font-bold`} style={{ color: accent, borderColor: accent }}>V</div>;
    case 7:
      return <><span className={`${common} left-3 top-1/2 h-12 w-px -translate-y-1/2`} style={{ backgroundColor: accent }} /><span className={`${common} right-3 top-1/2 h-12 w-px -translate-y-1/2`} style={{ backgroundColor: accent }} /></>;
    case 8:
      return <div className={`${common} inset-x-0 bottom-0 h-1`} style={{ backgroundColor: accent }} />;
    case 9:
    default:
      return <div className={`${common} inset-3 border-4`} style={{ borderColor: `${accent}55` }} />;
  }
}

export function TemplateTileArt({ t, layout, designIndex }: { t: Art; layout?: TemplateLayoutId; designIndex?: number }) {
  const recipe = getTemplateRecipe(t.name ?? t.couple, designIndex);
  const resolvedLayout = layout ?? recipe.layout;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ contentVisibility: "auto", containIntrinsicSize: "240px" }}>
      <TemplateTileComposition t={t} layout={resolvedLayout} />
      <LuxeSurface edition={recipe.edition} accent={t.colors[1]} bg={t.colors[0]} />
      <RecipeOrnament edition={recipe.edition} accent={t.colors[1]} />
    </div>
  );
}

export function TemplateHeroArt({ t, layout, designIndex, parallaxY = 0 }: { t: Art; layout?: TemplateLayoutId; designIndex?: number; parallaxY?: number }) {
  const recipe = getTemplateRecipe(t.name ?? t.couple, designIndex);
  const resolvedLayout = layout ?? recipe.layout;
  return (
    <div className="relative overflow-hidden">
      <TemplateHeroComposition t={t} layout={resolvedLayout} parallaxY={parallaxY} />
      <LuxeSurface edition={recipe.edition} accent={t.colors[1]} bg={t.colors[0]} />
      <RecipeOrnament edition={recipe.edition} accent={t.colors[1]} />
    </div>
  );
}
