// One-time migration: copy Supabase Storage media → Cloudflare R2 and rewrite URLs in DB.
// Admin-only. Idempotent: skips files already in R2 (by key) and URLs already pointing to R2.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")!;
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")!;
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME")!;
const R2_PUBLIC_URL = Deno.env.get("R2_PUBLIC_URL")!.replace(/\/+$/, "");

const r2 = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  service: "s3",
  region: "auto",
});
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}`;

const BUCKETS = ["wedding-photos", "wedding-logos", "blessing-photos"];

interface MigrationReport {
  scanned_files: number;
  copied_files: number;
  skipped_files: number;
  failed_files: number;
  rewritten_sites: number;
  deleted_files: number;
  errors: string[];
  url_map: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth + admin check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) return json({ error: "Admin only" }, 403);

    const body = await req.json().catch(() => ({}));
    const dryRun: boolean = !!body.dryRun;
    const mode: "migrate" | "cleanup" = body.mode === "cleanup" ? "cleanup" : "migrate";

    const report: MigrationReport = {
      scanned_files: 0,
      copied_files: 0,
      skipped_files: 0,
      failed_files: 0,
      rewritten_sites: 0,
      deleted_files: 0,
      errors: [],
      url_map: {},
    };

    // ----- Cleanup mode: delete Supabase Storage files that already exist in R2 -----
    if (mode === "cleanup") {
      for (const bucket of BUCKETS) {
        await cleanupBucket(bucket, "", admin, report, dryRun);
      }
      return json({ success: true, dryRun, mode, report });
    }

    // ----- Step 1: Copy files bucket-by-bucket -----
    for (const bucket of BUCKETS) {
      const { data: files, error: listErr } = await admin.storage.from(bucket).list("", {
        limit: 1000,
        sortBy: { column: "created_at", order: "asc" },
      });
      if (listErr) {
        report.errors.push(`List ${bucket}: ${listErr.message}`);
        continue;
      }
      if (!files) continue;

      for (const f of files) {
        // Recurse into folders (1 level deep — most paths are user_id/file)
        if (!f.metadata) {
          const { data: subFiles } = await admin.storage.from(bucket).list(f.name, { limit: 1000 });
          if (subFiles) {
            for (const sf of subFiles) {
              if (sf.metadata) await migrateOne(bucket, `${f.name}/${sf.name}`, admin, report, dryRun);
            }
          }
          continue;
        }
        await migrateOne(bucket, f.name, admin, report, dryRun);
      }
    }

    // ----- Step 2: Rewrite URLs in wedding_sites -----
    if (!dryRun && Object.keys(report.url_map).length > 0) {
      const { data: sites, error: sitesErr } = await admin
        .from("wedding_sites")
        .select("id, logo_url, sections");
      if (sitesErr) {
        report.errors.push(`Read sites: ${sitesErr.message}`);
      } else if (sites) {
        for (const site of sites) {
          let changed = false;
          let newLogo = site.logo_url;
          let newSections = site.sections;

          if (newLogo && report.url_map[newLogo]) {
            newLogo = report.url_map[newLogo];
            changed = true;
          }

          // Replace any URL inside sections JSON
          let sectionsStr = JSON.stringify(newSections ?? []);
          for (const [oldUrl, newUrl] of Object.entries(report.url_map)) {
            if (sectionsStr.includes(oldUrl)) {
              sectionsStr = sectionsStr.split(oldUrl).join(newUrl);
              changed = true;
            }
          }
          newSections = JSON.parse(sectionsStr);

          if (changed) {
            const { error: updErr } = await admin
              .from("wedding_sites")
              .update({ logo_url: newLogo, sections: newSections })
              .eq("id", site.id);
            if (updErr) {
              report.errors.push(`Update site ${site.id}: ${updErr.message}`);
            } else {
              report.rewritten_sites++;
            }
          }
        }
      }
    }

    return json({ success: true, dryRun, mode, report });
  } catch (err) {
    console.error("migrate-to-r2 error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});

async function migrateOne(
  bucket: string,
  path: string,
  admin: ReturnType<typeof createClient>,
  report: MigrationReport,
  dryRun: boolean,
) {
  report.scanned_files++;
  const oldUrl = admin.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  // Skip blessing-photos for the URL rewrite map (DB has its own column we won't touch here)
  // but still copy to preserve the file.
  const r2Key = `_migrated/${bucket}/${path}`;
  const newUrl = `${R2_PUBLIC_URL}/${r2Key}`;

  try {
    if (dryRun) {
      if (bucket !== "blessing-photos") report.url_map[oldUrl] = newUrl;
      report.copied_files++;
      return;
    }

    // Idempotency: HEAD R2 object first
    const headRes = await r2.fetch(`${R2_ENDPOINT}/${r2Key}`, { method: "HEAD" });
    if (headRes.ok) {
      report.skipped_files++;
      if (bucket !== "blessing-photos") report.url_map[oldUrl] = newUrl;
      return;
    }

    // Download from Supabase
    const { data: blob, error: dlErr } = await admin.storage.from(bucket).download(path);
    if (dlErr || !blob) {
      report.failed_files++;
      report.errors.push(`Download ${bucket}/${path}: ${dlErr?.message ?? "no blob"}`);
      return;
    }
    const buffer = await blob.arrayBuffer();

    // Upload to R2
    const putRes = await r2.fetch(`${R2_ENDPOINT}/${r2Key}`, {
      method: "PUT",
      body: buffer,
      headers: {
        "Content-Type": blob.type || "application/octet-stream",
        "Content-Length": String(buffer.byteLength),
      },
    });
    if (!putRes.ok) {
      report.failed_files++;
      report.errors.push(`R2 PUT ${r2Key}: ${putRes.status} ${await putRes.text()}`);
      return;
    }

    report.copied_files++;
    if (bucket !== "blessing-photos") report.url_map[oldUrl] = newUrl;
  } catch (e) {
    report.failed_files++;
    report.errors.push(`${bucket}/${path}: ${(e as Error).message}`);
  }
}

async function cleanupBucket(
  bucket: string,
  prefix: string,
  admin: ReturnType<typeof createClient>,
  report: MigrationReport,
  dryRun: boolean,
) {
  const { data: entries, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) {
    report.errors.push(`List ${bucket}/${prefix}: ${error.message}`);
    return;
  }
  if (!entries) return;

  const toDelete: string[] = [];

  for (const entry of entries) {
    const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (!entry.metadata) {
      // Folder — recurse
      await cleanupBucket(bucket, fullPath, admin, report, dryRun);
      continue;
    }
    report.scanned_files++;
    const r2Key = `_migrated/${bucket}/${fullPath}`;
    try {
      const headRes = await r2.fetch(`${R2_ENDPOINT}/${r2Key}`, { method: "HEAD" });
      if (headRes.ok) {
        toDelete.push(fullPath);
      } else {
        report.skipped_files++;
      }
    } catch (e) {
      report.errors.push(`HEAD ${r2Key}: ${(e as Error).message}`);
      report.failed_files++;
    }
  }

  if (toDelete.length === 0) return;

  if (dryRun) {
    report.deleted_files += toDelete.length;
    return;
  }

  // Batch-delete (Supabase accepts up to 1000 paths per call)
  const { data: removed, error: rmErr } = await admin.storage.from(bucket).remove(toDelete);
  if (rmErr) {
    report.errors.push(`Delete ${bucket}: ${rmErr.message}`);
    report.failed_files += toDelete.length;
  } else {
    report.deleted_files += removed?.length ?? toDelete.length;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
