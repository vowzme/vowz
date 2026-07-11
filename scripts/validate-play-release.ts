#!/usr/bin/env tsx
/**
 * CI guard for Play Store / TWA releases.
 *
 * Fails the build when:
 *   1. public/manifest.webmanifest is missing required fields or has invalid values.
 *   2. public/.well-known/assetlinks.json still contains placeholder values
 *      (package name or SHA-256 fingerprint).
 *
 * Skipped unless CI=true or VALIDATE_PLAY_RELEASE=1, so local `bun run build`
 * is not blocked while the Android release is still in prep. Enable in CI by
 * setting VALIDATE_PLAY_RELEASE=1 in the workflow env.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const shouldRun =
  process.env.VALIDATE_PLAY_RELEASE === "1" || process.env.CI === "true";

if (!shouldRun) {
  console.log(
    "[play-release] skipped (set VALIDATE_PLAY_RELEASE=1 or CI=true to enforce)",
  );
  process.exit(0);
}

const errors: string[] = [];
const root = process.cwd();

// --- 1. Manifest ---------------------------------------------------------
const manifestPath = resolve(root, "public/manifest.webmanifest");
if (!existsSync(manifestPath)) {
  errors.push(`manifest missing: ${manifestPath}`);
} else {
  try {
    const m = JSON.parse(readFileSync(manifestPath, "utf8"));
    const requireStr = (k: string) => {
      if (typeof m[k] !== "string" || !m[k].trim()) {
        errors.push(`manifest.${k} must be a non-empty string`);
      }
    };
    requireStr("name");
    requireStr("short_name");
    requireStr("start_url");
    requireStr("scope");
    requireStr("id");

    if (m.display !== "standalone" && m.display !== "fullscreen") {
      errors.push(`manifest.display must be "standalone" or "fullscreen"`);
    }
    if (typeof m.theme_color !== "string" || !/^#[0-9a-f]{6}$/i.test(m.theme_color)) {
      errors.push(`manifest.theme_color must be a #rrggbb hex`);
    }
    if (typeof m.background_color !== "string" || !/^#[0-9a-f]{6}$/i.test(m.background_color)) {
      errors.push(`manifest.background_color must be a #rrggbb hex`);
    }
    if (typeof m.short_name === "string" && m.short_name.length > 12) {
      errors.push(`manifest.short_name must be <= 12 chars for Android launcher`);
    }

    if (!Array.isArray(m.icons) || m.icons.length === 0) {
      errors.push(`manifest.icons must be a non-empty array`);
    } else {
      const sizes = new Set(m.icons.map((i: any) => String(i.sizes)));
      for (const req of ["192x192", "512x512"]) {
        if (!sizes.has(req)) errors.push(`manifest.icons missing ${req}`);
      }
      const hasMaskable = m.icons.some((i: any) =>
        typeof i.purpose === "string" && i.purpose.split(/\s+/).includes("maskable"),
      );
      if (!hasMaskable) errors.push(`manifest.icons must include a maskable icon`);
    }

    if (!Array.isArray(m.screenshots) || m.screenshots.length === 0) {
      errors.push(`manifest.screenshots must be a non-empty array (Play requires them)`);
    }
  } catch (e) {
    errors.push(`manifest is not valid JSON: ${(e as Error).message}`);
  }
}

// --- 2. assetlinks.json --------------------------------------------------
const alPath = resolve(root, "public/.well-known/assetlinks.json");
if (!existsSync(alPath)) {
  errors.push(`assetlinks missing: ${alPath}`);
} else {
  try {
    const raw = readFileSync(alPath, "utf8");
    if (/REPLACE_WITH_/i.test(raw)) {
      errors.push(`assetlinks.json still contains REPLACE_WITH_* placeholder values`);
    }
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) {
      errors.push(`assetlinks.json must be a non-empty array`);
    } else {
      for (const [i, entry] of arr.entries()) {
        const pkg = entry?.target?.package_name;
        const fps = entry?.target?.sha256_cert_fingerprints;
        if (!pkg || typeof pkg !== "string" || !/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i.test(pkg)) {
          errors.push(`assetlinks[${i}].target.package_name invalid: ${pkg}`);
        }
        if (!Array.isArray(fps) || fps.length === 0) {
          errors.push(`assetlinks[${i}].target.sha256_cert_fingerprints must be a non-empty array`);
        } else {
          const shaRe = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;
          for (const fp of fps) {
            if (typeof fp !== "string" || !shaRe.test(fp)) {
              errors.push(`assetlinks[${i}] fingerprint not a valid SHA-256 (AA:BB:..:32 bytes): ${fp}`);
            }
          }
        }
      }
    }
  } catch (e) {
    errors.push(`assetlinks.json is not valid JSON: ${(e as Error).message}`);
  }
}

// --- report --------------------------------------------------------------
if (errors.length) {
  console.error("\n[play-release] FAIL\n");
  for (const e of errors) console.error("  ✗ " + e);
  console.error("\nFix the above before publishing to Google Play.\n");
  process.exit(1);
}
console.log("[play-release] OK — manifest and assetlinks look release-ready.");