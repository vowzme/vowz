import type { WeddingTheme } from "./wedding-themes";

// Fields the theme picker actually applies to the site when the user switches
// themes. Anything not in this list (event details, RSVP settings, gallery
// media, story text, etc.) is guaranteed to stay untouched.
export const THEME_TOKEN_FIELDS = [
  "primary",
  "accent",
  "ink",
  "displayFont",
  "bodyFont",
  "motif",
] as const;
export type ThemeTokenField = (typeof THEME_TOKEN_FIELDS)[number];

export interface ThemeDiffRow {
  field: ThemeTokenField;
  label: string;
  from: string;
  to: string;
  isColor: boolean;
  changed: boolean;
}

const readField = (t: WeddingTheme, f: ThemeTokenField): string => {
  switch (f) {
    case "primary": return t.colors.bg;
    case "accent": return t.colors.accent;
    case "ink": return t.colors.ink;
    case "displayFont": return t.fonts.display;
    case "bodyFont": return t.fonts.body;
    case "motif": return t.motif;
  }
};

const LABELS: Record<ThemeTokenField, string> = {
  primary: "Primary color",
  accent: "Accent",
  ink: "Ink / text",
  displayFont: "Display font",
  bodyFont: "Body font",
  motif: "Motif",
};

const COLOR_FIELDS: ReadonlySet<ThemeTokenField> = new Set(["primary", "accent", "ink"]);

export function computeThemeDiff(current: WeddingTheme, next: WeddingTheme): ThemeDiffRow[] {
  return THEME_TOKEN_FIELDS.map((f) => {
    const from = readField(current, f);
    const to = readField(next, f);
    return {
      field: f,
      label: LABELS[f],
      from,
      to,
      isColor: COLOR_FIELDS.has(f),
      changed: from !== to,
    };
  });
}