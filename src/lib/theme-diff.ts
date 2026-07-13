import { WEDDING_THEMES } from "@/lib/wedding-themes";

// Single source of truth for which wizardData fields `applyTheme` writes
// during a theme switch/merge. Keep this in lockstep with applyTheme in
// OnboardingWizard.tsx — the "What changes" summary and token-diff table
// are both derived from this list.
export type ThemeField = {
  key: "theme" | "suggestedColors" | "displayFont" | "bodyFont";
  label: string;
  get: (t: typeof WEDDING_THEMES[number]) => unknown;
  format: (v: unknown) => string;
  swatch?: (t: typeof WEDDING_THEMES[number]) => string;
};

export const THEME_FIELDS: ThemeField[] = [
  { key: "theme", label: "Theme preset", get: (t) => t.id, format: (v) => String(v) },
  {
    key: "suggestedColors",
    label: "Color palette",
    get: (t) => [t.colors.bg, t.colors.accent, t.colors.light],
    format: (v) => (Array.isArray(v) ? v.join(" · ") : String(v)),
    swatch: (t) => t.colors.accent,
  },
  { key: "displayFont", label: "Display font", get: (t) => t.fonts.display, format: (v) => String(v) },
  { key: "bodyFont", label: "Body font", get: (t) => t.fonts.body, format: (v) => String(v) },
];

export const themeValuesEqual = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

export type ThemeDiffRow = {
  label: string;
  from: string;
  to: string;
  swatchFrom?: string;
  swatchTo?: string;
  changed: boolean;
};

export function diffThemes(
  current: typeof WEDDING_THEMES[number],
  next: typeof WEDDING_THEMES[number],
): { rows: ThemeDiffRow[]; changedLabels: string[] } {
  const rows: ThemeDiffRow[] = THEME_FIELDS.map((f) => {
    const from = f.get(current);
    const to = f.get(next);
    return {
      label: f.label,
      from: f.format(from),
      to: f.format(to),
      swatchFrom: f.swatch?.(current),
      swatchTo: f.swatch?.(next),
      changed: !themeValuesEqual(from, to),
    };
  });
  return { rows, changedLabels: rows.filter((r) => r.changed).map((r) => r.label) };
}
