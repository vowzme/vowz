import { describe, it, expect } from "vitest";
import { WEDDING_THEMES } from "./wedding-themes";
import { computeThemeDiff, THEME_TOKEN_FIELDS, type ThemeTokenField } from "./theme-diff";

describe("computeThemeDiff – What will change summary", () => {
  it("reports every field as unchanged when a theme is diffed against itself", () => {
    for (const t of WEDDING_THEMES) {
      const rows = computeThemeDiff(t, t);
      expect(rows.map((r) => r.field)).toEqual([...THEME_TOKEN_FIELDS]);
      for (const r of rows) expect(r.changed).toBe(false);
    }
  });

  it("covers exactly the token fields — nothing else can silently change", () => {
    const a = WEDDING_THEMES[0];
    const b = WEDDING_THEMES[1];
    const rows = computeThemeDiff(a, b);
    expect(rows).toHaveLength(THEME_TOKEN_FIELDS.length);
    expect(new Set(rows.map((r) => r.field))).toEqual(new Set(THEME_TOKEN_FIELDS));
  });

  it("matches each row's from/to to the underlying theme values across every pair", () => {
    const readers: Record<ThemeTokenField, (t: typeof WEDDING_THEMES[number]) => string> = {
      primary: (t) => t.colors.bg,
      accent: (t) => t.colors.accent,
      ink: (t) => t.colors.ink,
      displayFont: (t) => t.fonts.display,
      bodyFont: (t) => t.fonts.body,
      motif: (t) => t.motif,
    };
    for (const a of WEDDING_THEMES) {
      for (const b of WEDDING_THEMES) {
        const rows = computeThemeDiff(a, b);
        for (const r of rows) {
          expect(r.from).toBe(readers[r.field](a));
          expect(r.to).toBe(readers[r.field](b));
          expect(r.changed).toBe(r.from !== r.to);
        }
      }
    }
  });

  it("flags color fields as color rows and font/motif as non-color", () => {
    const rows = computeThemeDiff(WEDDING_THEMES[0], WEDDING_THEMES[1]);
    const byField = Object.fromEntries(rows.map((r) => [r.field, r.isColor]));
    expect(byField.primary).toBe(true);
    expect(byField.accent).toBe(true);
    expect(byField.ink).toBe(true);
    expect(byField.displayFont).toBe(false);
    expect(byField.bodyFont).toBe(false);
    expect(byField.motif).toBe(false);
  });

  it("never lists content fields (names, tagline, description, tradition, id)", () => {
    const rows = computeThemeDiff(WEDDING_THEMES[0], WEDDING_THEMES[1]);
    const fields = new Set(rows.map((r) => r.field));
    for (const forbidden of ["name", "tagline", "description", "tradition", "id"]) {
      expect(fields.has(forbidden as ThemeTokenField)).toBe(false);
    }
  });
});