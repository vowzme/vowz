// Auto-generated theme library.
// A compact generator that expands the 12 curated "families" into a large,
// varied catalogue of wedding designs (100 standard + 100 LUXE).
//
// Every generated theme carries a `family` pointing at a curated theme id, so
// starter copy (theme-templates) and demo photography (theme-demo-sites) are
// inherited automatically — which keeps demo previews realistic.

import type { ThemeArchetype, WeddingTheme } from "@/lib/wedding-themes";

const ARCHETYPE_CYCLE: ThemeArchetype[] = [
  "classic",
  "editorial",
  "poster",
  "framed",
  "monogram",
  "column",
  "arcade",
  "ticket",
  "marquee",
  "collage",
  "stamp",
  "timeline",
  "halo",
  "panel",
  "scroll",
  "grid",
];

type Family = {
  id: string; // must match a curated theme id (for copy + photo inheritance)
  short: string;
  tradition: string;
  motif: WeddingTheme["motif"];
  couple: [string, string];
  note: string;
};

const FAMILIES: Family[] = [
  { id: "royal-rajput", short: "Rajput Palace", tradition: "North Indian · Rajasthani", motif: "mandala", couple: ["Aarav", "Priya"], note: "palace courtyards and mirror-work mandalas" },
  { id: "south-indian-temple", short: "Temple Silk", tradition: "Tamil · Telugu · Kannada", motif: "temple", couple: ["Karthik", "Divya"], note: "kolam mornings and Kanjeevaram silk" },
  { id: "bengali-alpona", short: "Alpona", tradition: "Bengali · Assamese", motif: "alpona", couple: ["Arko", "Sohini"], note: "terracotta warmth with hand-drawn alpona" },
  { id: "punjabi-anand-karaj", short: "Anand Karaj", tradition: "Sikh · Punjabi", motif: "khanda", couple: ["Jasleen", "Manav"], note: "dhol-driven joy and phulkari brights" },
  { id: "marwari-haveli", short: "Haveli", tradition: "Marwari · Rajasthani", motif: "haveli", couple: ["Vivaan", "Nandini"], note: "jharokha arches and hand-block borders" },
  { id: "nikah-emerald", short: "Nikah", tradition: "Muslim · Nikah", motif: "arch", couple: ["Zayan", "Aliya"], note: "jaali arches with antique gold calligraphy" },
  { id: "walima-rose", short: "Walima", tradition: "Muslim · Walima", motif: "arch", couple: ["Ibrahim", "Sana"], note: "soft rose Walima elegance" },
  { id: "christian-chapel", short: "Chapel", tradition: "Christian · Catholic", motif: "cross", couple: ["Ryan", "Maria"], note: "cathedral hush and blush florals" },
  { id: "modern-minimal", short: "Editorial", tradition: "Contemporary · Editorial", motif: "arch", couple: ["Rohan", "Ananya"], note: "magazine whitespace with one refined accent" },
  { id: "goa-beach", short: "Shoreline", tradition: "Coastal · Destination", motif: "waves", couple: ["Neil", "Tara"], note: "barefoot sunsets and salt-air vows" },
  { id: "kerala-backwaters", short: "Backwaters", tradition: "Malayali · Coastal South", motif: "palm", couple: ["Abhay", "Meera"], note: "coconut palms and quiet backwater light" },
  { id: "boho-destination", short: "Boho Garden", tradition: "Boho · Global · Destination", motif: "boho", couple: ["Kabir", "Ishita"], note: "pampas, linen and long-table feasts" },
];

type Palette = {
  slug: string;
  name: string;
  tagline: string;
  colors: WeddingTheme["colors"];
  grad: [string, string, string];
  fonts: { display: string; body: string };
};

