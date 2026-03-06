import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
};

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return new Response("Missing slug", { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const { data: site } = await supabase
    .from("wedding_sites")
    .select("partner1, partner2, tagline, slug, suggested_colors")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!site) {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  const title = `${site.partner1} & ${site.partner2} — Wedding`;
  const description = site.tagline || `You're invited to celebrate the wedding of ${site.partner1} & ${site.partner2}`;
  const siteUrl = `${url.origin}/site/${site.slug}`;

  // Return JSON meta data for any integration that wants to fetch it
  return new Response(
    JSON.stringify({ title, description, url: siteUrl }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
