// Dynamic sitemap.xml — static routes + all published blog posts + published wedding sites.
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BASE = "https://vowz.me";

const STATIC: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/pricing", changefreq: "monthly", priority: "0.8" },
  { path: "/templates", changefreq: "monthly", priority: "0.8" },
  { path: "/showcase", changefreq: "monthly", priority: "0.6" },
  { path: "/card-gallery", changefreq: "monthly", priority: "0.7" },
  { path: "/card-templates-preview", changefreq: "monthly", priority: "0.6" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/affiliate", changefreq: "monthly", priority: "0.5" },
  { path: "/franchise", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/refund-policy", changefreq: "yearly", priority: "0.3" },
];

Deno.serve(async () => {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: posts } = await admin
    .from("blog_posts")
    .select("slug, published_at, updated_at")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  const { data: sites } = await admin
    .from("wedding_sites")
    .select("slug, updated_at")
    .eq("is_published", true)
    .eq("status", "active")
    .not("slug", "is", null);

  const urls: string[] = [];
  for (const r of STATIC) {
    urls.push(
      `<url><loc>${BASE}${r.path}</loc><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`,
    );
  }
  for (const p of posts ?? []) {
    const lastmod = (p.updated_at ?? p.published_at) as string | null;
    urls.push(
      `<url><loc>${BASE}/blog/${p.slug}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ""}<changefreq>monthly</changefreq><priority>0.6</priority></url>`,
    );
  }
  for (const s of sites ?? []) {
    if (!s.slug) continue;
    const lastmod = s.updated_at as string | null;
    urls.push(
      `<url><loc>${BASE}/site/${s.slug}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ""}<changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
