/**
 * Validates every screenshot URL declared in public/manifest.webmanifest is
 * reachable and returns the Content-Type declared in the manifest.
 *
 * Usage:
 *   bunx tsx scripts/validate-manifest-screenshots.ts               # checks published site
 *   BASE_URL=https://vowz.me bunx tsx scripts/validate-manifest-screenshots.ts
 *
 * Exits non-zero on the first mismatch so it can be wired into CI / prebuild.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Screenshot = { src: string; type?: string; sizes?: string; label?: string };
type Manifest = {
  screenshots?: Screenshot[];
  widgets?: { name?: string; screenshots?: Screenshot[] }[];
};

const BASE_URL = process.env.BASE_URL ?? "https://vowz.me";

function collect(manifest: Manifest): { group: string; shot: Screenshot }[] {
  const out: { group: string; shot: Screenshot }[] = [];
  for (const s of manifest.screenshots ?? []) out.push({ group: "root", shot: s });
  for (const w of manifest.widgets ?? []) {
    for (const s of w.screenshots ?? []) out.push({ group: `widget:${w.name ?? "?"}`, shot: s });
  }
  return out;
}

async function check(url: string, expectedType: string | undefined) {
  const res = await fetch(url, { method: "GET", redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const ct = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (expectedType && ct !== expectedType.toLowerCase()) {
    throw new Error(`content-type ${ct} !== declared ${expectedType}`);
  }
  return ct;
}

async function main() {
  const path = resolve(process.cwd(), "public/manifest.webmanifest");
  const manifest = JSON.parse(readFileSync(path, "utf8")) as Manifest;
  const shots = collect(manifest);
  if (shots.length === 0) {
    console.log("No screenshots declared in manifest — nothing to validate.");
    return;
  }

  console.log(`Validating ${shots.length} screenshot(s) against ${BASE_URL}\n`);
  let failed = 0;
  for (const { group, shot } of shots) {
    const url = shot.src.startsWith("http") ? shot.src : `${BASE_URL}${shot.src}`;
    try {
      const ct = await check(url, shot.type);
      console.log(`  ok   [${group}] ${url}  (${ct})`);
    } catch (err) {
      failed++;
      console.error(`  FAIL [${group}] ${url}  → ${(err as Error).message}`);
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} screenshot(s) failed validation.`);
    process.exit(1);
  }
  console.log("\nAll manifest screenshots reachable with matching content-type.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});