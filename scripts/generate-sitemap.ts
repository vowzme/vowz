// Runs before `vite dev` and `vite build` (predev/prebuild hooks).
// Writes public/sitemap.xml from static routes + published blog posts + published wedding sites.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://vowz.me";
const SUPABASE_URL = "https://qkjuywqrncsbxjzwtlzm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFranV5d3FybmNzYnhqend0bHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDIyMTEsImV4cCI6MjA4ODY3ODIxMX0.a-gt44Orc_BoneE7IWQ4Z_t8b0Eo3rTGfcx3ifiSeho";

interface Entry {
  path: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

const staticEntries: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/pricing", changefreq: "monthly", priority: "0.9" },
  { path: "/templates", changefreq: "weekly", priority: "0.9" },
  { path: "/online-wedding-card-maker", changefreq: "monthly", priority: "0.9" },
  { path: "/tools", changefreq: "monthly", priority: "0.8" },
  { path: "/wedding-report", changefreq: "monthly", priority: "0.8" },
  { path: "/showcase", changefreq: "weekly", priority: "0.8" },
  { path: "/themes", changefreq: "weekly", priority: "0.8" },
  { path: "/card-gallery", changefreq: "monthly", priority: "0.7" },
  { path: "/card-templates-preview", changefreq: "monthly", priority: "0.6" },
  { path: "/domain-demo", changefreq: "monthly", priority: "0.6" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/affiliate", changefreq: "monthly", priority: "0.6" },
  { path: "/franchise", changefreq: "monthly", priority: "0.6" },
  { path: "/vendors", changefreq: "weekly", priority: "0.8" },
  { path: "/vendors/signup", changefreq: "monthly", priority: "0.6" },
  ...[
    "photography", "printing", "dress-rental", "decor", "catering",
    "event-management", "makeup", "mehendi", "music", "venues",
  ].map((c) => ({ path: `/vendors/${c}`, changefreq: "weekly", priority: "0.7" }) as Entry),
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/refund-policy", changefreq: "yearly", priority: "0.3" },
];

// No <lastmod> for static routes: the build date is not a page-specific
// "last significant change" timestamp, so we omit it rather than fake it.

async function fetchBlogEntries(): Promise<Entry[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,published_at,updated_at&status=eq.published`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      },
    );
    if (!res.ok) {
      console.warn(`[sitemap] blog fetch failed: ${res.status}`);
      return [];
    }
    const rows = (await res.json()) as Array<{
      slug: string;
      published_at: string | null;
      updated_at: string | null;
    }>;
    return rows.map((r) => ({
      path: `/blog/${r.slug}`,
      lastmod: (r.updated_at || r.published_at || "").slice(0, 10) || undefined,
      changefreq: "monthly",
      priority: "0.7",
    }));
  } catch (err) {
    console.warn(`[sitemap] blog fetch error:`, err);
    return [];
  }
}

async function fetchPublishedSites(): Promise<Entry[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/wedding_sites?select=slug,updated_at&is_published=eq.true&status=eq.active`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      },
    );
    if (!res.ok) {
      console.warn(`[sitemap] sites fetch failed: ${res.status}`);
      return [];
    }
    const rows = (await res.json()) as Array<{
      slug: string | null;
      updated_at: string | null;
    }>;
    return rows
      .filter((r) => r.slug)
      .map((r) => ({
        path: `/site/${r.slug}`,
        lastmod: r.updated_at ? r.updated_at.slice(0, 10) : undefined,
        changefreq: "weekly",
        priority: "0.8",
      }));
  } catch (err) {
    console.warn(`[sitemap] sites fetch error:`, err);
    return [];
  }
}

function xml(entries: Entry[]) {
  const urls = entries
    .map((e) =>
      [
        `  <url>`,
        `    <loc>${BASE_URL}${e.path}</loc>`,
        e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
        e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
        e.priority ? `    <priority>${e.priority}</priority>` : null,
        `  </url>`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function main() {
  const [blog, sites] = await Promise.all([fetchBlogEntries(), fetchPublishedSites()]);
  const entries = [...staticEntries, ...blog, ...sites];
  const seen = new Set<string>();
  const unique = entries.filter((e) => {
    if (seen.has(e.path)) return false;
    seen.add(e.path);
    return true;
  });
  writeFileSync(resolve("public/sitemap.xml"), xml(unique));
  console.log(`sitemap.xml written (${unique.length} entries)`);
}

main();
