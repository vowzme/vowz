import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const SUPABASE_URL = "https://qkjuywqrncsbxjzwtlzm.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFranV5d3FybmNzYnhqend0bHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDIyMTEsImV4cCI6MjA4ODY3ODIxMX0.a-gt44Orc_BoneE7IWQ4Z_t8b0Eo3rTGfcx3ifiSeho";

async function fetchRows<T>(path: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  return (await res.json()) as T[];
}

describe("sitemap.xml covers all published dynamic routes", () => {
  const xml = readFileSync(resolve("public/sitemap.xml"), "utf8");

  it("includes every published blog post slug", async () => {
    const posts = await fetchRows<{ slug: string }>(
      "blog_posts?select=slug&status=eq.published",
    );
    for (const p of posts) {
      expect(xml).toContain(`/blog/${p.slug}<`);
    }
  });

  it("includes every published wedding site slug", async () => {
    const sites = await fetchRows<{ slug: string | null }>(
      "wedding_sites?select=slug&is_published=eq.true&status=eq.active",
    );
    for (const s of sites) {
      if (!s.slug) continue;
      expect(xml).toContain(`/site/${s.slug}<`);
    }
  });
});