const STANDARD_PALETTES: Palette[] = [
  { slug: "rose-gold", name: "Rose Gold", tagline: "Blush petals with warm rose-gold light", colors: { bg: "#8C3A52", accent: "#E7B7A0", light: "#FFF1EC", surface: "#FFF8F4", ink: "#2B0F18" }, grad: ["#8C3A52", "#B4596F", "#5D1F32"], fonts: { display: "Playfair Display", body: "Inter" } },
  { slug: "emerald", name: "Emerald Silk", tagline: "Deep emerald with soft antique gold", colors: { bg: "#0F4034", accent: "#D8B570", light: "#EFF7F1", surface: "#FBFDF9", ink: "#08201A" }, grad: ["#0F4034", "#1B5C49", "#08261E"], fonts: { display: "Cormorant Garamond", body: "Lora" } },
  { slug: "midnight", name: "Midnight Ink", tagline: "Night-sky navy with candle gold", colors: { bg: "#111C33", accent: "#D9B45B", light: "#EEF2F9", surface: "#FAFBFF", ink: "#080E1C" }, grad: ["#111C33", "#1D2C4C", "#070C18"], fonts: { display: "Cinzel", body: "Inter" } },
  { slug: "saffron", name: "Saffron Bloom", tagline: "Marigold saffron and turmeric warmth", colors: { bg: "#B5541B", accent: "#F4C95D", light: "#FFF4DF", surface: "#FFF9EE", ink: "#341403" }, grad: ["#B5541B", "#D97B2C", "#7A330C"], fonts: { display: "Yeseva One", body: "Lora" } },
  { slug: "ivory", name: "Ivory Bloom", tagline: "Airy ivory with a single champagne line", colors: { bg: "#F7F2E9", accent: "#C4A164", light: "#20201C", surface: "#FFFFFF", ink: "#20201C" }, grad: ["#F7F2E9", "#EFE6D6", "#F7F2E9"], fonts: { display: "Playfair Display", body: "Inter" } },
  { slug: "plum", name: "Plum Velvet", tagline: "Velvet plum with soft pearl light", colors: { bg: "#4A1D46", accent: "#E2C07E", light: "#F8EFF7", surface: "#FFF9FD", ink: "#220A20" }, grad: ["#4A1D46", "#6A2C62", "#2E0F2B"], fonts: { display: "Cormorant Garamond", body: "Merriweather" } },
  { slug: "teal", name: "Peacock Teal", tagline: "Peacock teal with copper detailing", colors: { bg: "#0D4650", accent: "#E09A5A", light: "#E9F6F6", surface: "#F8FDFD", ink: "#05262C" }, grad: ["#0D4650", "#166573", "#062C33"], fonts: { display: "Fraunces", body: "Poppins" } },
  { slug: "terracotta", name: "Terracotta Sun", tagline: "Sun-baked terracotta and cream", colors: { bg: "#A8452C", accent: "#F0DCC0", light: "#FFF4E9", surface: "#FFF8F1", ink: "#2F0F06" }, grad: ["#A8452C", "#C45C3C", "#71291A"], fonts: { display: "Fraunces", body: "Inter" } },
  { slug: "sage", name: "Sage Garden", tagline: "Garden sage with warm sand", colors: { bg: "#3C4F3D", accent: "#D9C08A", light: "#F1F5EE", surface: "#FBFDF8", ink: "#1A241A" }, grad: ["#3C4F3D", "#546B54", "#243024"], fonts: { display: "Cormorant Garamond", body: "Poppins" } },
  { slug: "pearl-blue", name: "Pearl Blue", tagline: "Powder blue with pearl-white calm", colors: { bg: "#2C4A6E", accent: "#E6D3A3", light: "#EEF4FB", surface: "#FBFDFF", ink: "#0F1F31" }, grad: ["#2C4A6E", "#3F6491", "#1A2E47"], fonts: { display: "Playfair Display", body: "Lora" } },
];

