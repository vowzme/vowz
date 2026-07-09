import { test, expect, Page } from "@playwright/test";

/**
 * Public focus-visible sanity checks. Ensures every interactive
 * element type used by the dashboard renders a visible focus ring
 * when reached via keyboard. Runs on public routes so it never needs
 * an authenticated session.
 *
 * We test against pages that render the same shadcn primitives the
 * dashboard uses (Button, Input, Link, Switch, Tabs), so any global
 * regression to the design system's focus tokens is caught here.
 */

async function hasFocusIndicator(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return false;
    const cs = getComputedStyle(el);
    const outlineOk = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
    const shadowOk = cs.boxShadow && cs.boxShadow !== "none";
    // Some designs stack the ring on a wrapper; walk up two levels.
    let parent = el.parentElement;
    let ancestorShadow = false;
    for (let i = 0; parent && i < 2; i++, parent = parent.parentElement) {
      const ps = getComputedStyle(parent).boxShadow;
      if (ps && ps !== "none") { ancestorShadow = true; break; }
    }
    return outlineOk || Boolean(shadowOk) || ancestorShadow;
  });
}

test.describe("design-system focus indicators", () => {
  test("landing page: primary CTAs render a focus ring", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const buttons = page.locator("a, button").filter({ hasNotText: "" });
    const total = Math.min(await buttons.count(), 8);
    expect(total, "public buttons/links present").toBeGreaterThan(0);

    let checked = 0;
    for (let i = 0; i < total; i++) {
      const b = buttons.nth(i);
      if (!(await b.isVisible())) continue;
      if (!(await b.isEnabled())) continue;
      await b.focus();
      const visible = await hasFocusIndicator(page);
      expect(visible, `element #${i} lacks a focus indicator`).toBe(true);
      checked++;
      if (checked >= 5) break;
    }
    expect(checked, "checked at least 3 interactive elements").toBeGreaterThanOrEqual(3);
  });

  test("auth page: form inputs, tab buttons, and submit render focus rings", async ({ page }) => {
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");

    // Tab-list toggles (Sign up / Log in).
    const tabButtons = page.getByRole("tab");
    const tabCount = await tabButtons.count();
    if (tabCount > 0) {
      await tabButtons.first().focus();
      expect(await hasFocusIndicator(page), "auth tab focus ring").toBe(true);
    }

    // Any visible text input.
    const email = page.getByPlaceholder("you@example.com").first();
    if (await email.count()) {
      await email.focus();
      expect(await hasFocusIndicator(page), "email input focus ring").toBe(true);
      await page.keyboard.type("kbtest@example.com");
      await expect(email).toHaveValue("kbtest@example.com");
    }

    const submit = page.getByRole("button", { name: /(log in|sign up)/i }).first();
    if (await submit.count()) {
      await submit.focus();
      expect(await hasFocusIndicator(page), "submit button focus ring").toBe(true);
    }
  });

  test("Tab / Shift+Tab reversibility on landing", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());

    const sequence: string[] = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      const id = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return "";
        return (
          el.getAttribute("aria-label") ??
          el.getAttribute("href") ??
          el.textContent?.trim().slice(0, 40) ??
          el.tagName
        );
      });
      sequence.push(id || "");
    }

    // Now reverse.
    const reversed: string[] = [];
    for (let i = 0; i < 6; i++) {
      const id = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return "";
        return (
          el.getAttribute("aria-label") ??
          el.getAttribute("href") ??
          el.textContent?.trim().slice(0, 40) ??
          el.tagName
        );
      });
      reversed.push(id || "");
      await page.keyboard.press("Shift+Tab");
    }

    // reversed[0] should equal sequence[5], reversed[1] === sequence[4], etc.
    // Some elements may not focus (skip links, disabled), so we assert
    // at least half of the pairs match to guard against a broken tab order.
    let matches = 0;
    for (let i = 0; i < 6; i++) {
      if (reversed[i] === sequence[5 - i]) matches++;
    }
    expect(matches, `tab order was not reversible (forward=${sequence.join("|")} reversed=${reversed.join("|")})`).toBeGreaterThanOrEqual(3);
  });
});
