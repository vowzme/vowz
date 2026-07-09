import { describe, it, expect } from "vitest";

const SUPABASE_URL = "https://qkjuywqrncsbxjzwtlzm.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFranV5d3FybmNzYnhqend0bHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDIyMTEsImV4cCI6MjA4ODY3ODIxMX0.a-gt44Orc_BoneE7IWQ4Z_t8b0Eo3rTGfcx3ifiSeho";

type Section = { type?: string; id?: string; enabled?: boolean };
type Site = {
  id: string;
  slug: string | null;
  partner1: string | null;
  partner2: string | null;
  sections: Section[] | null;
  is_published: boolean;
  status: string;
};

async function fetchPublishedSites(): Promise<Site[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/wedding_sites?select=id,slug,partner1,partner2,sections,is_published,status&is_published=eq.true&status=eq.active`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
  );
  expect(res.ok, `anon SELECT on wedding_sites failed: ${res.status}`).toBe(true);
  return (await res.json()) as Site[];
}

describe("every published wedding site loads for a guest", () => {
  it("anon can read at least one published site (RLS grants intact)", async () => {
    const sites = await fetchPublishedSites();
    expect(sites.length).toBeGreaterThan(0);
  });

  it("each published site has required fields for guest rendering", async () => {
    const sites = await fetchPublishedSites();
    for (const s of sites) {
      expect(s.slug, `site ${s.id} missing slug`).toBeTruthy();
      expect(s.partner1, `site ${s.slug} missing partner1`).toBeTruthy();
      expect(s.partner2, `site ${s.slug} missing partner2`).toBeTruthy();
      expect(Array.isArray(s.sections), `site ${s.slug} sections not array`).toBe(true);
      expect((s.sections ?? []).length, `site ${s.slug} has no sections`).toBeGreaterThan(0);
    }
  });

  it("each published site includes the core section types", async () => {
    const sites = await fetchPublishedSites();
    // Core sections that the public site page always tries to render.
    const CORE = ["hero", "story", "events", "rsvp"];
    for (const s of sites) {
      const types = (s.sections ?? [])
        .map((sec) => (sec?.type ?? sec?.id ?? "").toLowerCase())
        .filter(Boolean);
      for (const core of CORE) {
        expect(
          types.includes(core),
          `site ${s.slug} missing core section "${core}" (found: ${types.join(", ")})`,
        ).toBe(true);
      }
    }
  });

  it("each published site's public route responds 200 with the SPA shell", async () => {
    const sites = await fetchPublishedSites();
    const base = process.env.PREVIEW_URL ?? "http://localhost:8080";
    for (const s of sites) {
      const url = `${base}/site/${s.slug}`;
      const res = await fetch(url, { redirect: "follow" });
      expect(res.status, `${url} returned ${res.status}`).toBe(200);
      const html = await res.text();
      expect(html, `${url} missing SPA root`).toContain('id="root"');
    }
  }, 20_000);
});