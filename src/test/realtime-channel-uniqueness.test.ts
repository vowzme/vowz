import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

// Guard test: every `supabase.channel(...)` call in the codebase MUST use a
// name that varies per subscriber (user id, site id, or a random suffix).
// Static, hard-coded channel names collide across tabs / StrictMode remounts
// and trigger "cannot add postgres_changes callbacks" errors.

const ALLOWED_DYNAMIC_TOKENS = [
  "user.id",
  "user?.id",
  "userId",
  "site.id",
  "site?.id",
  "siteId",
  "suffix",
  "Math.random",
  "crypto.randomUUID",
  "uuid",
];

function findChannelCallSites(): { file: string; line: number; snippet: string }[] {
  const out = execSync(
    // -A2 to capture template-literal args that span across lines
    "rg -n --no-heading -A2 '\\.channel\\(' src --glob '!*.test.*' --glob '!**/realtime-logger.ts'",
    { encoding: "utf8" },
  );
  const hits: { file: string; line: number; snippet: string }[] = [];
  const groups = out.split("--\n");
  for (const group of groups) {
    const lines = group.split("\n").filter(Boolean);
    const header = lines.find((l) => l.includes(".channel("));
    if (!header) continue;
    const match = header.match(/^([^:]+):(\d+):(.*)$/);
    if (!match) continue;
    const [, file, lineStr] = match;
    const line = Number(lineStr);
    // Grab a small window around the call from the actual file to include
    // template-literal continuations and neighboring `const NAME = ...`.
    const src = readFileSync(file, "utf8").split("\n");
    const start = Math.max(0, line - 4);
    const end = Math.min(src.length, line + 2);
    const snippet = src.slice(start, end).join("\n");
    hits.push({ file, line, snippet });
  }
  return hits;
}

describe("Realtime channel uniqueness", () => {
  it("every supabase.channel(...) call uses a dynamic, per-subscriber name", () => {
    const hits = findChannelCallSites();
    expect(hits.length).toBeGreaterThan(0);

    const offenders: string[] = [];
    for (const h of hits) {
      const hasDynamic = ALLOWED_DYNAMIC_TOKENS.some((t) => h.snippet.includes(t));
      if (!hasDynamic) {
        offenders.push(`${h.file}:${h.line}\n${h.snippet}`);
      }
    }

    if (offenders.length > 0) {
      throw new Error(
        "Found supabase.channel(...) calls with static names — add a per-user, per-site, or random suffix:\n\n" +
          offenders.join("\n\n---\n\n"),
      );
    }
  });
});
