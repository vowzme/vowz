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

  // Detect a video invitation — a video section in "invitation" mode with a playable URL
  const videoSection = sections.find(
    (s: any) => s.type === "video" && (s.data?.videos?.some((v: any) => v?.url))
  );
  const isInvitationVideo = videoSection?.data?.displayMode === "invitation";
  const firstVideoUrl: string = videoSection?.data?.videos?.find((v: any) => v?.url)?.url || "";
  const embedVideoUrl = firstVideoUrl ? getVideoEmbedSrc(firstVideoUrl) : "";
  const hasVideo = Boolean(isInvitationVideo && embedVideoUrl);

  // Check Accept header — if JSON requested, return JSON
  const accept = req.headers.get("accept") || "";
  if (accept.includes("application/json")) {
    return new Response(
      JSON.stringify({ title, description, url: canonicalUrl, image: finalOgImage, video: hasVideo ? embedVideoUrl : undefined }),
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
  <meta property="og:type" content="${hasVideo ? "video.other" : "website"}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:image" content="${escapeHtml(finalOgImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Vowz" />
${hasVideo ? `
  <!-- Video invitation -->
  <meta property="og:video" content="${escapeHtml(embedVideoUrl)}" />
  <meta property="og:video:url" content="${escapeHtml(embedVideoUrl)}" />
  <meta property="og:video:secure_url" content="${escapeHtml(embedVideoUrl)}" />
  <meta property="og:video:type" content="text/html" />
  <meta property="og:video:width" content="1280" />
  <meta property="og:video:height" content="720" />` : ""}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="${hasVideo ? "player" : "summary_large_image"}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(finalOgImage)}" />
  <meta name="twitter:site" content="@vowzco" />
${hasVideo ? `  <meta name="twitter:player" content="${escapeHtml(embedVideoUrl)}" />
  <meta name="twitter:player:width" content="1280" />
  <meta name="twitter:player:height" content="720" />` : ""}

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

// Return a playable/embeddable URL for common providers. Direct video files pass through.
function getVideoEmbedSrc(raw: string): string {
  const url = raw.trim();
  if (!url) return "";
  // Direct video file
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) return url;
  // YouTube
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  // Vimeo
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return "";
}
