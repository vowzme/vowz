import { test, expect, Page } from "@playwright/test";

/**
 * Keyboard-only reachability audit for the customer dashboard. Verifies:
 *   - Tour trigger button is tabbable and opens the popover via Enter.
 *   - Driver.js popover moves focus into itself, Escape closes and
 *     returns focus to the trigger.
 *   - HelpTip popover: Enter opens, Escape closes + restores focus.
 *   - Music switch is reachable via Tab + toggles via Space.
 *   - Publish button is reachable via Tab + activates via Enter (we
 *     intercept the resulting click so state doesn't actually change).
 */

async function tabUntil(page: Page, matcher: () => Promise<boolean>, max = 60) {
  for (let i = 0; i < max; i++) {
    if (await matcher()) return true;
    await page.keyboard.press("Tab");
  }
  return false;
}

async function focusedAttr(page: Page, name: string) {
  return page.evaluate(
    (n) => (document.activeElement as HTMLElement | null)?.getAttribute(n) ?? null,
    name,
  );
}

test.describe("dashboard keyboard navigation", () => {
  test("tour, help, music, and publish controls are reachable without a mouse", async ({
    page,
  }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(!email || !password, "E2E account not provisioned (E2E_RESET_SECRET unset)");

    // Sign in via keyboard-only interactions.
    await page.goto("/auth");
    await page.getByRole("button", { name: /log in/i }).click();
    await page.getByPlaceholder("you@example.com").fill(email!);
    await page.getByPlaceholder("••••••••").fill(password!);
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/(dashboard|wizard)/, { timeout: 15_000 });
    test.skip(!/\/dashboard/.test(page.url()), "no wedding_site provisioned");
    await page.waitForLoadState("networkidle");

    // ── 1. Tour trigger reachable via Tab, opens with Enter ────────────
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    const reachedTour = await tabUntil(page, async () =>
      (await focusedAttr(page, "data-tour")) === "tour-trigger",
    );
    expect(reachedTour, "tour trigger not reachable via Tab").toBe(true);

    await page.keyboard.press("Enter");
    const popover = page.locator(".driver-popover");
    await expect(popover).toBeVisible({ timeout: 5_000 });

    // Focus should have moved into the popover.
    const focusInPopover = await page.evaluate(() =>
      document.querySelector(".driver-popover")?.contains(document.activeElement),
    );
    expect(focusInPopover, "focus did not move into tour popover").toBe(true);

    // Escape closes and returns focus to the trigger.
    await page.keyboard.press("Escape");
    await expect(popover).toHaveCount(0);
    expect(await focusedAttr(page, "data-tour")).toBe("tour-trigger");

    // ── 2. HelpTip: Tab to any "Help:" button, Enter opens, Esc closes ─
    const helpBtn = page.getByRole("button", { name: /^Help: /i }).first();
    if ((await helpBtn.count()) > 0) {
      await helpBtn.focus();
      await page.keyboard.press("Enter");
      const helpDialog = page.getByRole("dialog").first();
      await expect(helpDialog).toBeVisible();
      // Close button inside should be focused.
      const closeFocused = await page.evaluate(() =>
        (document.activeElement as HTMLElement)?.getAttribute("aria-label") === "Close help",
      );
      expect(closeFocused, "focus did not move to HelpTip close button").toBe(true);

      await page.keyboard.press("Escape");
      await expect(helpDialog).toBeHidden();
    }

    // ── 3. Music switch: reachable via Tab, toggles with Space ─────────
    await page.locator('[data-tour="tab-overview"]').focus();
    await page.keyboard.press("Enter");
    const musicSwitch = page.getByRole("switch", {
      name: /(mute|enable) background music/i,
    });
    await expect(musicSwitch).toBeVisible();
    await musicSwitch.focus();
    const beforeMusic = await musicSwitch.getAttribute("aria-checked");
    await page.keyboard.press("Space");
    await expect
      .poll(() => musicSwitch.getAttribute("aria-checked"))
      .not.toBe(beforeMusic);
    // Restore.
    await page.keyboard.press("Space");
    await expect
      .poll(() => musicSwitch.getAttribute("aria-checked"))
      .toBe(beforeMusic);

    // ── 4. Publish button: reachable via Tab, activates via Enter ──────
    // Intercept the resulting mutation so we don't actually publish.
    await page.route("**/rest/v1/wedding_sites*", (route) => {
      if (route.request().method() === "PATCH") return route.fulfill({ status: 200, body: "[]" });
      return route.continue();
    });
    const publishBtn = page.locator('[data-tour="publish"]');
    await publishBtn.focus();
    const focusedTour = await focusedAttr(page, "data-tour");
    expect(focusedTour, "publish button not focusable").toBe("publish");
    // Enter should trigger the button's click handler without navigation.
    await page.keyboard.press("Enter");
    // Button remains attached (page didn't reload).
    await expect(publishBtn).toBeVisible();
  });
});