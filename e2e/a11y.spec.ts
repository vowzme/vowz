import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated WCAG 2.1 A/AA audit powered by axe-core. Runs against public
 * routes always, and against the authenticated customer dashboard —
 * including the tour popover open state — when the E2E account is
 * provisioned. Each test fails on any violation at level A/AA so
 * regressions show up in CI.
 */

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

function formatViolations(violations: any[]) {
  return violations
    .map(
      (v) =>
        `\n[${v.impact}] ${v.id}: ${v.help}\n  ${v.helpUrl}\n  nodes: ${v.nodes
          .slice(0, 3)
          .map((n: any) => n.target.join(" "))
          .join(" | ")}`,
    )
    .join("\n");
}

for (const path of ["/", "/pricing", "/auth"]) {
  test(`a11y: public route ${path} has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(
      results.violations,
      `axe violations on ${path}:${formatViolations(results.violations)}`,
    ).toEqual([]);
  });
}

test("a11y: customer dashboard (incl. tour popover) has no WCAG A/AA violations", async ({
  page,
}) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  test.skip(!email || !password, "E2E account not provisioned (E2E_RESET_SECRET unset)");

  await page.goto("/auth");
  await page.getByRole("button", { name: /log in/i }).click();
  await page.getByPlaceholder("you@example.com").fill(email!);
  await page.getByPlaceholder("••••••••").fill(password!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/(dashboard|wizard)/, { timeout: 15_000 });
  test.skip(!/\/dashboard/.test(page.url()), "no wedding_site provisioned");

  await page.waitForLoadState("networkidle");

  // 1. Baseline dashboard scan.
  const base = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(
    base.violations,
    `dashboard axe violations:${formatViolations(base.violations)}`,
  ).toEqual([]);

  // 2. Open the guided tour and scan again — this catches contrast,
  //    focus, and aria-* issues inside the driver.js popover.
  const tourTrigger = page.locator('[data-tour="tour-trigger"]');
  if ((await tourTrigger.count()) > 0) {
    await tourTrigger.click();
    await page.locator(".driver-popover").waitFor({ state: "visible", timeout: 5_000 });
    const withPopover = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(
      withPopover.violations,
      `tour popover axe violations:${formatViolations(withPopover.violations)}`,
    ).toEqual([]);
    await page.keyboard.press("Escape");
  }

  // 3. Open a HelpTip popover and scan.
  const helpBtn = page.getByRole("button", { name: /^Help: /i }).first();
  if ((await helpBtn.count()) > 0) {
    await helpBtn.click();
    const withHelp = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(
      withHelp.violations,
      `HelpTip axe violations:${formatViolations(withHelp.violations)}`,
    ).toEqual([]);
  }
});