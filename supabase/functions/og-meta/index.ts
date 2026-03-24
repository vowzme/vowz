import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_ORIGIN = "https://vowz.lovable.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return new Response("Missing or invalid slug", { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const { data: site } = await supabase
    .from("wedding_sites")
    .select("partner1, partner2, tagline, slug, suggested_colors, theme, sections")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!site) {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  const title = `${site.partner1} & ${site.partner2} — Wedding Invitation`;
  const description = site.tagline || `You're invited to celebrate the wedding of ${site.partner1} & ${site.partner2}`;
  const canonicalUrl = `${SITE_ORIGIN}/site/${site.slug}`;
  const ogImageUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/og-image?slug=${site.slug}`;

  // Try to get hero image from sections for a richer OG image
  const sections = Array.isArray(site.sections) ? (site.sections as any[]) : [];
  const heroSection = sections.find((s: any) => s.type === "hero");
  const heroImage = heroSection?.data?.heroImageUrl || heroSection?.data?.featuredImageUrl || "";
  const finalOgImage = heroImage || ogImageUrl;

  // Check Accept header — if JSON requested, return JSON
  const accept = req.headers.get("accept") || "";
  if (accept.includes("application/json")) {
    return new Response(
      JSON.stringify({ title, description, url: canonicalUrl, image: finalOgImage }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Return full HTML page with OG meta tags for social media crawlers
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:image" content="${escapeHtml(finalOgImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Vowz" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(finalOgImage)}" />
  <meta name="twitter:site" content="@vowzco" />

  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />

  <!-- Redirect human visitors to the actual site -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}" />
  <script>window.location.replace("${canonicalUrl.replace(/"/g, '\\"')}");</script>
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(canonicalUrl)}">${escapeHtml(title)}</a>...</p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
