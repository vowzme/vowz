import { WEDDING_THEMES } from "@/lib/wedding-themes";

type Theme = typeof WEDDING_THEMES[number];

// -----------------------------------------------------------------------------
// applyTheme fields — source of truth for what OnboardingWizard actually writes
// to wizardData during a theme switch/merge.
// -----------------------------------------------------------------------------
export type ThemeField = {
  key: "theme" | "suggestedColors" | "displayFont" | "bodyFont";
  label: string;
  get: (t: Theme) => unknown;
  format: (v: unknown) => string;
  swatch?: (t: Theme) => string;
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
  current: Theme,
  next: Theme,
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

// -----------------------------------------------------------------------------
// Token diff — the fine-grained visual-token table shown in the theme-switch
// dialog. This is a superset of THEME_FIELDS (it also surfaces `ink` and
// `motif`, which are inherited from the applied theme even though we don't
// mirror them into wizardData columns).
// -----------------------------------------------------------------------------
export const THEME_TOKEN_FIELDS = [
  "primary",
  "accent",
  "ink",
  "displayFont",
  "bodyFont",
  "motif",
] as const;
export type ThemeTokenField = typeof THEME_TOKEN_FIELDS[number];

// Human-readable labels for token fields — used by the "What will change"
// summary so both the summary and computeThemeDiff share one label source.
export const THEME_TOKEN_LABELS: Record<ThemeTokenField, string> = {
  primary: "Primary color",
  accent: "Accent color",
  ink: "Ink / text color",
  displayFont: "Display font",
  bodyFont: "Body font",
  motif: "Decorative motif",
};

const TOKEN_READERS: Record<ThemeTokenField, (t: Theme) => string> = {
  primary: (t) => t.colors.bg,
  accent: (t) => t.colors.accent,
  ink: (t) => t.colors.ink,
  displayFont: (t) => t.fonts.display,
  bodyFont: (t) => t.fonts.body,
  motif: (t) => t.motif,
};
const COLOR_FIELDS = new Set<ThemeTokenField>(["primary", "accent", "ink"]);

export type TokenDiffRow = {
  field: ThemeTokenField;
  from: string;
  to: string;
  changed: boolean;
  isColor: boolean;
};

export function computeThemeDiff(a: Theme, b: Theme): TokenDiffRow[] {
  return THEME_TOKEN_FIELDS.map((field) => {
    const from = TOKEN_READERS[field](a);
    const to = TOKEN_READERS[field](b);
    return { field, from, to, changed: from !== to, isColor: COLOR_FIELDS.has(field) };
  });
}
