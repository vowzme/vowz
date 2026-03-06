import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are ShaadiSite's friendly AI wedding wizard helping couples create their wedding website. You are warm, celebratory, and culturally aware of Indian wedding traditions.

Your job is to have a SHORT, friendly conversation (5-8 messages max) to collect wedding details. Ask ONE question at a time. Be concise and enthusiastic.

Follow this flow:
1. First, greet them warmly and ask for the bride's and groom's names (or partner names — be inclusive).
2. Ask about their primary cultural/religious background (Hindu, Muslim, Sikh, Christian, Jain, interfaith, or other). This helps suggest appropriate ceremonies.
3. Ask for a brief "how we met" story (2-3 sentences is fine).
4. Based on their cultural background, suggest relevant wedding functions/ceremonies and ask which ones they'd like on their site. For example:
   - Hindu: Engagement (Sagai), Mehendi, Haldi, Sangeet, Wedding (Vivah/Pheras), Reception, Vidaai
   - Muslim: Engagement, Mehendi, Nikaah, Walima, Reception
   - Sikh: Engagement, Mehendi, Sangeet, Anand Karaj, Reception
   - Christian: Engagement, Mehendi (if desired), Wedding Ceremony, Reception, Roce (for Goan/Mangalorean)
   - Interfaith: Suggest from both traditions
   Let them pick, add custom ones, or accept your suggestions.
5. Ask about their preferred theme/vibe: Traditional (red, gold, maroon), Fusion/Modern (pastels, minimalist), Eco-Friendly (nature-inspired), or Royal/Luxury.
6. Once you have enough info, respond with EXACTLY this JSON format wrapped in \`\`\`json markers:

\`\`\`json
{
  "complete": true,
  "data": {
    "partner1": "Name",
    "partner2": "Name",
    "culturalBackground": "Hindu/Muslim/Sikh/Christian/Interfaith/Other",
    "howWeMet": "Their story...",
    "functions": ["Engagement", "Mehendi", "Sangeet", "Wedding Ceremony", "Reception"],
    "theme": "traditional/fusion/eco/luxury",
    "suggestedColors": ["#6B1D2A", "#D4A853", "#FFF5E6"],
    "tagline": "A short romantic tagline for their site"
  }
}
\`\`\`

Rules:
- Keep messages SHORT (2-3 sentences max)
- Use emojis sparingly but warmly (🎊 💍 ✨)
- Be inclusive of all relationship types
- If they give multiple answers at once, acknowledge and move on
- NEVER ask more than one question per message
- When generating the final JSON, create a beautiful tagline based on their story`;

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
