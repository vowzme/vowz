import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROMPTS: Record<string, string> = {
  story: `You are a romantic wedding story writer. Given brief answers, craft a heartfelt "How We Met" story in 4-6 sentences (100-150 words max). 
Focus on: how they met, what made them click, one special moment, and end on a warm note. Be concise, emotional, and vivid. No filler. Third person. Plain text only, no markdown.`,

  story_short: `You are a romantic wedding story writer. Rewrite the given story into a shorter, crisper version: exactly 3-4 sentences (80-100 words). 
Keep the emotional core, remove fluff. Be vivid and warm. Third person. Plain text only, no markdown.`,

  tagline: `You are a creative wedding tagline writer. Generate a short, elegant wedding tagline (max 8 words) for the couple. 
It should be romantic, memorable, and culturally appropriate. Return ONLY the tagline text, nothing else. No quotes around it.`,

  event_description: `You are a wedding event description writer familiar with Indian wedding traditions. 
Write a brief, elegant description (2-3 sentences, max 50 words) for the given wedding event/ceremony. Be culturally accurate and warm. Return ONLY the description text.`,

  welcome_message: `You are a warm wedding website copywriter. Write a brief welcome message (2-3 sentences) for the couple's wedding website. 
It should feel personal and inviting. Return ONLY the message text.`,
};

// Helper to log AI usage (fire-and-forget)
function logUsage(functionName: string, model: string, userId?: string, status = "success") {
  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    sb.from("ai_usage_log").insert({ function_name: functionName, model, user_id: userId || null, status }).then();
  } catch { /* non-blocking */ }
}

// Per-user rate limits for this function
const RATE_PER_HOUR = 20;
const RATE_PER_DAY = 100;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Rate limit check (service-role RPC)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: rl } = await admin.rpc("check_ai_rate_limit", {
      _user_id: userId,
      _function_name: "wedding-content-gen",
      _per_hour: RATE_PER_HOUR,
      _per_day: RATE_PER_DAY,
    });
    const row = Array.isArray(rl) ? rl[0] : rl;
    if (row && row.allowed === false) {
      return new Response(
        JSON.stringify({
          error: `Rate limit reached. Try again in ~${Math.ceil((row.retry_after_seconds ?? 60) / 60)} min.`,
          code: "RATE_LIMITED",
          retry_after_seconds: row.retry_after_seconds,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(row.retry_after_seconds ?? 60),
          },
        },
      );
    }

    const { type, context } = await req.json();

    if (!type || !PROMPTS[type]) {
      return new Response(
        JSON.stringify({ error: `Invalid content type. Supported: ${Object.keys(PROMPTS).join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build the user prompt based on content type
    let userPrompt = "";

    if (type === "story") {
      userPrompt = `Couple: ${context.partner1 || "Partner 1"} & ${context.partner2 || "Partner 2"}
Cultural background: ${context.culturalBackground || "Indian"}
How they met (brief): ${context.howWeMet || "They met through friends"}
${context.additionalDetails ? `Additional details: ${context.additionalDetails}` : ""}`;
    } else if (type === "story_short") {
      userPrompt = `Original story to shorten:\n${context.currentStory || context.howWeMet || "A beautiful love story"}
Couple: ${context.partner1 || "Partner 1"} & ${context.partner2 || "Partner 2"}`;
    } else if (type === "tagline") {
      userPrompt = `Couple: ${context.partner1 || "Partner 1"} & ${context.partner2 || "Partner 2"}
Cultural background: ${context.culturalBackground || "Indian"}
Their story: ${context.howWeMet || "A beautiful love story"}
Theme: ${context.theme || "traditional"}`;
    } else if (type === "event_description") {
      userPrompt = `Event name: ${context.eventName || "Wedding Ceremony"}
Cultural background: ${context.culturalBackground || "Indian"}
Couple: ${context.partner1 || "Partner 1"} & ${context.partner2 || "Partner 2"}`;
    } else if (type === "welcome_message") {
      userPrompt = `Couple: ${context.partner1 || "Partner 1"} & ${context.partner2 || "Partner 2"}
Cultural background: ${context.culturalBackground || "Indian"}
Theme: ${context.theme || "traditional"}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: PROMPTS[type] },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    logUsage("wedding-content-gen", "google/gemini-3-flash-preview", userId);

    return new Response(
      JSON.stringify({ content: content.trim() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("wedding-content-gen error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
