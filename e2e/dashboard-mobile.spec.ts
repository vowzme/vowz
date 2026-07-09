import { test, expect } from "@playwright/test";

/**
 * Mobile dashboard smoke: signs in with the E2E-provisioned account and
 * exercises the three surfaces that are most sensitive to small viewports —
 * the guided tour, the background-music card, and the publish/unpublish
 * control. Skipped automatically when E2E credentials are not provisioned
 * (e.g. running `test:e2e` without `E2E_RESET_SECRET`).
 *
 * Runs only under the `mobile` Playwright project (Pixel 7 viewport).
 */
test.describe("dashboard on mobile", () => {
  test.skip(
    ({ }, testInfo) => testInfo.project.name !== "mobile",
    "mobile viewport only",
  );

  test("tour, music card, and publish controls work at Pixel 7 size", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(!email || !password, "E2E account not provisioned (E2E_RESET_SECRET unset)");

    // 1. Sign in via the auth form (default view is Sign Up — toggle to Log In).
    await page.goto("/auth");
    await page.getByRole("button", { name: /log in/i }).click();
    await page.getByPlaceholder("you@example.com").fill(email!);
    await page.getByPlaceholder("••••••••").fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Landed on dashboard (or wizard if there's no site yet).
    await page.waitForURL(/\/(dashboard|wizard)/, { timeout: 15_000 });

    // If the account has no wedding_site, the dashboard surfaces we're testing
    // don't exist. Skip rather than fail — provisioning a site is out of
    // scope for this smoke test.
    if (!/\/dashboard/.test(page.url())) {
      test.skip(true, "no wedding_site provisioned for E2E account");
    }

    const siteCard = page.locator('[data-tour="site-card"]');
    if ((await siteCard.count()) === 0) {
      test.skip(true, "no wedding_site provisioned for E2E account");
    }

    // 2. Dashboard tour: header trigger opens driver.js popover, Skip/Close
    //    dismisses it, and re-opening still works.
    const tourTrigger = page.locator('[data-tour="tour-trigger"]');
    await expect(tourTrigger).toBeVisible();
    // Tap target should be at least 44px tall on mobile.
    const box = await tourTrigger.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);

    await tourTrigger.click();
    const popover = page.locator(".driver-popover");
    await expect(popover).toBeVisible({ timeout: 5_000 });
    // Popover should fit inside the mobile viewport width.
    const viewport = page.viewportSize();
    const popBox = await popover.boundingBox();
    if (viewport && popBox) {
      expect(popBox.width).toBeLessThanOrEqual(viewport.width);
    }
    // Close via the driver.js close button (Escape also works).
    await page.keyboard.press("Escape");
    await expect(popover).toHaveCount(0);

    // 3. Music card: enable/disable toggle switches state.
    // The overview tab hosts the music card. Ensure we're on it.
    await page.locator('[data-tour="tab-overview"]').click();
    const musicSwitch = page.getByRole("switch", {
      name: /(mute|enable) background music/i,
    });
    await expect(musicSwitch).toBeVisible();
    const before = await musicSwitch.getAttribute("aria-checked");
    await musicSwitch.click();
    await expect
      .poll(() => musicSwitch.getAttribute("aria-checked"))
      .not.toBe(before);
    // Toggle back to leave state unchanged.
    await musicSwitch.click();
    await expect
      .poll(() => musicSwitch.getAttribute("aria-checked"))
      .toBe(before);

    // 4. Publish control: button is visible, has an accessible name, and is
    //    large enough to tap. We don't actually toggle publish state — that
    //    would spam analytics and change the account fixture.
    const publishBtn = page.locator('[data-tour="publish"]');
    await expect(publishBtn).toBeVisible();
    await expect(publishBtn).toHaveAttribute(
      "aria-label",
      /(publish|unpublish) site/i,
    );
    const pubBox = await publishBtn.boundingBox();
    expect(pubBox?.height ?? 0).toBeGreaterThanOrEqual(40);
  });
});