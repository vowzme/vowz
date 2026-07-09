import { test, expect } from "@playwright/test";

/**
 * Screenshot-based visual regression for the customer dashboard controls.
 * On the first run per project (`--update-snapshots`) Playwright saves a
 * baseline PNG under e2e/visual-regression.spec.ts-snapshots/. Later runs
 * diff against that baseline and fail if pixels drift beyond `maxDiffPixelRatio`.
 *
 * Runs at both desktop and mobile viewports (Playwright's `chromium` and
 * `mobile` projects). Skips cleanly when the E2E account isn't provisioned.
 */

// Everything that carries a live timestamp, avatar, or async widget is masked
// so trivial content churn doesn't produce false diffs — we only care about
// layout/spacing regressions of the controls themselves.
const DYNAMIC_MASKS = [
  "[data-tour=\"analytics\"]",
  "[data-tour=\"welcome\"] time",
  ".recharts-wrapper",
  "img[alt]",
];

async function signInIfPossible(page: import("@playwright/test").Page) {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) return false;
  await page.goto("/auth");
  await page.getByRole("button", { name: /log in/i }).click();
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/(dashboard|wizard)/, { timeout: 15_000 });
  return /\/dashboard/.test(page.url());
}

test.describe("dashboard visual regression", () => {
  test.beforeEach(async () => {
    test.skip(
      !process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD,
      "E2E account not provisioned (E2E_RESET_SECRET unset)",
    );
  });

  test("overview tab layout", async ({ page }, testInfo) => {
    const ok = await signInIfPossible(page);
    test.skip(!ok, "no wedding_site provisioned");
    await page.locator('[data-tour="tab-overview"]').click();
    await page.waitForLoadState("networkidle");

    const masks = DYNAMIC_MASKS.map((s) => page.locator(s));
    // Freeze the "Powered by" footer, tooltips, and any pending animations.
    await page.addStyleTag({
      content:
        "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;}",
    });

    await expect(page).toHaveScreenshot(
      `dashboard-overview-${testInfo.project.name}.png`,
      {
        fullPage: true,
        mask: masks,
        maxDiffPixelRatio: 0.02, // 2% tolerance for font AA / avatars
        animations: "disabled",
      },
    );
  });

  test("site card + publish controls", async ({ page }, testInfo) => {
    const ok = await signInIfPossible(page);
    test.skip(!ok, "no wedding_site provisioned");
    await page.locator('[data-tour="tab-overview"]').click();
    const card = page.locator('[data-tour="site-card"]');
    await expect(card).toBeVisible();
    await page.addStyleTag({
      content:
        "*,*::before,*::after{animation:none!important;transition:none!important;}",
    });
    await expect(card).toHaveScreenshot(
      `dashboard-site-card-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.02, animations: "disabled" },
    );
  });

  test("background music card", async ({ page }, testInfo) => {
    const ok = await signInIfPossible(page);
    test.skip(!ok, "no wedding_site provisioned");
    await page.locator('[data-tour="tab-overview"]').click();
    const music = page.locator('[data-tour="music"]');
    await expect(music).toBeVisible();
    await page.addStyleTag({
      content:
        "*,*::before,*::after{animation:none!important;transition:none!important;}",
    });
    await expect(music).toHaveScreenshot(
      `dashboard-music-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.02, animations: "disabled" },
    );
  });

  test("tabs strip", async ({ page }, testInfo) => {
    const ok = await signInIfPossible(page);
    test.skip(!ok, "no wedding_site provisioned");
    const tabs = page.locator('[data-tour="tabs"]');
    await expect(tabs).toBeVisible();
    await page.addStyleTag({
      content:
        "*,*::before,*::after{animation:none!important;transition:none!important;}",
    });
    await expect(tabs).toHaveScreenshot(
      `dashboard-tabs-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.02, animations: "disabled" },
    );
  });
});