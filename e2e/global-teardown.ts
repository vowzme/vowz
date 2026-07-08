import { request } from "@playwright/test";

const PROJECT_REF = "qkjuywqrncsbxjzwtlzm";
const FN_URL = `https://${PROJECT_REF}.functions.supabase.co/e2e-reset`;

export default async function globalTeardown() {
  const secret = process.env.E2E_RESET_SECRET;
  if (!secret) return;

  const ctx = await request.newContext();
  const res = await ctx.post(FN_URL, {
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    data: { action: "teardown" },
  });
  if (!res.ok()) {
    console.warn(`[e2e] teardown failed: ${res.status()} ${await res.text()}`);
  } else {
    console.log("[e2e] teardown complete");
  }
  await ctx.dispose();
}