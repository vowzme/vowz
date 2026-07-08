import { test, expect } from "@playwright/test";

// Public marketing + info routes should all render a <main> without crashing.
const PUBLIC_ROUTES = ["/", "/pricing", "/templates", "/card-gallery", "/blog", "/about", "/contact", "/affiliate", "/franchise", "/privacy", "/terms", "/refund-policy"];

for (const path of PUBLIC_ROUTES) {
  test(`public route renders: ${path}`, async ({ page }) => {
    const resp = await page.goto(path);
    expect(resp?.status(), `HTTP status for ${path}`).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    // Non-default title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toBe("Lovable App");
    expect(title).not.toBe("Vite App");
  });
}

test("SEO: robots.txt is served and references sitemap", async ({ request }) => {
  const r = await request.get("/robots.txt");
  expect(r.status()).toBe(200);
  const body = await r.text();
  expect(body.toLowerCase()).toContain("sitemap:");
});

test("SEO: sitemap.xml is served", async ({ request }) => {
  const r = await request.get("/sitemap.xml");
  expect(r.status()).toBe(200);
  const body = await r.text();
  expect(body).toContain("<urlset");
});

test("auth page toggles between login and signup", async ({ page }) => {
  await page.goto("/auth");
  // Default is signup — has Full Name field
  await expect(page.getByLabel("Full Name")).toBeVisible();
  await page.getByRole("button", { name: /log in/i }).click();
  // After toggle, Full Name should be gone
  await expect(page.getByLabel("Full Name")).toHaveCount(0);
});

test("protected route redirects to /auth when signed out", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth/);
});

test("wizard requires auth", async ({ page }) => {
  await page.goto("/wizard");
  await expect(page).toHaveURL(/\/auth/);
});

test("editor requires auth", async ({ page }) => {
  await page.goto("/editor");
  await expect(page).toHaveURL(/\/auth/);
});

test("admin debug page redirects non-admins", async ({ page }) => {
  await page.goto("/debug/icons");
  // Not admin → bounces to /
  await expect(page).toHaveURL(/^https?:\/\/[^/]+\/?$/);
});

test("premium templates show a lock badge to anonymous users", async ({ page }) => {
  await page.goto("/card-gallery");
  // Wait for at least one template card
  await page.waitForSelector("[data-testid='template-card'], article, .card", { timeout: 10_000 }).catch(() => {});
  // Lock icon (lucide) is rendered on premium cards for non-premium users
  const locks = await page.locator("svg.lucide-lock").count();
  expect(locks).toBeGreaterThan(0);
});

test("pricing page shows plans and upgrade CTA", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByText(/premium/i).first()).toBeVisible();
});