// r2-cleanup-watchdog
// Hourly pg_cron sanity check. Alerts admins when:
//   • no admin_cleanup run has completed in the last MAX_AGE_HOURS
//   • the most recent run recorded an error
// Auth: requires the service-role bearer (invoked only from pg_cron).

import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Alert if the last successful run is older than this many hours.
// Cron fires at 03:15 UTC daily → allow 26h so we get one grace hour.
const MAX_AGE_HOURS = Number(Deno.env.get("R2_WATCHDOG_MAX_AGE_HOURS") ?? 26);
// Suppress repeat alerts within this window.
const ALERT_COOLDOWN_HOURS = Number(Deno.env.get("R2_WATCHDOG_COOLDOWN_HOURS") ?? 12);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function alertAdmins(
  admin: ReturnType<typeof createClient>,
  subject: string,
  lines: string[],
) {
  const { data: rows } = await admin.from("admin_emails").select("email");
  const recipients = (rows ?? []).map((r: { email: string }) => r.email).filter(Boolean);
  if (recipients.length === 0) return 0;

  const html = `<p>${lines.map((l) => l.replace(/&/g, "&amp;").replace(/</g, "&lt;")).join("</p><p>")}</p>`;
  const text = lines.join("\n");

  for (const to of recipients) {
    const messageId = `r2-watchdog-${crypto.randomUUID()}`;
    await admin.from("email_send_log").insert({
      message_id: messageId,
      template_name: "r2_cleanup_watchdog",
      recipient_email: to,
      status: "pending",
    });
    await admin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to,
        from: "VowZ Alerts <noreply@vowz.me>",
        sender_domain: "notify.vowz.me",
        subject,
        html,
        text,
        purpose: "transactional",
        label: "r2_cleanup_watchdog",
        queued_at: new Date().toISOString(),
      },
    });
  }
  return recipients.length;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (token !== SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Forbidden" }, 403);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Most recent finished (or errored) run.
  const { data: last } = await admin
    .from("r2_cleanup_runs")
    .select("id, started_at, finished_at, dry_run, error, total_deleted, total_freed_bytes")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const now = Date.now();
  const problems: string[] = [];

  if (!last) {
    problems.push("No cleanup runs have ever been recorded. The nightly cron may not be scheduled.");
  } else {
    const ageHours = (now - new Date(last.started_at).getTime()) / 3_600_000;
    if (!last.dry_run && ageHours > MAX_AGE_HOURS) {
      problems.push(
        `Last non-dry-run cleanup was ${ageHours.toFixed(1)}h ago (threshold ${MAX_AGE_HOURS}h). The nightly cron may have failed to fire.`,
      );
    }
    if (last.error) {
      problems.push(`Last run (id=${last.id}) recorded an error: ${last.error}`);
    }
    if (!last.finished_at && ageHours > 1) {
      problems.push(`Last run (id=${last.id}) started ${ageHours.toFixed(1)}h ago and never finished.`);
    }
  }

  if (problems.length === 0) {
    return json({ ok: true, checked_at: new Date().toISOString(), last });
  }

  // Cooldown: don't spam if a watchdog alert already went out recently.
  const cooldownSince = new Date(now - ALERT_COOLDOWN_HOURS * 3_600_000).toISOString();
  const { count: recentAlerts } = await admin
    .from("email_send_log")
    .select("id", { count: "exact", head: true })
    .eq("template_name", "r2_cleanup_watchdog")
    .gte("created_at", cooldownSince);

  if ((recentAlerts ?? 0) > 0) {
    return json({ ok: false, suppressed: true, problems, last });
  }

  const sent = await alertAdmins(admin, "[VowZ] R2 cleanup watchdog alert", [
    `Checked at: ${new Date().toISOString()}`,
    ...problems.map((p) => `• ${p}`),
    "",
    "Review /admin/storage-cleanup and r2-upload edge function logs.",
  ]);

  return json({ ok: false, alerted: sent, problems, last });
});