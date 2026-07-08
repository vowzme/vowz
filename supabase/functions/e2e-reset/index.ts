// E2E test account provisioner. Resets a dedicated test user to a known
// clean state so Playwright runs are reproducible.
//
// Auth: Bearer <E2E_RESET_SECRET> in the Authorization header.
// Body: { email?: string, password?: string, action?: "reset" | "teardown" }
//   - "reset" (default): delete user if exists, recreate with confirmed email,
//     wipe their app data, return { user_id, email, password }.
//   - "teardown": delete user if exists.
//
// Never expose this function to the public UI. It's meant to be called from
// Playwright global-setup/teardown only.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const E2E_RESET_SECRET = Deno.env.get("E2E_RESET_SECRET") ?? "";
// Explicit opt-in required. In production this env var is unset, so the
// function refuses every request regardless of the bearer secret. Set
// ALLOW_E2E_RESET=true only in dedicated test environments.
const ALLOW_E2E_RESET = (Deno.env.get("ALLOW_E2E_RESET") ?? "").toLowerCase() === "true";

const DEFAULT_EMAIL = "e2e-test@vowz.me";
const DEFAULT_PASSWORD = "E2E-Test-Passw0rd!";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email: string) {
  // Paginate listUsers until we hit the target or run out.
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
    if (page > 25) return null; // safety
  }
}

async function wipeUserData(userId: string) {
  // Best-effort cleanup of app tables owned by the user. Ignore errors on
  // tables that don't exist for this project variant.
  const tables = [
    "wedding_sites",
    "wedding_family_members",
    "wedding_checklist",
    "wedding_budget",
    "wedding_expenses",
    "wedding_polls",
    "wedding_reminders",
    "rsvps",
    "guestbook",
    "guest_blessings",
    "poll_votes",
    "template_favorites",
    "template_events",
    "r2_files",
    "r2_storage_usage",
    "user_storage_addons",
    "user_subscriptions",
    "coupon_redemptions",
    "affiliate_referrals",
    "ai_usage_log",
    "site_analytics",
    "feature_requests",
  ];
  for (const t of tables) {
    await admin.from(t).delete().eq("user_id", userId).then(
      () => undefined,
      () => undefined,
    );
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Hard kill-switch: without the explicit env var this endpoint is disabled.
  if (!ALLOW_E2E_RESET) {
    return new Response(JSON.stringify({ error: "disabled" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!E2E_RESET_SECRET || token !== E2E_RESET_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { email?: string; password?: string; action?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const email = (body.email || DEFAULT_EMAIL).toLowerCase();
  const password = body.password || DEFAULT_PASSWORD;
  const action = body.action || "reset";

  // Only the dedicated test account may ever be touched by this function —
  // never accept an arbitrary email, even with a valid bearer secret.
  if (email !== DEFAULT_EMAIL.toLowerCase()) {
    return new Response(JSON.stringify({ error: "forbidden_email" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action !== "reset" && action !== "teardown") {
    return new Response(JSON.stringify({ error: "invalid_action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      await wipeUserData(existing.id);
      await admin.auth.admin.deleteUser(existing.id);
    }

    if (action === "teardown") {
      return new Response(JSON.stringify({ ok: true, email, deleted: !!existing }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "E2E Test User", e2e: true },
    });
    if (error) throw error;

    return new Response(
      JSON.stringify({ ok: true, user_id: data.user?.id, email, password }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});