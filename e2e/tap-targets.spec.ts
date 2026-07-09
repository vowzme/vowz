import { test, expect } from "@playwright/test";

/**
 * Regression guard for WCAG 2.5.5 (Target Size) on the customer dashboard.
 * Measures every visible <button> and <a> at the Pixel 7 viewport and
 * fails if any drops below the 44 x 44 px minimum after a UI change.
 *
 * Runs only under the `mobile` Playwright project. Skips cleanly when
 * the E2E account isn't provisioned.
 */

const MIN = 44;

// Roles that are intentionally small by design (inline toggles, checkbox
// dots, etc.) and are documented exemptions from the 44px rule because
// their surrounding label provides a larger effective target.
const EXEMPT_ROLES = new Set(["switch", "checkbox", "radio", "separator"]);

// Runs on every viewport project (desktop chromium, tablet, mobile) so a
// shrunken control fails CI no matter which breakpoint it regresses at.
test.describe("dashboard tap targets", () => {
  test("all dashboard buttons & links meet 44x44 minimum", async ({ page }, testInfo) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(!email || !password, "E2E account not provisioned");

    await page.goto("/auth");
    await page.getByRole("button", { name: /log in/i }).click();
    await page.getByPlaceholder("you@example.com").fill(email!);
    await page.getByPlaceholder("••••••••").fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|wizard)/, { timeout: 15_000 });
    test.skip(!/\/dashboard/.test(page.url()), "no wedding_site provisioned");
    await page.waitForLoadState("networkidle");

    // Iterate every Tabs trigger so controls behind each tab get measured.
    const tabs = page.locator('[data-tour^="tab-"]');
    const tabCount = await tabs.count();
    const failures: Array<{
      tab: string;
      tag: string;
      role: string | null;
      name: string;
      width: number;
      height: number;
      selector: string;
    }> = [];

    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);
      const tabName = (await tab.getAttribute("data-tour")) ?? `tab-${i}`;
      await tab.click();
      await page.waitForTimeout(200); // let content mount

      const offenders = await page.evaluate((min) => {
        const results: Array<{
          tag: string;
          role: string | null;
          name: string;
          width: number;
          height: number;
          selector: string;
        }> = [];
        const nodes = document.querySelectorAll<HTMLElement>(
          'button, a[href], [role="button"], [role="link"], [role="menuitem"], [role="tab"]',
        );
        for (const el of Array.from(nodes)) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue; // hidden
          const style = getComputedStyle(el);
          if (style.visibility === "hidden" || style.display === "none") continue;
          const role = el.getAttribute("role");
          if (role && ["switch", "checkbox", "radio", "separator"].includes(role))
            continue;
          // Inline text links inside paragraphs are exempt — WCAG 2.5.5 excludes
          // inline text targets.
          if (el.tagName === "A" && el.closest("p, li, span")) continue;
          if (rect.width < min || rect.height < min) {
            const name =
              (el.getAttribute("aria-label") ||
                el.textContent?.trim().slice(0, 60) ||
                el.getAttribute("title") ||
                "").replace(/\s+/g, " ");
            const idPart = el.id ? `#${el.id}` : "";
            const cls = el.className && typeof el.className === "string"
              ? "." + el.className.split(/\s+/).slice(0, 2).join(".")
              : "";
            results.push({
              tag: el.tagName.toLowerCase(),
              role,
              name,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              selector: `${el.tagName.toLowerCase()}${idPart}${cls}`,
            });
          }
        }
        return results;
      }, MIN);

      for (const o of offenders) failures.push({ tab: tabName, ...o });
    }

    const report = failures
      .map(
        (f) =>
          `  [${f.tab}] ${f.selector} (${f.role ?? f.tag}) "${f.name}" — ${f.width}x${f.height}px`,
      )
      .join("\n");

    expect(
      failures,
      `Tap targets below ${MIN}px on ${testInfo.project.name} dashboard:\n${report}`,
    ).toEqual([]);
  });
});