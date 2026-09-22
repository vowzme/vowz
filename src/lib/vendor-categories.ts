export interface VendorCategory {
  id: string;
  label: string;
  emoji: string;
  blurb: string;
}

export const VENDOR_CATEGORIES: VendorCategory[] = [
  { id: "photography", label: "Photography & Film", emoji: "📸", blurb: "Candid photographers, cinematographers and drone teams." },
  { id: "printing", label: "Printing & Stationery", emoji: "🖨️", blurb: "Invitation printing, boxes, tags and signage." },
  { id: "dress-rental", label: "Dress & Jewellery Rental", emoji: "👗", blurb: "Bridal lehengas, sherwanis and heirloom jewellery." },
  { id: "decor", label: "Decor & Florals", emoji: "🌸", blurb: "Mandap, stage, floral and lighting design." },
  { id: "catering", label: "Catering", emoji: "🍽️", blurb: "Multi-cuisine caterers, live counters and desserts." },
  { id: "event-management", label: "Event Management", emoji: "🎪", blurb: "Full-service planners and day-of coordinators." },
  { id: "makeup", label: "Makeup & Hair", emoji: "💄", blurb: "Bridal makeup artists and hairstylists." },
  { id: "mehendi", label: "Mehendi", emoji: "🪷", blurb: "Bridal and guest mehendi artists." },
  { id: "music", label: "Music & Entertainment", emoji: "🎶", blurb: "DJs, live bands, dhol and choreographers." },
  { id: "venues", label: "Venues & Banquets", emoji: "🏛️", blurb: "Resorts, banquet halls and destination venues." },
];

export const vendorCategory = (id: string | null | undefined): VendorCategory | undefined =>
  VENDOR_CATEGORIES.find((c) => c.id === id);

export const vendorCategoryLabel = (id: string | null | undefined): string =>
  vendorCategory(id)?.label ?? "Wedding services";

export function vendorSlugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export interface VendorService {
  name: string;
  price?: string;
  description?: string;
}

export interface VendorRow {
  id: string;
  user_id: string;
  slug: string;
  business_name: string;
  category: string;
  tagline: string | null;
  about: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  service_areas: string[] | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  logo_url: string | null;
  cover_url: string | null;
  gallery: string[] | null;
  services: VendorService[] | null;
  hours: string | null;
  price_from: number | null;
  currency: string | null;
  status: string;
  is_featured: boolean;
  rating: number | null;
  review_count: number | null;
  created_at?: string;
}
