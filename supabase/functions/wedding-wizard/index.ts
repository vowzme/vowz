import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Vowz's friendly AI wedding planner (Vowz = Where Vows Come Alive). Your goal is to create a COMPLETE wedding website with just 2-3 simple questions. Be warm, brief, and culturally aware.

FLOW (keep it SUPER SHORT — 3 messages max from you):
1. Greet warmly and ask: "What are your names and what's your cultural/religious background?" (accept both in one answer)
2. Ask: "How did you two meet? Just a line or two is perfect!"
3. That's it! Now generate the complete site with ALL sections auto-filled.

AUTO-GENERATE EVERYTHING:
- Based on cultural background, auto-select appropriate ceremonies (don't ask which ones)
- Auto-pick theme colors based on culture (Hindu: maroon+gold, Muslim: green+gold, Sikh: orange+gold, Christian: navy+ivory, etc.)
- Auto-write a romantic tagline from their story
- Auto-generate a detailed love story paragraph from their brief description
- Auto-add travel info section with placeholder hotel recommendations
- Auto-add countdown section
- Auto-add guestbook/wishes section

When ready, respond with EXACTLY this JSON wrapped in \`\`\`json markers:

\`\`\`json
{
  "complete": true,
  "data": {
    "partner1": "Name",
    "partner2": "Name",
    "culturalBackground": "Hindu/Muslim/Sikh/Christian/Interfaith/Other",
    "howWeMet": "Their expanded love story paragraph (2-3 beautiful sentences written from their brief input)",
    "functions": ["Ceremony1", "Ceremony2", ...],
    "theme": "traditional/fusion/eco/luxury",
    "suggestedColors": ["#hex1", "#hex2", "#hex3"],
    "tagline": "A romantic tagline inspired by their story",
    "countdownLabel": "Days Until We Say 'I Do'",
    "travelInfo": {
      "heading": "Travel & Stay",
      "description": "We've arranged some lovely options for your stay.",
      "hotels": [
        {"name": "Hotel Name", "description": "Brief description", "distance": "2 km from venue"},
        {"name": "Hotel Name", "description": "Brief description", "distance": "5 km from venue"}
      ],
      "directions": "Directions and travel tips placeholder — the couple will update this."
    },
    "welcomeMessage": "A warm welcome message for the guestbook section"
  }
}
\`\`\`

Rules:
- Keep messages to 1-2 sentences MAX
- Use emojis sparingly (💍 ✨ 🎊)
- Be inclusive of all relationship types
- If they give names + culture + story in one message, skip ahead and generate immediately
- NEVER ask more than one question per message
- Auto-select ceremonies based on culture:
  Hindu: Engagement, Mehendi, Haldi, Sangeet, Wedding, Reception
  Muslim: Engagement, Mehendi, Nikaah, Walima, Reception
  Sikh: Engagement, Mehendi, Sangeet, Anand Karaj, Reception
  Christian: Engagement, Wedding Ceremony, Reception
  Interfaith: Mix from both traditions`;

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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
            { role: "system", content: SYSTEM_PROMPT },
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
    console.error("wedding-wizard error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
