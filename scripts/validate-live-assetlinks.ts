#!/usr/bin/env tsx
/**
 * Build-time guard: fetch the live Digital Asset Links file and validate it
 * before publishing. Prevents shipping a TWA-breaking assetlinks.json.
 *
 * Skipped unless CI=true or VALIDATE_LIVE_ASSETLINKS=1 so local
 * `bun run build` does not require network access. Set the env var in the
 * publish/CI workflow to enforce.
 *
 * Overridable:
 *   ASSETLINKS_URL          (default https://vowz.me/.well-known/assetlinks.json)
 *   ASSETLINKS_PACKAGE      (default me.vowz.twa)
 *   ASSETLINKS_FINGERPRINT  (optional — if set, must match one of the fps)
 */
const shouldRun =
  process.env.VALIDATE_LIVE_ASSETLINKS === "1" || process.env.CI === "true";

if (!shouldRun) {
  console.log(
    "[live-assetlinks] skipped (set VALIDATE_LIVE_ASSETLINKS=1 or CI=true to enforce)",
  );
  process.exit(0);
}

const URL_ =
  process.env.ASSETLINKS_URL ||
  "https://vowz.me/.well-known/assetlinks.json";
const EXPECTED_PACKAGE = process.env.ASSETLINKS_PACKAGE || "me.vowz.twa";
const EXPECTED_FP = process.env.ASSETLINKS_FINGERPRINT || "";
const SHA_RE = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

const errors: string[] = [];

async function main() {
  let res: Response;
  try {
    res = await fetch(`${URL_}?t=${Date.now()}`, {
      headers: { accept: "application/json" },
    });
  } catch (e) {
    console.error(`[live-assetlinks] FAIL — network error: ${(e as Error).message}`);
    process.exit(1);
  }

  if (res.status !== 200) errors.push(`expected HTTP 200, got ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("json")) errors.push(`content-type not JSON: ${ct}`);

  const text = await res.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    errors.push(`invalid JSON: ${(e as Error).message}`);
    return report(text);
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    errors.push("assetlinks.json must be a non-empty array");
    return report(text);
  }

  if (/REPLACE_WITH_/i.test(text)) {
    errors.push("assetlinks.json still contains REPLACE_WITH_* placeholders");
  }

  const entry = parsed[0];
  const rel = entry?.relation;
  if (
    !Array.isArray(rel) ||
    !rel.includes("delegate_permission/common.handle_all_urls")
  ) {
    errors.push("relation missing delegate_permission/common.handle_all_urls");
  }
  if (entry?.target?.namespace !== "android_app") {
    errors.push(`target.namespace must be "android_app" (got ${entry?.target?.namespace})`);
  }
  if (entry?.target?.package_name !== EXPECTED_PACKAGE) {
    errors.push(
      `target.package_name must be "${EXPECTED_PACKAGE}" (got ${entry?.target?.package_name})`,
    );
  }
  const fps: unknown = entry?.target?.sha256_cert_fingerprints;
  if (!Array.isArray(fps) || fps.length === 0) {
    errors.push("target.sha256_cert_fingerprints must be a non-empty array");
  } else {
    for (const fp of fps) {
      if (typeof fp !== "string" || !SHA_RE.test(fp)) {
        errors.push(`invalid SHA-256 fingerprint: ${fp}`);
      }
    }
    if (EXPECTED_FP && !fps.includes(EXPECTED_FP)) {
      errors.push(`expected fingerprint ${EXPECTED_FP} not present in live file`);
    }
  }

  report(text);
}

function report(_raw: string) {
  if (errors.length) {
    console.error(`\n[live-assetlinks] FAIL — ${URL_}\n`);
    for (const e of errors) console.error("  ✗ " + e);
    console.error(
      "\nFix the deployed /.well-known/assetlinks.json before publishing.\n",
    );
    process.exit(1);
  }
  console.log(`[live-assetlinks] OK — ${URL_} is valid.`);
}

main();