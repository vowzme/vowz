import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function generateSVG(partner1: string, partner2: string, tagline: string, colors: string[]): string {
  const [bg, accent, light] = colors.length >= 3 ? colors : ["#6B1D2A", "#D4A853", "#FFF5E6"];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${bg};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${bg};stop-opacity:0.85" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <!-- Decorative circles -->
    ${[...Array(6)].map((_, i) => `<circle cx="600" cy="315" r="${80 + i * 50}" fill="none" stroke="${light}" stroke-opacity="0.08" stroke-width="1"/>`).join("")}
    <!-- Decorative corners -->
    <path d="M40,40 L120,40 M40,40 L40,120" stroke="${accent}" stroke-width="2" fill="none" stroke-opacity="0.6"/>
    <path d="M1160,40 L1080,40 M1160,40 L1160,120" stroke="${accent}" stroke-width="2" fill="none" stroke-opacity="0.6"/>
    <path d="M40,590 L120,590 M40,590 L40,510" stroke="${accent}" stroke-width="2" fill="none" stroke-opacity="0.6"/>
    <path d="M1160,590 L1080,590 M1160,590 L1160,510" stroke="${accent}" stroke-width="2" fill="none" stroke-opacity="0.6"/>
    <!-- Heart -->
    <text x="600" y="200" text-anchor="middle" fill="${accent}" font-size="40">♥</text>
    <!-- Subtitle -->
    <text x="600" y="250" text-anchor="middle" fill="${light}" font-family="serif" font-size="16" letter-spacing="6" opacity="0.7">YOU'RE INVITED TO THE WEDDING OF</text>
    <!-- Names -->
    <text x="600" y="340" text-anchor="middle" fill="${light}" font-family="Georgia, serif" font-size="64" font-weight="bold">${escapeXml(partner1)} &amp; ${escapeXml(partner2)}</text>
    <!-- Tagline -->
    <text x="600" y="400" text-anchor="middle" fill="${accent}" font-family="Georgia, serif" font-size="22" font-style="italic">${escapeXml(tagline)}</text>
    <!-- Divider -->
    <line x1="480" y1="440" x2="720" y2="440" stroke="${accent}" stroke-width="1" stroke-opacity="0.5"/>
    <!-- Powered by -->
    <text x="600" y="560" text-anchor="middle" fill="${light}" font-family="sans-serif" font-size="12" opacity="0.4">vowz.lovable.app</text>
  </svg>`;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return new Response("Invalid slug", { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Check cache first
  const cachedPath = `og/${slug}.png`;
  const { data: existing } = await supabase.storage
    .from("wedding-photos")
    .createSignedUrl(cachedPath, 60);

  if (existing?.signedUrl) {
    const { data: pub } = supabase.storage
      .from("wedding-photos")
      .getPublicUrl(cachedPath);
    return Response.redirect(pub.publicUrl, 302);
  }

  // Fetch site data
  const { data: site, error } = await supabase
    .from("wedding_sites")
    .select("partner1, partner2, tagline, suggested_colors, theme")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !site) {
    return new Response("Site not found", { status: 404, headers: corsHeaders });
  }

  const colors = Array.isArray(site.suggested_colors)
    ? site.suggested_colors as string[]
    : ["#6B1D2A", "#D4A853", "#FFF5E6"];

  const svg = generateSVG(
    site.partner1,
    site.partner2,
    site.tagline || "We're getting married!",
    colors
  );

  // Return SVG directly (no AI, no cost)
  return new Response(svg, {
    headers: {
      ...corsHeaders,
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
});
