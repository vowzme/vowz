// Cloudflare R2 upload edge function with per-user storage quotas + auto-WebP reduction
import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { AwsClient } from "npm:aws4fetch@1.0.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")!;
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")!;
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME")!;
const R2_PUBLIC_URL = Deno.env.get("R2_PUBLIC_URL")!.replace(/\/+$/, "");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const r2 = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  service: "s3",
  region: "auto",
});

const ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "upload";

    // ── usage: return current quota ──
    if (action === "usage") {
      const { data: q, error: qErr } = await admin.rpc("get_user_storage_quota", { _user_id: user.id });
      if (qErr) throw qErr;
      const row = Array.isArray(q) ? q[0] : q;
      return json({ success: true, ...row });
    }

    // ── upload ──
    if (action === "upload") {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      let fileName = (formData.get("fileName") as string) || file?.name || `file-${Date.now()}`;
      if (!file) return json({ error: "No file provided" }, 400);

      // Quota check (pre-flight)
      const { data: q, error: qErr } = await admin.rpc("get_user_storage_quota", { _user_id: user.id });
      if (qErr) throw qErr;
      const quota = Array.isArray(q) ? q[0] : q;
      const used = Number(quota?.used_bytes ?? 0);
      const total = Number(quota?.total_quota_bytes ?? 0);

      const bytes = new Uint8Array(await file.arrayBuffer());
      const contentType = file.type || "application/octet-stream";

      if (used + bytes.byteLength > total) {
        const usedMB = (used / 1048576).toFixed(1);
        const totalMB = (total / 1048576).toFixed(0);
        return json({
          error: `Storage limit reached. You've used ${usedMB} MB of ${totalMB} MB. Upgrade to Premium or buy +2 GB add-on storage.`,
          code: "QUOTA_EXCEEDED",
          quota,
        }, 413);
      }

      const key = `${user.id}/${fileName}`;
      const putRes = await r2.fetch(`${ENDPOINT}/${key}`, {
        method: "PUT",
        body: bytes,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(bytes.byteLength),
        },
      });

      if (!putRes.ok) {
        const text = await putRes.text();
        console.error("R2 PUT failed:", putRes.status, text);
        return json({ error: `Upload failed: ${putRes.status}` }, 500);
      }

      // Increment usage (UPSERT)
      const { data: existing } = await admin
        .from("r2_storage_usage")
        .select("used_bytes, file_count")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await admin
          .from("r2_storage_usage")
          .update({
            used_bytes: Number(existing.used_bytes) + bytes.byteLength,
            file_count: (existing.file_count || 0) + 1,
          })
          .eq("user_id", user.id);
      } else {
        await admin.from("r2_storage_usage").insert({
          user_id: user.id,
          used_bytes: bytes.byteLength,
          file_count: 1,
        });
      }

      const publicUrl = `${R2_PUBLIC_URL}/${key}`;
      return json({
        success: true,
        url: publicUrl,
        key,
        size: bytes.byteLength,
      });
    }

    // ── delete ──
    if (action === "delete") {
      const { key } = await req.json();
      if (!key || !key.startsWith(`${user.id}/`)) return json({ error: "Invalid key" }, 400);

      // Get size from R2 first
      const head = await r2.fetch(`${ENDPOINT}/${key}`, { method: "HEAD" });
      const size = head.ok ? Number(head.headers.get("content-length") || 0) : 0;

      const delRes = await r2.fetch(`${ENDPOINT}/${key}`, { method: "DELETE" });

      if (delRes.ok && size > 0) {
        const { data: existing } = await admin
          .from("r2_storage_usage")
          .select("used_bytes, file_count")
          .eq("user_id", user.id)
          .maybeSingle();
        if (existing) {
          await admin
            .from("r2_storage_usage")
            .update({
              used_bytes: Math.max(0, Number(existing.used_bytes) - size),
              file_count: Math.max(0, (existing.file_count || 0) - 1),
            })
            .eq("user_id", user.id);
        }
      }

      return json({ success: delRes.ok });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("r2-upload error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
