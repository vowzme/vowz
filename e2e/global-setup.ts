import { request } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const PROJECT_REF = "qkjuywqrncsbxjzwtlzm";
const FN_URL = `https://${PROJECT_REF}.functions.supabase.co/e2e-reset`;

export default async function globalSetup() {
  const secret = process.env.E2E_RESET_SECRET;
  if (!secret) {
    console.warn(
      "[e2e] E2E_RESET_SECRET not set — skipping test-account provisioning. " +
        "Export it before running: `E2E_RESET_SECRET=... bun run test:e2e`",
    );
    return;
  }

  const ctx = await request.newContext();
  const res = await ctx.post(FN_URL, {
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    data: { action: "reset" },
  });
  if (!res.ok()) {
    throw new Error(`[e2e] provisioning failed: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();

  const outDir = path.resolve(".e2e");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "account.json"),
    JSON.stringify({ email: body.email, password: body.password, user_id: body.user_id }, null, 2),
  );

  process.env.E2E_USER_EMAIL = body.email;
  process.env.E2E_USER_PASSWORD = body.password;

  await ctx.dispose();
  console.log(`[e2e] provisioned test account ${body.email}`);
}