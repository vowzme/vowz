// Server-side region detection using request headers from Cloudflare / hosting edge.
// Returns { country: "IN" | "US" | ..., region: "IN" | "INTL", source: "header" | "fallback" }
import { corsHeaders } from "@supabase/supabase-js/cors";

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Common geo headers across Cloudflare, Vercel, Fly, Supabase edge, etc.
  const h = req.headers;
  const country =
    h.get("cf-ipcountry") ||
    h.get("x-vercel-ip-country") ||
    h.get("x-country-code") ||
    h.get("x-geo-country") ||
    h.get("fly-client-country") ||
    h.get("x-supabase-country") ||
    "";

  const upper = country.trim().toUpperCase();
  const isValid = /^[A-Z]{2}$/.test(upper);

  const payload = {
    country: isValid ? upper : null,
    region: isValid ? (upper === "IN" ? "IN" : "INTL") : null,
    source: isValid ? "header" : "unknown",
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      // Allow short browser caching to avoid repeat hits during navigation
      "Cache-Control": "public, max-age=300",
    },
  });
});
