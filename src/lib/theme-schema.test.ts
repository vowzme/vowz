import { describe, it, expect } from "vitest";
import { parseThemeStyle, safeHex } from "./theme-schema";
import {
  DEFAULT_THEME, DEFAULT_COLORS, DEFAULT_DISPLAY_FONT, DEFAULT_BODY_FONT,
} from "@/hooks/use-wedding-site";

describe("parseThemeStyle", () => {
  it("returns full defaults for null / undefined / non-object", () => {
    for (const v of [null, undefined, 42, "oops", true]) {
      const out = parseThemeStyle(v as unknown);
      expect(out.theme).toBe(DEFAULT_THEME);
      expect(out.suggestedColors).toEqual(DEFAULT_COLORS);
      expect(out.displayFont).toBe(DEFAULT_DISPLAY_FONT);
      expect(out.bodyFont).toBe(DEFAULT_BODY_FONT);
    }
  });

  it("accepts DB (snake_case) profile rows", () => {
    const out = parseThemeStyle({
      preferred_theme: "royal-rajput",
      preferred_colors: ["#111", "#222", "#333"],
      preferred_display_font: "Cinzel",
      preferred_body_font: "Lora",
    });
    expect(out.theme).toBe("royal-rajput");
    expect(out.suggestedColors).toEqual(["#111", "#222", "#333"]);
    expect(out.displayFont).toBe("Cinzel");
    expect(out.bodyFont).toBe("Lora");
  });

  it("coerces malformed fields without throwing", () => {
    const out = parseThemeStyle({
      theme: 123,
      suggested_colors: "not-an-array",
      display_font: { evil: true },
      body_font: null,
    });
    expect(out.theme).toBe(DEFAULT_THEME);
    expect(out.suggestedColors).toEqual(DEFAULT_COLORS);
    expect(out.displayFont).toBe(DEFAULT_DISPLAY_FONT);
    expect(out.bodyFont).toBe(DEFAULT_BODY_FONT);
  });

  it("drops invalid entries inside the color array", () => {
    const out = parseThemeStyle({
      suggestedColors: ["#abc", 999, null, "not-a-color"],
    });
    expect(out.suggestedColors[0]).toBe("#abc");
    expect(out.suggestedColors).toHaveLength(3);
  });
});

describe("safeHex", () => {
  it("passes valid hex through", () => {
    expect(safeHex("#abc")).toBe("#abc");
    expect(safeHex("#112233")).toBe("#112233");
  });
  it("falls back for garbage", () => {
    expect(safeHex(null)).toBe("#000000");
    expect(safeHex("javascript:alert(1)", "#fff")).toBe("#fff");
    expect(safeHex(42)).toBe("#000000");
  });
});