const LUXE_PALETTES: Palette[] = [
  { slug: "gold-leaf", name: "Gold Leaf", tagline: "Hand-gilded gold leaf on deep ivory", colors: { bg: "#1B1710", accent: "#E9C87A", light: "#FBF4E6", surface: "#FFFBF2", ink: "#100D08" }, grad: ["#1B1710", "#3A2F1D", "#0D0B06"], fonts: { display: "Cormorant Garamond", body: "Lora" } },
  { slug: "velvet-noir", name: "Velvet Noir", tagline: "Black velvet with candlelit brass", colors: { bg: "#0C0C0E", accent: "#C9A356", light: "#F4F1EA", surface: "#FFFDF8", ink: "#050506" }, grad: ["#0C0C0E", "#21212A", "#050506"], fonts: { display: "Cinzel", body: "Inter" } },
  { slug: "meenakari", name: "Meenakari", tagline: "Jewelled enamel blues and ruby fire", colors: { bg: "#0B2455", accent: "#E4B24A", light: "#EDF2FC", surface: "#FBFCFF", ink: "#04122E" }, grad: ["#0B2455", "#16376F", "#050F2B"], fonts: { display: "Cinzel", body: "Merriweather" } },
  { slug: "champagne", name: "Champagne Silk", tagline: "Champagne silk with pearl stitching", colors: { bg: "#F3EAD9", accent: "#B08C4F", light: "#241E14", surface: "#FFFDF7", ink: "#241E14" }, grad: ["#F3EAD9", "#E6D8BE", "#F3EAD9"], fonts: { display: "Playfair Display", body: "Inter" } },
  { slug: "ruby", name: "Ruby Heirloom", tagline: "Heirloom ruby with hand-beaten gold", colors: { bg: "#54101F", accent: "#EBC06A", light: "#FFF0E9", surface: "#FFF8F3", ink: "#2A0710" }, grad: ["#54101F", "#7A1B31", "#340813"], fonts: { display: "Cormorant Garamond", body: "Cormorant" } },
  { slug: "jade", name: "Jade Atelier", tagline: "Carved jade with soft brushed brass", colors: { bg: "#0A3B31", accent: "#D9B871", light: "#EBF6F1", surface: "#F9FDFB", ink: "#04221C" }, grad: ["#0A3B31", "#125345", "#05251E"], fonts: { display: "Playfair Display", body: "Lora" } },
  { slug: "onyx-rose", name: "Onyx Rose", tagline: "Onyx depth lit by antique rose", colors: { bg: "#231920", accent: "#E3AFA4", light: "#FBEFEE", surface: "#FFF9F8", ink: "#130C11" }, grad: ["#231920", "#3C2B36", "#120A0F"], fonts: { display: "Fraunces", body: "Inter" } },
  { slug: "sapphire", name: "Sapphire Court", tagline: "Court sapphire with moonlit silver-gold", colors: { bg: "#111F4B", accent: "#D6C08B", light: "#EDF0FA", surface: "#FBFCFF", ink: "#070E26" }, grad: ["#111F4B", "#1E3170", "#070E26"], fonts: { display: "Cinzel", body: "Lora" } },
  { slug: "pearl-white", name: "Pearl Atelier", tagline: "Pearl white with a whisper of platinum", colors: { bg: "#FAF7F2", accent: "#9C8558", light: "#1D1B17", surface: "#FFFFFF", ink: "#1D1B17" }, grad: ["#FAF7F2", "#EFE9DE", "#FAF7F2"], fonts: { display: "Cormorant Garamond", body: "Inter" } },
  { slug: "copper-dusk", name: "Copper Dusk", tagline: "Dusk copper over smoked charcoal", colors: { bg: "#2A211C", accent: "#D79A62", light: "#FAF1E8", surface: "#FFFAF4", ink: "#150F0C" }, grad: ["#2A211C", "#453730", "#150F0C"], fonts: { display: "Fraunces", body: "Poppins" } },
];

function build(fam: Family, pal: Palette, luxe: boolean, seed: number): WeddingTheme {
  const id = `${luxe ? "luxe" : "wt"}-${fam.id}-${pal.slug}`;
  const archetype = ARCHETYPE_CYCLE[seed % ARCHETYPE_CYCLE.length];
  return {
    id,
    name: `${fam.short} · ${pal.name}`,
    tradition: fam.tradition,
    tagline: pal.tagline,
    description: (() => {
      const base = `${luxe ? "A signature edition of " : ""}${fam.note}, styled in ${pal.name.toLowerCase()}. Mobile-first layout with fast-loading sections for story, schedule, travel, gallery and RSVP.`;
      return base.charAt(0).toUpperCase() + base.slice(1);
    })(),
    colors: pal.colors,
    fonts: pal.fonts,
    motif: fam.motif,
    archetype,
    heroGradient: `linear-gradient(135deg,${pal.grad[0]} 0%,${pal.grad[1]} 55%,${pal.grad[2]} 100%)`,
    sampleCouple: fam.couple,
    sampleTagline: luxe ? "An heirloom celebration, beautifully told" : "Two families, one joyful beginning",
    tier: "standard",
    family: fam.id,
  };
}

/** Variant-major interleave so slicing keeps every family represented. */
function generate(luxe: boolean, count: number): WeddingTheme[] {
  const palettes = luxe ? LUXE_PALETTES : STANDARD_PALETTES;
  const out: WeddingTheme[] = [];
  palettes.forEach((pal, pi) => {
    FAMILIES.forEach((fam, fi) => {
      if (out.length >= count) return;
      out.push(build(fam, pal, luxe, pi * 5 + fi * 3 + (luxe ? 7 : 0)));
    });
  });
  return out;
}

// 12 curated standard + 88 generated = 100 standard themes.
export const GENERATED_STANDARD_THEMES = generate(false, 88);
// 3 curated LUXE + 97 generated = 100 LUXE themes.
export const GENERATED_LUXE_THEMES = generate(true, 97);
