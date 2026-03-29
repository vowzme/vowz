import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Vowz's AI wedding assistant built into the website editor. You help couples customize their wedding website.

You have access to the couple's current site data which will be provided with each message.

YOUR CAPABILITIES:
1. **Answer wedding planning questions** — etiquette, traditions, customs across all cultures
2. **Suggest themes & colors** — based on culture, venue, season, or couple preferences  
3. **Generate/rewrite content** — love stories, taglines, welcome messages, event descriptions
4. **Auto-generate full themes** — when asked, output a complete theme suggestion

When the user asks you to APPLY changes (theme, colors, content), respond with a JSON action block:

\`\`\`action
{
  "type": "apply_theme" | "update_content" | "update_colors",
  "data": {
    // For apply_theme: full theme object
    "suggestedColors": ["#hex1", "#hex2", "#hex3"],
    "displayFont": "Font Name",
    "bodyFont": "Font Name",
    "theme": "traditional/fusion/eco/luxury/modern",
    "tagline": "New tagline"
    
    // For update_content: specific field updates
    // "field": "tagline" | "howWeMet" | "welcomeMessage",
    // "value": "new content"
    
    // For update_colors:
    // "suggestedColors": ["#hex1", "#hex2", "#hex3"]
  }
}
\`\`\`

Rules:
- Be warm, brief, and helpful (2-3 sentences unless detail is needed)
- Use emojis sparingly (💍 ✨ 🎊 🎨)
- Be culturally aware and inclusive
- When suggesting themes, always explain WHY it fits the couple
- Only include the action block when the user wants to APPLY changes, not when just discussing
- For questions/advice, just respond naturally without action blocks`;

// Helper to log AI usage (fire-and-forget)
function logUsage(functionName: string, model: string, status = "success") {
  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    sb.from("ai_usage_log").insert({ function_name: functionName, model, status }).then();
  } catch { /* non-blocking */ }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, siteContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context message about the couple's current site
    const contextMsg = siteContext
      ? `\n\nCURRENT SITE DATA:\n- Partners: ${siteContext.partner1} & ${siteContext.partner2}\n- Culture: ${siteContext.culturalBackground}\n- Theme: ${siteContext.theme}\n- Colors: ${(siteContext.suggestedColors || []).join(", ")}\n- Tagline: ${siteContext.tagline}\n- Story: ${siteContext.howWeMet}\n- Display Font: ${siteContext.displayFont || "Cormorant Garamond"}\n- Body Font: ${siteContext.bodyFont || "DM Sans"}`
      : "";

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT + contextMsg },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("editor-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
