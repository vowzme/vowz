import { z } from "zod";
import {
  DEFAULT_THEME, DEFAULT_COLORS, DEFAULT_DISPLAY_FONT, DEFAULT_BODY_FONT,
  sanitizeColors, resolveTheme,
} from "@/hooks/use-wedding-site";

// Runtime schema for theme/palette-shaped input. Malformed values are coerced
// to safe defaults rather than throwing, so bad DB rows can't crash the UI.

const hexColor = z.string().trim().regex(/^#?[0-9a-fA-F]{3,8}$/);
const fontName = z.string().trim().min(1).max(80);

export const themeStyleSchema = z.object({
  theme: z.unknown().transform((v) => resolveTheme(typeof v === "string" ? v : "")),
  suggestedColors: z.unknown().transform((v) => sanitizeColors(Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === "string") : [])),
  displayFont: z.unknown().transform((v) => {
    const parsed = fontName.safeParse(v);
    return parsed.success ? parsed.data : DEFAULT_DISPLAY_FONT;
  }),
  bodyFont: z.unknown().transform((v) => {
    const parsed = fontName.safeParse(v);
    return parsed.success ? parsed.data : DEFAULT_BODY_FONT;
  }),
});
export type ThemeStyle = z.infer<typeof themeStyleSchema>;

// Never throws — returns safe defaults for any malformed input.
export function parseThemeStyle(input: unknown): ThemeStyle {
  const src = (input && typeof input === "object") ? input as Record<string, unknown> : {};
  const result = themeStyleSchema.safeParse({
    theme: src.theme ?? src.preferred_theme,
    suggestedColors: src.suggestedColors ?? src.suggested_colors ?? src.preferred_colors,
    displayFont: src.displayFont ?? src.display_font ?? src.preferred_display_font,
    bodyFont: src.bodyFont ?? src.body_font ?? src.preferred_body_font,
  });
  return result.success ? result.data : {
    theme: DEFAULT_THEME,
    suggestedColors: [...DEFAULT_COLORS],
    displayFont: DEFAULT_DISPLAY_FONT,
    bodyFont: DEFAULT_BODY_FONT,
  };
}

// Validate a single hex color; falls back to `fallback` (default black) on bad input.
export function safeHex(c: unknown, fallback = "#000000"): string {
  const parsed = hexColor.safeParse(c);
  return parsed.success ? parsed.data : fallback;
}