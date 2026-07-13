import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://vowz.me",
  "https://www.vowz.me",
  "https://vowz.lovable.app",
]);
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/id-preview--[a-z0-9-]+\.lovable\.app$/i,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i,
];
function buildCors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowed =
    ALLOWED_ORIGINS.has(origin) ||
    ALLOWED_ORIGIN_PATTERNS.some((r) => r.test(origin));
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://vowz.me",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

serve(async (req) => {
  const corsHeaders = buildCors(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const { data: isAdmin } = await anonClient.rpc("is_admin", { _user_id: caller.id });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const { userId, action, plan, durationMonths } = body as {
      userId?: string;
      action?: "upgrade" | "downgrade";
      plan?: string;
      durationMonths?: number;
    };

    if (!userId || !action) return json({ error: "userId and action are required" }, 400);
    if (action !== "upgrade" && action !== "downgrade") {
      return json({ error: "action must be upgrade or downgrade" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Always cancel any existing active subscription for this user first
    await admin
      .from("user_subscriptions")
      .update({ status: "cancelled" })
      .eq("user_id", userId)
      .eq("status", "active");

    if (action === "downgrade") {
      return json({ success: true, plan: "free" });
    }

    // Upgrade: insert a new active premium sub (comp — no charge)
    const selectedPlan = plan && ["premium", "premium_6mo", "premium_yearly"].includes(plan)
      ? plan
      : "premium_yearly";
    const months = Number.isFinite(durationMonths) && (durationMonths as number) > 0
      ? Math.floor(durationMonths as number)
      : selectedPlan === "premium_yearly"
        ? 12
        : selectedPlan === "premium_6mo"
          ? 6
          : 1;

    const now = new Date();
    const expires = new Date(now);
    expires.setMonth(expires.getMonth() + months);

    const { error } = await admin.from("user_subscriptions").insert({
      user_id: userId,
      plan: selectedPlan,
      provider: "admin_comp",
      status: "active",
      amount_paid: 0,
      currency: "INR",
      started_at: now.toISOString(),
      expires_at: expires.toISOString(),
      duration_months: months,
      metadata: { granted_by: caller.id, granted_at: now.toISOString(), reason: "admin_upgrade" },
    });

    if (error) return json({ error: error.message }, 500);

    return json({ success: true, plan: selectedPlan, expires_at: expires.toISOString() });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});