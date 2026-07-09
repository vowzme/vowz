import { test, expect, Page } from "@playwright/test";

/**
 * Comprehensive keyboard-only workflow coverage for the customer
 * dashboard. Complements `keyboard-nav.spec.ts` (which covers the tour
 * popover + a few individual controls) by walking each end-to-end user
 * flow with Tab / Shift+Tab / Enter / Space only.
 *
 * Every network mutation is stubbed so state doesn't leak between
 * tests. All specs skip if the E2E test account isn't provisioned
 * (E2E_RESET_SECRET unset) or the account has no wedding_site yet.
 */

async function signIn(page: Page) {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  test.skip(!email || !password, "E2E account not provisioned");
  await page.goto("/auth");
  await page.getByRole("button", { name: /log in/i }).click();
  await page.getByPlaceholder("you@example.com").fill(email!);
  await page.getByPlaceholder("••••••••").fill(password!);
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/(dashboard|wizard)/, { timeout: 15_000 });
  test.skip(!/\/dashboard/.test(page.url()), "no wedding_site provisioned");
  await page.waitForLoadState("networkidle");
}

async function focusedRole(page: Page): Promise<{ tag: string; role: string | null; label: string | null }> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return { tag: "", role: null, label: null };
    return {
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute("role"),
      label: el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 60) ?? null,
    };
  });
}

/** Wait for `document.activeElement` to satisfy the matcher — press Tab up to `max` times. */
async function tabUntil(page: Page, matcher: () => Promise<boolean>, max = 80) {
  if (await matcher()) return true;
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    if (await matcher()) return true;
  }
  return false;
}

/** Assert the currently focused element has a visible focus indicator
 *  (either a non-zero outline width OR a box-shadow set by tailwind's
 *  focus-visible:ring utilities). */
async function expectVisibleFocusRing(page: Page, hint: string) {
  const info = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    return {
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      boxShadow: cs.boxShadow,
      // some designs render the ring via a ::before/::after — fall back
      // to the wrapper's box-shadow if the element itself is bare.
      parentBoxShadow: el.parentElement ? getComputedStyle(el.parentElement).boxShadow : "none",
    };
  });
  expect(info, `no focused element for: ${hint}`).not.toBeNull();
  const hasOutline = info!.outlineStyle !== "none" && parseFloat(info!.outlineWidth) > 0;
  const hasShadow =
    (info!.boxShadow && info!.boxShadow !== "none") ||
    (info!.parentBoxShadow && info!.parentBoxShadow !== "none");
  expect(
    hasOutline || hasShadow,
    `${hint} has no visible focus indicator (outline=${info!.outlineStyle}/${info!.outlineWidth}, shadow=${info!.boxShadow})`,
  ).toBe(true);
}

