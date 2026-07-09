/**
 * Configurable minimum tap-target thresholds for e2e/tap-targets.spec.ts.
 *
 * Tune sizes here (per breakpoint or per control type) without touching
 * test code. Values are pixels; matches use the first rule whose CSS
 * selector matches the element under the current Playwright project.
 *
 * Env override (single knob for CI experimentation):
 *   TAP_TARGET_MIN=48 bun run test:e2e -- e2e/tap-targets.spec.ts
 */

export interface TapTargetRule {
  /** CSS selector this rule applies to. `*` matches everything. */
  selector: string;
  /** Minimum width in px. */
  minWidth: number;
  /** Minimum height in px. */
  minHeight: number;
}

export interface TapTargetConfig {
  /** Ordered rules: first match wins (put more-specific selectors first). */
  rules: TapTargetRule[];
  /** Selectors to skip entirely (in addition to the built-in exemptions). */
  ignore: string[];
}

// Per Playwright project. Keys must match `projects[].name` in playwright.config.ts.
// WCAG 2.5.5 (AA) = 24x24; WCAG 2.5.5 (AAA) & Apple HIG = 44x44; Material = 48x48.
export const TAP_TARGET_CONFIG: Record<string, TapTargetConfig> = {
  mobile: {
    rules: [
      // Icon-only buttons must be full 44px squares.
      { selector: 'button[aria-label]:not(:has(> span:not(.sr-only)))', minWidth: 44, minHeight: 44 },
      // Tabs strip on small screens is denser by design.
      { selector: '[role="tab"]', minWidth: 44, minHeight: 40 },
      // Everything else: WCAG AAA / Apple HIG.
      { selector: "*", minWidth: 44, minHeight: 44 },
    ],
    ignore: [],
  },
  tablet: {
    rules: [
      { selector: '[role="tab"]', minWidth: 40, minHeight: 40 },
      { selector: "*", minWidth: 40, minHeight: 40 },
    ],
    ignore: [],
  },
  chromium: {
    // Desktop pointer devices: WCAG AA minimum (24x24) is enough.
    rules: [
      { selector: '[role="tab"]', minWidth: 24, minHeight: 24 },
      { selector: "*", minWidth: 32, minHeight: 32 },
    ],
    ignore: [],
  },
};

/** Roles intentionally exempt (label provides the real hit area). */
export const EXEMPT_ROLES = ["switch", "checkbox", "radio", "separator"];

/** Look up the config for a project; falls back to the mobile defaults. */
export function configFor(projectName: string): TapTargetConfig {
  return TAP_TARGET_CONFIG[projectName] ?? TAP_TARGET_CONFIG.mobile;
}

/** Optional env override — applies a uniform floor across all rules. */
export function envFloor(): number | null {
  const raw = process.env.TAP_TARGET_MIN;
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}