import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
    // Serve cached — redirect to public URL
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
    ? site.suggested_colors
    : ["#6B1D2A", "#D4A853", "#FFF5E6"];

  const prompt = `Create a beautiful, elegant wedding invitation card style image in 1200x630 landscape format. 
Use these exact colors: background ${colors[2] || "#FFF5E6"}, accent ${colors[0] || "#6B1D2A"}, gold highlights ${colors[1] || "#D4A853"}.
The image should have ornate decorative borders and floral motifs.
Display the names "${site.partner1} & ${site.partner2}" prominently in elegant script typography in the center.
Below the names show "${site.tagline || "We're getting married!"}".
Style: ${site.theme || "traditional"} Indian wedding aesthetic with mandala patterns and subtle paisley designs.
The overall feel should be luxurious, romantic, and culturally rich. 16:9 aspect ratio.`;

  try {
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", errText);
      return new Response("Image generation failed", {
        status: 500,
        headers: corsHeaders,
      });
    }

    const aiData = await aiResponse.json();
    const imageData =
      aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image in response:", JSON.stringify(aiData).slice(0, 500));
      return new Response("No image generated", {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Decode base64
    const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("wedding-photos")
      .upload(cachedPath, bytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response("Upload failed", {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Return public URL
    const { data: pub } = supabase.storage
      .from("wedding-photos")
      .getPublicUrl(cachedPath);

    return Response.redirect(pub.publicUrl, 302);
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response("Internal error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