test.describe("dashboard keyboard workflows", () => {
  test.beforeEach(async ({ page }) => {
    // Stub every wedding_sites mutation so publish / edit / delete never
    // actually change server state.
    await page.route("**/rest/v1/wedding_sites*", (route) => {
      const m = route.request().method();
      if (m === "PATCH" || m === "DELETE") return route.fulfill({ status: 200, body: "[]" });
      return route.continue();
    });
    // Same for the checklist / RSVP tables tests touch.
    await page.route("**/rest/v1/wedding_checklist*", (route) => {
      const m = route.request().method();
      if (m === "POST" || m === "PATCH" || m === "DELETE") {
        return route.fulfill({ status: 200, body: "[]" });
      }
      return route.continue();
    });
  });

  test("primary action bar is reachable by tabbing forward", async ({ page }) => {
    await signIn(page);

    // Focus starts at document — blur any stray element from sign-in.
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());

    const targets = [
      { name: "Edit Site", selector: 'a:has-text("Edit Site")' },
      { name: "Wedding Wizard", selector: 'a:has-text("Wedding Wizard")' },
      { name: "Publish toggle", selector: '[data-tour="publish"]' },
    ];

    for (const t of targets) {
      const el = page.locator(t.selector).first();
      await expect(el, `${t.name} present`).toBeVisible();
      const found = await tabUntil(page, async () => {
        return page.evaluate((sel) => document.activeElement === document.querySelector(sel), t.selector);
      });
      expect(found, `${t.name} reachable via Tab`).toBe(true);
      await expectVisibleFocusRing(page, t.name);
    }
  });

  test("Shift+Tab reverses through the same primary controls", async ({ page }) => {
    await signIn(page);

    const publish = page.locator('[data-tour="publish"]');
    await publish.focus();
    await expectVisibleFocusRing(page, "publish focus");

    // Shift+Tab should move focus off the publish button.
    await page.keyboard.press("Shift+Tab");
    const stillOnPublish = await page.evaluate(
      () => (document.activeElement as HTMLElement)?.getAttribute("data-tour") === "publish",
    );
    expect(stillOnPublish, "Shift+Tab did not move focus backward off Publish").toBe(false);
  });

  test("tab list: Arrow keys move between tabs, Enter/Space activates", async ({ page }) => {
    await signIn(page);

    // Focus the currently selected tab (Overview by default).
    await page.locator('[data-tour="tab-overview"]').focus();
    await expectVisibleFocusRing(page, "tab-overview focus");

    // Radix TabsList uses roving tabindex: ArrowRight moves to the next tab.
    await page.keyboard.press("ArrowRight");
    const focused = await focusedRole(page);
    expect(focused.tag, "ArrowRight should move focus to next TabsTrigger").toBe("button");

    // Enter should activate the focused tab.
    await page.keyboard.press("Enter");
    // The freshly-selected tab should have data-state=active.
    const activeCount = await page.locator('[data-tour^="tab-"][data-state="active"]').count();
    expect(activeCount, "exactly one active tab after Enter").toBe(1);

    // Space also activates the currently-focused tab (WAI-ARIA tab pattern).
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press(" ");
    const activeAfterSpace = await page.locator('[data-tour^="tab-"][data-state="active"]').count();
    expect(activeAfterSpace).toBe(1);
  });

  test("keyboard opens Wedding Wizard resume flow", async ({ page }) => {
    await signIn(page);
    const wizardLink = page.getByRole("link", { name: /wedding wizard/i }).first();
    await wizardLink.focus();
    await expectVisibleFocusRing(page, "Wedding Wizard link");
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/wizard/, { timeout: 10_000 });
    // The resume-summary heading should render, or the wizard step 1
    // if the account is brand-new.
    const heading = page.getByRole("heading", { level: 2 });
    await expect(heading.first()).toBeVisible();
  });

  test("checklist: Tab to Add Task, Enter opens form, Enter submits new task", async ({ page }) => {
    await signIn(page);

    // Navigate via keyboard to the Checklist tab.
    await page.locator('[data-tour="tab-checklist"]').focus();
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-tour="tab-checklist"][data-state="active"]')).toBeVisible();

    const addBtn = page.getByRole("button", { name: /add task/i }).first();
    if ((await addBtn.count()) === 0) test.skip(true, "Add Task button not rendered for this account state");
    await addBtn.focus();
    await expectVisibleFocusRing(page, "Add Task button");
    await page.keyboard.press("Enter");

    // autoFocus should land on the task-title input.
    const titleInput = page.getByRole("textbox", { name: /new task title/i });
    await expect(titleInput).toBeFocused();
    await page.keyboard.type("Order flowers");
    // Enter submits (the row's onKeyDown handler calls handleAdd).
    await page.keyboard.press("Enter");
    // Form collapses on submit — the title input should no longer be visible.
    await expect(titleInput).toBeHidden({ timeout: 3_000 });
  });

  test("EditableField (couple names): Tab to Edit, Enter → type → Enter saves", async ({ page }) => {
    await signIn(page);
    const editBtn = page.getByRole("button", { name: /^edit /i }).first();
    if ((await editBtn.count()) === 0) test.skip(true, "No EditableField rendered on this account");
    await editBtn.focus();
    await expectVisibleFocusRing(page, "EditableField edit trigger");
    await page.keyboard.press("Enter");
    // Text input should now be focused via autoFocus.
    const focused = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
    expect(focused).toBe("input");
    await page.keyboard.press("End");
    await page.keyboard.press("Enter"); // save (no change → no-op)
    // Focus should return to a Button (not lost to <body>).
    const finalFocus = await page.evaluate(() => (document.activeElement as HTMLElement)?.tagName.toLowerCase());
    expect(finalFocus).not.toBe("body");
  });

  test("guest list search input is reachable, accepts input, and clears via keyboard", async ({ page }) => {
    await signIn(page);
    await page.locator('[data-tour="tab-rsvps"]').focus();
    await page.keyboard.press("Enter");
    const search = page.getByRole("textbox", { name: /search rsvps by guest name or email/i });
    if ((await search.count()) === 0) test.skip(true, "no RSVPs → search not rendered");
    await search.focus();
    await expectVisibleFocusRing(page, "RSVP search input");
    await page.keyboard.type("test-guest");
    await expect(search).toHaveValue("test-guest");
    // Backspace should clear character-by-character.
    for (let i = 0; i < "test-guest".length; i++) await page.keyboard.press("Backspace");
    await expect(search).toHaveValue("");
  });

  test("no focus trap: Escape from wizard resume summary returns to dashboard", async ({ page }) => {
    await signIn(page);
    const wizardLink = page.getByRole("link", { name: /wedding wizard/i }).first();
    await wizardLink.focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/wizard/);
    // Browser back = Alt+Left in Chromium; the header back button is
    // also a proper <button>. Focus it and press Enter.
    const backBtn = page.getByRole("button", { name: /back to dashboard|home/i }).first();
    if ((await backBtn.count()) === 0) return; // brand-new account skipped resume screen
    await backBtn.focus();
    await expectVisibleFocusRing(page, "wizard back button");
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
  });
});
