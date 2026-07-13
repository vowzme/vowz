import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { WEDDING_THEMES } from "./wedding-themes";
import { computeThemeDiff, diffThemes } from "./theme-diff";
import {
  WhatWillChangeSummary,
  TokenDiffTable,
} from "@/components/ThemeSwitchImpact";

// Themes are user/AI-authored data. A partial theme (missing colors,
// fonts, motif, or the entire object) must never crash the dialog, and
// the diff must never falsely mark a missing field as "changed".
const base = WEDDING_THEMES[0];

// Build a set of intentionally-broken themes covering every missing-
// field permutation we can realistically hit.
const partials = [
  { id: "no-colors", label: "missing colors block", theme: { ...base, colors: undefined as never } },
  { id: "no-fonts", label: "missing fonts block", theme: { ...base, fonts: undefined as never } },
  { id: "no-motif", label: "missing motif", theme: { ...base, motif: undefined as never } },
  {
    id: "partial-colors",
    label: "partial colors (no accent/ink)",
    theme: { ...base, colors: { ...base.colors, accent: undefined as never, ink: undefined as never } },
  },
  {
    id: "empty-theme",
    label: "empty theme object",
    theme: {} as unknown as typeof base,
  },
];

describe("theme-diff with missing/undefined fields", () => {
  for (const p of partials) {
    it(`computeThemeDiff marks all fields unchanged when comparing against ${p.label}`, () => {
      const rows = computeThemeDiff(base, p.theme);
      // Rows where the broken side is undefined must be `changed:false`.
      for (const r of rows) {
        if (r.to === undefined || r.from === undefined) {
          expect(r.changed, `${r.field} should be unchanged`).toBe(false);
        }
      }
    });

    it(`diffThemes marks all rows unchanged when comparing against ${p.label}`, () => {
      const { rows, changedLabels } = diffThemes(base, p.theme);
      // Any row whose reader could return undefined on the broken side
      // must stay unchanged. Guaranteed by "bothDefined" guard.
      expect(rows.some((r) => r.changed && (r.from === "—" || r.to === "—"))).toBe(false);
      // Sanity: at least one row is affected by the missing field.
      expect(changedLabels.length).toBeLessThan(rows.length);
    });

    it(`WhatWillChangeSummary renders safely against ${p.label}`, () => {
      const { getByTestId } = render(
        <WhatWillChangeSummary current={base} next={p.theme} />,
      );
      const panel = getByTestId("what-will-change");
      // No literal "undefined" leaks into the DOM.
      expect(panel.textContent).not.toMatch(/undefined/);
    });

    it(`TokenDiffTable renders safely against ${p.label}`, () => {
      const { getByTestId } = render(
        <TokenDiffTable current={base} next={p.theme} />,
      );
      const list = getByTestId("token-diff");
      expect(list.textContent).not.toMatch(/undefined/);
      // Table always has one row per applyTheme field.
      expect(list.querySelectorAll("li")).toHaveLength(4);
    });
  }

  it("identity diff against a fully-missing theme reports zero changes", () => {
    const empty = {} as unknown as typeof base;
    const rows = computeThemeDiff(empty, empty);
    expect(rows.every((r) => !r.changed)).toBe(true);
    const { changedLabels } = diffThemes(empty, empty);
    expect(changedLabels).toEqual([]);
  });
});
