// End-to-end test: verifies r2-upload keeps r2_files and r2_storage_usage in
// sync across sequential and parallel operations, and that `verify` self-heals
// any drift. Run with:
//   deno test --allow-env --allow-net --allow-read supabase/functions/r2-upload/index.test.ts
//
// Requires a test user in .env:
//   TEST_USER_EMAIL=...
//   TEST_USER_PASSWORD=...

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const EMAIL = Deno.env.get("TEST_USER_EMAIL");
const PASSWORD = Deno.env.get("TEST_USER_PASSWORD");

const FN_URL = `${SUPABASE_URL}/functions/v1/r2-upload`;

// Minimal 1x1 PNG (67 bytes) — passes magic-byte sniffing.
const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x62, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

function makePng(marker: number): Uint8Array {
  // Vary a trailing byte so each blob has a unique sha256 (bypass dedup).
  const out = new Uint8Array(PNG_BYTES.length + 1);
  out.set(PNG_BYTES);
  out[out.length - 1] = marker;
  return out;
}

async function signIn(): Promise<{ token: string; userId: string } | null> {
  if (!EMAIL || !PASSWORD) return null;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (error || !data.session) throw error ?? new Error("no session");
  return { token: data.session.access_token, userId: data.user!.id };
}

async function callAction(token: string, action: string, body: unknown) {
  const res = await fetch(`${FN_URL}?action=${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function upload(token: string, marker: number) {
  const fd = new FormData();
  const bytes = makePng(marker);
  fd.set("file", new Blob([bytes], { type: "image/png" }), `test-${marker}.png`);
  fd.set("fileName", `e2e-${Date.now()}-${marker}.png`);
  const res = await fetch(`${FN_URL}?action=upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
    body: fd,
  });
  const json = await res.json();
  return { status: res.status, json, size: bytes.byteLength };
}

async function usage(token: string) {
  const { json } = await callAction(token, "usage", {});
  return {
    used_bytes: Number(json.used_bytes ?? 0),
    file_count: Number(json.file_count ?? 0),
  };
}

Deno.test("r2-upload: sync + quota stay consistent across ops", async (t) => {
  const auth = await signIn();
  if (!auth) {
    console.warn("skip: TEST_USER_EMAIL/TEST_USER_PASSWORD not set");
    return;
  }
  const { token } = auth;

  const start = await usage(token);
  const uploaded: string[] = [];

  await t.step("verify starts clean (no drift)", async () => {
    const { json } = await callAction(token, "verify", {});
    assertEquals(json.success, true);
    assertEquals(json.drift, false, "usage should not drift before test");
  });

  await t.step("sequential upload → usage tracks +N bytes and +1 count", async () => {
    const r = await upload(token, 1);
    assertEquals(r.status, 200, JSON.stringify(r.json));
    uploaded.push(r.json.key);
    const u = await usage(token);
    assertEquals(u.file_count, start.file_count + 1);
    assert(u.used_bytes >= start.used_bytes + r.size);
  });

  await t.step("5 parallel uploads → counters increment exactly by 5", async () => {
    const results = await Promise.all([2, 3, 4, 5, 6].map((m) => upload(token, m)));
    for (const r of results) {
      assertEquals(r.status, 200, JSON.stringify(r.json));
      uploaded.push(r.json.key);
    }
    const u = await usage(token);
    assertEquals(u.file_count, start.file_count + 6);
  });

  await t.step("verify still reports no drift after parallel writes", async () => {
    const { json } = await callAction(token, "verify", {});
    assertEquals(json.drift, false, `drift after parallel uploads: ${JSON.stringify(json)}`);
  });

  await t.step("retried delete of same key is idempotent for counters", async () => {
    const key = uploaded.shift()!;
    // Fire the same delete twice in parallel — retry simulation.
    const [a, b] = await Promise.all([
      callAction(token, "delete", { key }),
      callAction(token, "delete", { key }),
    ]);
    assertEquals(a.status, 200);
    assertEquals(b.status, 200);
    const { json: v } = await callAction(token, "verify", {});
    assertEquals(v.drift, false, `drift after duplicate delete: ${JSON.stringify(v)}`);
  });

  await t.step("parallel delete of remaining files → verify clean", async () => {
    await Promise.all(uploaded.map((key) => callAction(token, "delete", { key })));
    uploaded.length = 0;
    const { json } = await callAction(token, "verify", {});
    assertEquals(json.drift, false, `drift after parallel deletes: ${JSON.stringify(json)}`);
    const end = await usage(token);
    assertEquals(end.file_count, start.file_count);
    assertEquals(end.used_bytes, start.used_bytes);
  });
});