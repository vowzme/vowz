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

// Server-side MIME allowlist. Client-supplied file.type is never trusted —
// the real type is determined from magic bytes and must match this list.
const ALLOWED_MIME = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
  // Audio for background music uploads
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
]);

function sniffMime(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  // GIF: "GIF87a" or "GIF89a"
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 &&
      (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61) return "image/gif";
  // RIFF....WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  // ISO BMFF: bytes 4..7 == "ftyp" — distinguish AVIF / HEIC / HEIF by brand
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
    if (brand === "avif" || brand === "avis") return "image/avif";
    if (brand === "heic" || brand === "heix" || brand === "hevc" || brand === "hevx") return "image/heic";
    if (brand === "mif1" || brand === "msf1" || brand === "heim" || brand === "heis") return "image/heif";
    // M4A / AAC in an MP4 container
    if (brand === "m4a " || brand === "mp42" || brand === "mp41" || brand === "isom" || brand === "f4a " || brand === "m4b ") return "audio/mp4";
  }
  // MP3 with ID3 tag: "ID3"
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return "audio/mpeg";
  // MP3 frame sync: 0xFF 0xEx / 0xFx (Fb, F3, F2, E3, etc.)
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return "audio/mpeg";
  // OGG: "OggS"
  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return "audio/ogg";
  // WAV: "RIFF"...."WAVE"
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45) return "audio/wav";
  return null;
}

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

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "upload";
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── admin_cleanup: service-role invoked (pg_cron). Sweeps orphan R2 files
    // for users active in the last 30 days by scanning wedding_sites JSON for
    // referenced R2 URLs, then deleting anything in r2_files that isn't listed.
    if (action === "admin_cleanup") {
      const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (bearer !== SUPABASE_SERVICE_ROLE_KEY) {
        return json({ error: "Forbidden" }, 403);
      }

      // dry_run=true (query param or body) previews orphans without deleting.
      const dryRunQ = url.searchParams.get("dry_run") === "true";
      let dryRunB = false;
      try {
        const body = await req.json();
        dryRunB = body?.dry_run === true;
      } catch { /* empty body ok */ }
      const dryRun = dryRunQ || dryRunB;

      const startedAt = new Date().toISOString();
      const { data: runRow } = await admin
        .from("r2_cleanup_runs")
        .insert({ started_at: startedAt, dry_run: dryRun })
        .select("id")
        .single();
      const runId = runRow?.id;

      try {
      const since = new Date(Date.now() - 30 * 86400_000).toISOString();
      const { data: activeUsers, error: uErr } = await admin
        .from("wedding_sites")
        .select("user_id, updated_at")
        .gte("updated_at", since);
      if (uErr) throw uErr;

      const userIds = [...new Set((activeUsers || []).map((r) => r.user_id))];
      let totalDeleted = 0;
      let totalFreed = 0;
      const perUser: Array<{
        user_id: string;
        deleted: number;
        freed_bytes: number;
        orphans?: Array<{ key: string; url: string; size_bytes: number; created_at: string }>;
      }> = [];

      for (const uid of userIds) {
        const { data: sites } = await admin
          .from("wedding_sites")
          .select("data,logo_url")
          .eq("user_id", uid);
        const haystack = JSON.stringify(sites || "");

        const { data: files } = await admin
          .from("r2_files")
          .select("key,url,size_bytes,created_at")
          .eq("user_id", uid);

        // Grace period: don't touch files newer than 24h (likely in-flight edits).
        const cutoff = Date.now() - 86400_000;
        const orphans = (files || []).filter(
          (f) =>
            new Date(f.created_at).getTime() < cutoff &&
            !haystack.includes(f.url) &&
            !haystack.includes(f.key),
        );

        let deleted = 0;
        let freed = 0;
        if (dryRun) {
          deleted = orphans.length;
          freed = orphans.reduce((s, o) => s + Number(o.size_bytes || 0), 0);
          if (deleted > 0) {
            perUser.push({
              user_id: uid,
              deleted,
              freed_bytes: freed,
              orphans: orphans.map((o) => ({
                key: o.key,
                url: o.url,
                size_bytes: Number(o.size_bytes || 0),
                created_at: o.created_at,
              })),
            });
          }
        } else {
          for (const o of orphans) {
            const delRes = await r2.fetch(`${ENDPOINT}/${o.key}`, { method: "DELETE" });
            if (delRes.ok) {
              await admin.from("r2_files").delete().eq("user_id", uid).eq("key", o.key);
              deleted++;
              freed += Number(o.size_bytes || 0);
            }
          }
          if (deleted > 0) perUser.push({ user_id: uid, deleted, freed_bytes: freed });
        }
        totalDeleted += deleted;
        totalFreed += freed;
      }

      if (runId) {
        await admin.from("r2_cleanup_runs").update({
          finished_at: new Date().toISOString(),
          users_scanned: userIds.length,
          total_deleted: totalDeleted,
          total_freed_bytes: totalFreed,
          per_user: perUser,
        }).eq("id", runId);
      }

      return json({
        success: true,
        run_id: runId,
        dry_run: dryRun,
        users_scanned: userIds.length,
        [dryRun ? "would_delete" : "deleted"]: totalDeleted,
        [dryRun ? "would_free_bytes" : "freed_bytes"]: totalFreed,
        per_user: perUser,
      });
      } catch (err) {
        if (runId) {
          await admin.from("r2_cleanup_runs").update({
            finished_at: new Date().toISOString(),
            error: (err as Error).message,
          }).eq("id", runId);
        }
        throw err;
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

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

      const bytes = new Uint8Array(await file.arrayBuffer());
      // Determine the real MIME from magic bytes; ignore the client-supplied
      // file.type so HTML/SVG/JS cannot be stored as renderable content.
      const sniffed = sniffMime(bytes);
      if (!sniffed || !ALLOWED_MIME.has(sniffed)) {
        return json({
          error: "Unsupported file type. Allowed: images (JPEG, PNG, WebP, GIF, AVIF, HEIC/HEIF) and audio (MP3, M4A, OGG, WAV).",
          code: "INVALID_MIME",
        }, 415);
      }
      const contentType = sniffed;

      // SHA-256 hash for deduplication
      const hashBuf = await crypto.subtle.digest("SHA-256", bytes);
      const sha256 = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Dedup: if user already uploaded this exact file, return existing URL
      const { data: existingFile } = await admin
        .from("r2_files")
        .select("url, key, size_bytes")
        .eq("user_id", user.id)
        .eq("sha256", sha256)
        .maybeSingle();

      if (existingFile) {
        return json({
          success: true,
          url: existingFile.url,
          key: existingFile.key,
          size: Number(existingFile.size_bytes),
          deduplicated: true,
        });
      }

      // Quota check (pre-flight)
      const { data: q, error: qErr } = await admin.rpc("get_user_storage_quota", { _user_id: user.id });
      if (qErr) throw qErr;
      const quota = Array.isArray(q) ? q[0] : q;
      const used = Number(quota?.used_bytes ?? 0);
      const total = Number(quota?.total_quota_bytes ?? 0);

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

      const publicUrl = `${R2_PUBLIC_URL}/${key}`;

      // Track file for dedup + orphan cleanup
      await admin.from("r2_files").insert({
        user_id: user.id,
        key,
        url: publicUrl,
        sha256,
        size_bytes: bytes.byteLength,
        content_type: contentType,
      });

      // r2_storage_usage is maintained by the trg_r2_files_sync_usage trigger.

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

      // Prefer tracked size; fall back to HEAD
      const { data: tracked } = await admin
        .from("r2_files")
        .select("size_bytes")
        .eq("user_id", user.id)
        .eq("key", key)
        .maybeSingle();
      let size = tracked ? Number(tracked.size_bytes) : 0;
      if (!size) {
        const head = await r2.fetch(`${ENDPOINT}/${key}`, { method: "HEAD" });
        size = head.ok ? Number(head.headers.get("content-length") || 0) : 0;
      }

      const delRes = await r2.fetch(`${ENDPOINT}/${key}`, { method: "DELETE" });

      if (delRes.ok && size > 0) {
        await admin.from("r2_files").delete().eq("user_id", user.id).eq("key", key);
        // Counter decrement handled by trg_r2_files_sync_usage.
      }

      return json({ success: delRes.ok });
    }

    // ── cleanup: delete orphan files (in R2 but no longer referenced) ──
    if (action === "cleanup") {
      const body = await req.json();
      const referencedUrls: string[] = Array.isArray(body?.referenced_urls) ? body.referenced_urls : [];
      const refSet = new Set(referencedUrls.map((u) => String(u).trim()).filter(Boolean));
      const dryRun = body?.dry_run === true || url.searchParams.get("dry_run") === "true";

      const { data: files, error: fErr } = await admin
        .from("r2_files")
        .select("key, url, size_bytes, created_at")
        .eq("user_id", user.id);
      if (fErr) throw fErr;

      const orphans = (files || []).filter((f) => !refSet.has(f.url));

      if (dryRun) {
        return json({
          success: true,
          dry_run: true,
          would_delete: orphans.length,
          would_free_bytes: orphans.reduce((s, o) => s + Number(o.size_bytes || 0), 0),
          orphans: orphans.map((o) => ({
            key: o.key,
            url: o.url,
            size_bytes: Number(o.size_bytes || 0),
            created_at: o.created_at,
          })),
        });
      }

      let deletedCount = 0;
      let freedBytes = 0;

      for (const orphan of orphans) {
        const delRes = await r2.fetch(`${ENDPOINT}/${orphan.key}`, { method: "DELETE" });
        if (delRes.ok) {
          await admin.from("r2_files").delete().eq("user_id", user.id).eq("key", orphan.key);
          deletedCount++;
          freedBytes += Number(orphan.size_bytes || 0);
        }
      }

      // Counters updated by trg_r2_files_sync_usage on each r2_files delete.

      return json({ success: true, dry_run: false, deleted: deletedCount, freed_bytes: freedBytes });
    }

    // ── verify: recompute r2_storage_usage from r2_files and self-heal drift ──
    if (action === "verify") {
      const { data: files, error: fErr } = await admin
        .from("r2_files")
        .select("size_bytes")
        .eq("user_id", user.id);
      if (fErr) throw fErr;

      const actualBytes = (files || []).reduce(
        (sum, f) => sum + Math.max(0, Number(f.size_bytes || 0)),
        0,
      );
      const actualCount = (files || []).length;

      const { data: current } = await admin
        .from("r2_storage_usage")
        .select("used_bytes, file_count")
        .eq("user_id", user.id)
        .maybeSingle();

      const prevBytes = current ? Number(current.used_bytes || 0) : 0;
      const prevCount = current ? Number(current.file_count || 0) : 0;
      const drift = prevBytes !== actualBytes || prevCount !== actualCount;

      if (drift) {
        await admin
          .from("r2_storage_usage")
          .upsert(
            {
              user_id: user.id,
              used_bytes: actualBytes,
              file_count: actualCount,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
        console.log("r2-usage drift healed", {
          user_id: user.id,
          prev: { used_bytes: prevBytes, file_count: prevCount },
          actual: { used_bytes: actualBytes, file_count: actualCount },
        });
      }

      return json({
        success: true,
        drift,
        previous: { used_bytes: prevBytes, file_count: prevCount },
        actual: { used_bytes: actualBytes, file_count: actualCount },
        healed: drift,
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("r2-upload error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
