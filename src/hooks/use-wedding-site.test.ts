import { describe, it, expect } from "vitest";
import {
  DEFAULT_THEME,
  DEFAULT_COLORS,
  DEFAULT_DISPLAY_FONT,
  DEFAULT_BODY_FONT,
  sanitizeColors,
  resolveTheme,
} from "./use-wedding-site";

describe("theme + palette fallbacks", () => {
  it("exposes stable defaults", () => {
    expect(DEFAULT_THEME).toBe("modern-minimal");
    expect(DEFAULT_COLORS).toHaveLength(3);
    expect(DEFAULT_DISPLAY_FONT).toBeTruthy();
    expect(DEFAULT_BODY_FONT).toBeTruthy();
  });

  describe("resolveTheme", () => {
    it("returns DEFAULT_THEME for missing / empty / whitespace", () => {
      expect(resolveTheme(undefined)).toBe(DEFAULT_THEME);
      expect(resolveTheme(null)).toBe(DEFAULT_THEME);
      expect(resolveTheme("")).toBe(DEFAULT_THEME);
      expect(resolveTheme("   ")).toBe(DEFAULT_THEME);
    });
    it("keeps a provided theme id and trims it", () => {
      expect(resolveTheme("royal-rajput")).toBe("royal-rajput");
      expect(resolveTheme("  goa-beach  ")).toBe("goa-beach");
    });
  });

  describe("sanitizeColors", () => {
    it("returns DEFAULT_COLORS when input is missing or empty", () => {
      expect(sanitizeColors(undefined)).toEqual(DEFAULT_COLORS);
      expect(sanitizeColors(null)).toEqual(DEFAULT_COLORS);
      expect(sanitizeColors([])).toEqual(DEFAULT_COLORS);
    });
    it("fills to at least 3 entries when partial", () => {
      const out = sanitizeColors(["#111111"]);
      expect(out).toHaveLength(3);
      expect(out[0]).toBe("#111111");
      expect(out[1]).toBe(DEFAULT_COLORS[1]);
      expect(out[2]).toBe(DEFAULT_COLORS[2]);
    });
    it("drops invalid entries and refills to 3", () => {
      const out = sanitizeColors(["not-a-color", "#abc", null as any, undefined as any]);
      expect(out).toHaveLength(3);
      expect(out[0]).toBe("#abc");
      expect(out[1]).toBe(DEFAULT_COLORS[1]);
      expect(out[2]).toBe(DEFAULT_COLORS[2]);
    });
    it("preserves 3-5 valid colors and caps at 5", () => {
      const three = ["#111", "#222", "#333"];
      expect(sanitizeColors(three)).toEqual(three);
      const six = ["#111", "#222", "#333", "#444", "#555", "#666"];
      expect(sanitizeColors(six)).toHaveLength(5);
      expect(sanitizeColors(six)[4]).toBe("#555");
    });
  });
});