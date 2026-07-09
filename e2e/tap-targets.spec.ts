import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { configFor, envFloor, EXEMPT_ROLES } from "./tap-target-config";

/**
 * Regression guard for WCAG 2.5.5 (Target Size). Thresholds are configured
 * per Playwright project and per control type in ./tap-target-config.ts —
 * edit that file (not this test) to tune sizes.
 *
 * On failure, this test writes a per-offender screenshot plus a JSON +
 * text report to Playwright's output dir and attaches them via
 * testInfo.attach(), so the html/blob reporter surfaces them as CI
 * artifacts (visible in the Playwright HTML report and downloadable
 * from GitHub Actions / any CI upload-artifact step).
 */
test.describe("dashboard tap targets", () => {
  test("all dashboard buttons & links meet configured minimum", async ({ page }, testInfo) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(!email || !password, "E2E account not provisioned");

    const cfg = configFor(testInfo.project.name);
    const floor = envFloor();
    const payload = {
      rules: cfg.rules.map((r) => ({
        selector: r.selector,
        minWidth: floor ? Math.max(r.minWidth, floor) : r.minWidth,
        minHeight: floor ? Math.max(r.minHeight, floor) : r.minHeight,
      })),
      ignore: cfg.ignore,
      exemptRoles: EXEMPT_ROLES,
    };

    await page.goto("/auth");
    await page.getByRole("button", { name: /log in/i }).click();
    await page.getByPlaceholder("you@example.com").fill(email!);
    await page.getByPlaceholder("••••••••").fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|wizard)/, { timeout: 15_000 });
    test.skip(!/\/dashboard/.test(page.url()), "no wedding_site provisioned");
    await page.waitForLoadState("networkidle");

    const tabs = page.locator('[data-tour^="tab-"]');
    const tabCount = await tabs.count();
    const failures: Array<{
      tab: string;
      tag: string;
      role: string | null;
      name: string;
      width: number;
      height: number;
      minWidth: number;
      minHeight: number;
      selector: string;
      screenshot?: string;
    }> = [];

    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);
      const tabName = (await tab.getAttribute("data-tour")) ?? `tab-${i}`;
      await tab.click();
      await page.waitForTimeout(200);

      const offenders = await page.evaluate((cfg) => {
        const results: Array<{
          tag: string;
          role: string | null;
          name: string;
          width: number;
          height: number;
          minWidth: number;
          minHeight: number;
          selector: string;
          marker: string;
        }> = [];
        const nodes = document.querySelectorAll<HTMLElement>(
          'button, a[href], [role="button"], [role="link"], [role="menuitem"], [role="tab"]',
        );
        const matches = (el: Element, sel: string) => {
          if (sel === "*") return true;
          try { return el.matches(sel); } catch { return false; }
        };
        let n = 0;
        for (const el of Array.from(nodes)) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          const style = getComputedStyle(el);
          if (style.visibility === "hidden" || style.display === "none") continue;
          const role = el.getAttribute("role");
          if (role && cfg.exemptRoles.includes(role)) continue;
          if (cfg.ignore.some((s) => matches(el, s))) continue;
          if (el.tagName === "A" && el.closest("p, li, span")) continue;
          const rule = cfg.rules.find((r) => matches(el, r.selector));
          if (!rule) continue;
          if (rect.width < rule.minWidth || rect.height < rule.minHeight) {
            const name =
              (el.getAttribute("aria-label") ||
                el.textContent?.trim().slice(0, 60) ||
                el.getAttribute("title") ||
                "").replace(/\s+/g, " ");
            const idPart = el.id ? `#${el.id}` : "";
            const cls =
              el.className && typeof el.className === "string"
                ? "." + el.className.split(/\s+/).slice(0, 2).join(".")
                : "";
            const marker = `ttv-${n++}`;
            el.setAttribute("data-ttv", marker);
            (el as HTMLElement).style.outline = "3px solid #ff2d55";
            (el as HTMLElement).style.outlineOffset = "2px";
            results.push({
              tag: el.tagName.toLowerCase(),
              role,
              name,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              minWidth: rule.minWidth,
              minHeight: rule.minHeight,
              selector: `${el.tagName.toLowerCase()}${idPart}${cls}`,
              marker,
            });
          }
        }
        return results;
      }, payload);

      for (const o of offenders) {
        const shotPath = testInfo.outputPath(`offender-${tabName}-${o.marker}.png`);
        try {
          await page.locator(`[data-ttv="${o.marker}"]`).screenshot({ path: shotPath });
          await testInfo.attach(`${tabName} · ${o.selector}`, {
            path: shotPath,
            contentType: "image/png",
          });
          failures.push({ tab: tabName, ...o, screenshot: path.basename(shotPath) });
        } catch {
          failures.push({ tab: tabName, ...o });
        }
      }
    }

    const report = failures
      .map(
        (f) =>
          `  [${f.tab}] ${f.selector} (${f.role ?? f.tag}) "${f.name}" — ${f.width}x${f.height}px (min ${f.minWidth}x${f.minHeight})${f.screenshot ? ` → ${f.screenshot}` : ""}`,
      )
      .join("\n");

    if (failures.length) {
      const jsonPath = testInfo.outputPath("tap-target-violations.json");
      fs.writeFileSync(
        jsonPath,
        JSON.stringify(
          {
            project: testInfo.project.name,
            viewport: page.viewportSize(),
            envFloor: floor,
            generatedAt: new Date().toISOString(),
            count: failures.length,
            failures,
          },
          null,
          2,
        ),
      );
      await testInfo.attach("tap-target-violations.json", {
        path: jsonPath,
        contentType: "application/json",
      });
      await testInfo.attach("tap-target-violations.txt", {
        body: report,
        contentType: "text/plain",
      });
    }

    expect(
      failures,
      `Tap targets below configured minimum on ${testInfo.project.name} dashboard:\n${report}`,
    ).toEqual([]);
  });
});