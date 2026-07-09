import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list"],
    // HTML report bundles per-test attachments (screenshots, JSON, text)
    // — upload `playwright-report/` from CI to expose them for debugging.
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "tablet", use: { ...devices["iPad (gen 7)"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});