// 10 curated wedding theme collections. Each theme is a self-contained visual
// preset: colors, font pair, hero motif, background pattern, and short copy.
// Used by /themes gallery for live preview + one-click apply to a user's site.

export type WeddingTheme = {
  id: string;
  name: string;
  tradition: string;
  tagline: string;
  description: string;
  colors: {
    bg: string;
    accent: string;
    light: string;
    surface: string;
    ink: string;
  };
  fonts: { display: string; body: string };
  motif: "mandala" | "arch" | "waves" | "palm" | "alpona" | "haveli" | "cross" | "boho" | "temple" | "khanda";
  heroGradient: string;
  sampleCouple: [string, string];
  sampleTagline: string;
  /** "luxe" themes are only available to couples who unlocked LUXE. */
  tier?: "standard" | "luxe";
  /** Curated theme id this design inherits starter copy + demo photos from. */
  family?: string;
};

import { GENERATED_STANDARD_THEMES, GENERATED_LUXE_THEMES } from "@/lib/theme-library";

export const WEDDING_THEMES: WeddingTheme[] = [
  {
    id: "royal-rajput",
    name: "Royal Rajput",
    tradition: "North Indian · Rajasthani",
    tagline: "Palace-grade regal maroon & gold",
    description: "Deep maroon velvet with intricate gold mandalas, inspired by the courtyards of Udaipur and Jaipur havelis.",
    colors: { bg: "#5B0A17", accent: "#E7B24B", light: "#FFF3D6", surface: "#FFF8EC", ink: "#2A0810" },
    fonts: { display: "Cormorant Garamond", body: "Cormorant" },
    motif: "mandala",
    heroGradient: "linear-gradient(135deg,#5B0A17 0%,#7A1226 55%,#3E0510 100%)",
    sampleCouple: ["Aarav", "Priya"],
    sampleTagline: "Where two royal hearts unite",
  },
  {
    id: "south-indian-temple",
    name: "South Indian Temple",
    tradition: "Tamil · Telugu · Kannada",
    tagline: "Kanjeevaram silk reds & temple gold",
    description: "Vermillion, sandal, and turmeric tones with kolam motifs — a classic temple wedding aesthetic.",
    colors: { bg: "#8B1B1F", accent: "#F2C14E", light: "#FFF1D6", surface: "#FFF6E4", ink: "#2A0F10" },
    fonts: { display: "Yeseva One", body: "Lora" },
    motif: "temple",
    heroGradient: "linear-gradient(135deg,#8B1B1F 0%,#A83232 60%,#5A0F14 100%)",
    sampleCouple: ["Karthik", "Divya"],
    sampleTagline: "Blessed by tradition, bound by love",
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    tradition: "Contemporary · Editorial",
    tagline: "Warm ivory, deep ink, refined type",
    description: "Magazine-grade whitespace with a single serif accent. Perfect for city weddings.",
    colors: { bg: "#F6F1EA", accent: "#C6A55A", light: "#1A1815", surface: "#FFFFFF", ink: "#1A1815" },
    fonts: { display: "Playfair Display", body: "Inter" },
    motif: "arch",
    heroGradient: "linear-gradient(135deg,#F6F1EA 0%,#EDE4D3 100%)",
    sampleCouple: ["Rohan", "Ananya"],
    sampleTagline: "A quiet love, boldly declared",
  },
  {
    id: "bengali-alpona",
    name: "Bengali Alpona",
    tradition: "Bengali · Assamese",
    tagline: "White alpona on terracotta red",
    description: "Terracotta warmth with delicate white alpona patterns — a Rabindrik, poetic mood.",
    colors: { bg: "#B7442A", accent: "#F5E9C9", light: "#FFF7E7", surface: "#FFF3E1", ink: "#2C1005" },
    fonts: { display: "Cinzel", body: "Merriweather" },
    motif: "alpona",
    heroGradient: "linear-gradient(135deg,#B7442A 0%,#8E2C18 100%)",
    sampleCouple: ["Arko", "Sohini"],
    sampleTagline: "Shubho parinoy — a poem beginning",
  },
  {
    id: "goa-beach",
    name: "Goa Beach",
    tradition: "Coastal · Destination",
    tagline: "Turquoise seas & sun-warmed coral",
    description: "Breezy turquoise, coral, and driftwood tones for beach and destination weddings.",
    colors: { bg: "#0E7C86", accent: "#F4A26D", light: "#F1FBFB", surface: "#FBF9F3", ink: "#0A2F33" },
    fonts: { display: "Fraunces", body: "Poppins" },
    motif: "waves",
    heroGradient: "linear-gradient(135deg,#0E7C86 0%,#1FA8AF 60%,#F4A26D 100%)",
    sampleCouple: ["Neil", "Zara"],
    sampleTagline: "Toes in sand, hearts at sea",
  },
  {
    id: "kerala-backwaters",
    name: "Kerala Backwaters",
    tradition: "Malayali · Coastal South",
    tagline: "Palm greens, brass, off-white mundu",
    description: "Emerald palm greens and antique brass on cream — Kerala houseboat wedding energy.",
    colors: { bg: "#0F5A3A", accent: "#C79A3E", light: "#FBF6E7", surface: "#FFFBEF", ink: "#0B2417" },
    fonts: { display: "Cormorant Garamond", body: "Lora" },
    motif: "palm",
    heroGradient: "linear-gradient(135deg,#0F5A3A 0%,#187547 55%,#08381F 100%)",
    sampleCouple: ["Arjun", "Meera"],
    sampleTagline: "In God's own country, our forever begins",
  },
  {
    id: "punjabi-anand-karaj",
    name: "Punjabi Anand Karaj",
    tradition: "Sikh · Punjabi",
    tagline: "Saffron, kesari & pure white",
    description: "Saffron and marigold on ivory with a khanda motif — a joyous Anand Karaj mood.",
    colors: { bg: "#E38B1F", accent: "#8B1E3F", light: "#FFF8EA", surface: "#FFFBF2", ink: "#2A140A" },
    fonts: { display: "Yeseva One", body: "Inter" },
    motif: "khanda",
    heroGradient: "linear-gradient(135deg,#E38B1F 0%,#F2A93B 60%,#B85E0F 100%)",
    sampleCouple: ["Harman", "Simran"],
    sampleTagline: "Ik Onkar — one love, one journey",
  },
  {
    id: "marwari-haveli",
    name: "Marwari Haveli",
    tradition: "Marwari · Rajasthani",
    tagline: "Sandstone pink, mirror-work, ivory",
    description: "Jaipur pink and inlaid mirror-work energy with airy ivory whitespace.",
    colors: { bg: "#D46C82", accent: "#7A2E4A", light: "#FFF3F6", surface: "#FFFAFB", ink: "#3A0F1E" },
    fonts: { display: "Cormorant Garamond", body: "Cormorant" },
    motif: "haveli",
    heroGradient: "linear-gradient(135deg,#D46C82 0%,#E890A2 55%,#A44863 100%)",
    sampleCouple: ["Vivaan", "Kiara"],
    sampleTagline: "Written in the stars of Jodhpur skies",
  },
  {
    id: "christian-chapel",
    name: "Christian Chapel",
    tradition: "Christian · Catholic",
    tagline: "Soft blush, dove white & sage",
    description: "Cathedral-soft blush, sage, and dove white with a fine cross accent.",
    colors: { bg: "#EDDBD3", accent: "#6E7F5B", light: "#3A2A26", surface: "#FFFFFF", ink: "#2A1E1B" },
    fonts: { display: "Fraunces", body: "Inter" },
    motif: "cross",
    heroGradient: "linear-gradient(135deg,#EDDBD3 0%,#F7ECE5 60%,#DCC7BC 100%)",
    sampleCouple: ["Ethan", "Grace"],
    sampleTagline: "Two souls, one covenant",
  },
  {
    id: "boho-destination",
    name: "Boho Destination",
    tradition: "Boho · Global · Destination",
    tagline: "Terracotta, dusk pink & desert sage",
    description: "Sun-baked terracotta with dried florals and desert sage — Marrakech-meets-Jaisalmer.",
    colors: { bg: "#B25E3C", accent: "#EAC9A3", light: "#FDF5EC", surface: "#FBF3E8", ink: "#2E1608" },
    fonts: { display: "Fraunces", body: "Poppins" },
    motif: "boho",
    heroGradient: "linear-gradient(135deg,#B25E3C 0%,#D68960 55%,#7E3C22 100%)",
    sampleCouple: ["Kabir", "Ira"],
    sampleTagline: "Wandering hearts, finally home",
  },
  {
    id: "nikah-emerald",
    name: "Nikah Emerald",
    tradition: "Muslim · Nikah",
    tagline: "Emerald green, ivory & antique gold",
    description: "Deep emerald with antique gold jaali arches and ivory calligraphy space — made for a Nikah, Mehendi and Walima.",
    colors: { bg: "#0B3B2E", accent: "#D4AF37", light: "#FFF8E8", surface: "#FFFCF3", ink: "#06211A" },
    fonts: { display: "Cormorant Garamond", body: "Lora" },
    motif: "arch",
    heroGradient: "linear-gradient(135deg,#0B3B2E 0%,#125645 55%,#06251D 100%)",
    sampleCouple: ["Zayn", "Ayesha"],
    sampleTagline: "Qubool hai — from this day, together",
  },
  {
    id: "walima-rose",
    name: "Walima Rose",
    tradition: "Muslim · Walima",
    tagline: "Dusty rose, pearl & soft gold",
    description: "A softer Nikah palette — dusty rose and pearl with fine gold crescents, ideal for the Walima reception.",
    colors: { bg: "#7C4257", accent: "#E6C79C", light: "#FFF4F0", surface: "#FFFAF7", ink: "#33131F" },
    fonts: { display: "Fraunces", body: "Inter" },
    motif: "arch",
    heroGradient: "linear-gradient(135deg,#7C4257 0%,#9E5A70 55%,#54293A 100%)",
    sampleCouple: ["Imran", "Fatima"],
    sampleTagline: "Two families, one dua",
  },
  // ——— LUXE collection ———
  // Reserved for couples who have unlocked LUXE. Same one-time unlock as the
  // LUXE invitation cards: unlock once, use the cards and these websites.
  {
    id: "luxe-ivory-royale",
    name: "Ivory Royale",
    tradition: "LUXE · Heritage Ivory",
    tagline: "Hand-gilded ivory, champagne & old gold",
    description: "Museum-quality ivory with hand-gilded borders, champagne foil headings and generous editorial spacing — our most requested luxury look.",
    colors: { bg: "#F7F1E6", accent: "#B08A3E", light: "#FFFDF8", surface: "#FFFFFF", ink: "#2B2418" },
    fonts: { display: "Cormorant Garamond", body: "Lora" },
    motif: "arch",
    heroGradient: "linear-gradient(135deg,#FBF6EC 0%,#EFE3CC 55%,#E2D2B3 100%)",
    sampleCouple: ["Aditya", "Meera"],
    sampleTagline: "A heritage love, written in gold",
    tier: "luxe",
  },
  {
    id: "luxe-midnight-meenakari",
    name: "Midnight Meenakari",
    tradition: "LUXE · Jewelled Midnight",
    tagline: "Midnight blue, enamel jewel tones & gold",
    description: "Deep midnight blue with meenakari enamel jewels and fine gold filigree — a black-tie Indian wedding in website form.",
    colors: { bg: "#111C3A", accent: "#E3B54A", light: "#F6F2E6", surface: "#FFFDF6", ink: "#080E1F" },
    fonts: { display: "Cinzel", body: "Inter" },
    motif: "mandala",
    heroGradient: "linear-gradient(135deg,#111C3A 0%,#1D2F5C 55%,#070D1C 100%)",
    sampleCouple: ["Vikram", "Anaya"],
    sampleTagline: "Under a jewelled midnight sky",
    tier: "luxe",
  },
  {
    id: "luxe-emerald-heirloom",
    name: "Emerald Heirloom",
    tradition: "LUXE · Velvet Emerald",
    tagline: "Velvet emerald, pearl & antique gold",
    description: "Velvet emerald panels, pearl detailing and antique-gold rules — heirloom jewellery translated into a wedding website.",
    colors: { bg: "#07382C", accent: "#CBA85C", light: "#F4F8F3", surface: "#FFFCF4", ink: "#041F18" },
    fonts: { display: "Playfair Display", body: "Merriweather" },
    motif: "haveli",
    heroGradient: "linear-gradient(135deg,#07382C 0%,#0E5442 55%,#04231B 100%)",
    sampleCouple: ["Rehan", "Saira"],
    sampleTagline: "An heirloom promise, kept forever",
    tier: "luxe",
  },
];

// Expand the curated families into the full catalogue (100 standard + 100 LUXE).
WEDDING_THEMES.push(...GENERATED_STANDARD_THEMES, ...GENERATED_LUXE_THEMES);

export const LUXE_THEME_IDS = WEDDING_THEMES.filter((t) => t.tier === "luxe").map((t) => t.id);
export const isLuxeTheme = (id?: string | null) => !!id && LUXE_THEME_IDS.includes(id);

export function getTheme(id: string): WeddingTheme | undefined {
  return WEDDING_THEMES.find((t) => t.id === id);
}
