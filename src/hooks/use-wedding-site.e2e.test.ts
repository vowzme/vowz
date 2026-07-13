import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// --- Mocks for supabase, auth, and toast ---------------------------------

// Capture the payload that createSite sends to supabase.from("wedding_sites").insert(...)
const insertSpy = vi.fn();
const updateSpy = vi.fn();

vi.mock("@/integrations/supabase/client", () => {
  const chain = {
    insert: (payload: any) => {
      insertSpy(payload);
      return {
        select: () => ({
          single: async () => ({ data: { id: "site-1", ...payload }, error: null }),
        }),
      };
    },
    update: (payload: any) => {
      updateSpy(payload);
      return { eq: async () => ({ data: null, error: null }) };
    },
  };
  return {
    supabase: {
      from: () => chain,
    },
  };
});

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

// -------------------------------------------------------------------------

import {
  useWeddingSite,
  DEFAULT_THEME,
  DEFAULT_COLORS,
  DEFAULT_DISPLAY_FONT,
  DEFAULT_BODY_FONT,
} from "./use-wedding-site";

const baseInput = {
  partner1: "Ada",
  partner2: "Bea",
  culturalBackground: "Other",
  howWeMet: "at a hackathon",
  tagline: "",
  sections: [],
};

describe("E2E onboarding – createSite falls back to DEFAULT_THEME / DEFAULT_COLORS", () => {
  beforeEach(() => {
    insertSpy.mockClear();
    updateSpy.mockClear();
  });

  it("uses DEFAULT_THEME and DEFAULT_COLORS when theme data is missing entirely", async () => {
    const { result } = renderHook(() => useWeddingSite());
    await act(async () => {
      await result.current.createSite({
        ...baseInput,
        theme: "",
        suggestedColors: [],
      });
    });
    expect(insertSpy).toHaveBeenCalledTimes(1);
    const payload = insertSpy.mock.calls[0][0];
    expect(payload.theme).toBe(DEFAULT_THEME);
    expect(payload.suggested_colors).toEqual(DEFAULT_COLORS);
    expect(payload.display_font).toBe(DEFAULT_DISPLAY_FONT);
    expect(payload.body_font).toBe(DEFAULT_BODY_FONT);

    // Preferred-theme mirror on profile should get the same safe defaults.
    expect(updateSpy).toHaveBeenCalledTimes(1);
    const profilePatch = updateSpy.mock.calls[0][0];
    expect(profilePatch.preferred_theme).toBe(DEFAULT_THEME);
    expect(profilePatch.preferred_colors).toEqual(DEFAULT_COLORS);
  });

  it("fills missing palette slots from DEFAULT_COLORS when only a partial palette is provided", async () => {
    const { result } = renderHook(() => useWeddingSite());
    await act(async () => {
      await result.current.createSite({
        ...baseInput,
        theme: "  ", // whitespace → falls back to DEFAULT_THEME
        suggestedColors: ["#123456"], // only one entry
      });
    });
    const payload = insertSpy.mock.calls[0][0];
    expect(payload.theme).toBe(DEFAULT_THEME);
    expect(payload.suggested_colors[0]).toBe("#123456");
    expect(payload.suggested_colors).toHaveLength(DEFAULT_COLORS.length);
    // Slots 2+ should come from the default palette.
    expect(payload.suggested_colors.slice(1)).toEqual(DEFAULT_COLORS.slice(1));
  });

  it("preserves a fully-specified theme without applying defaults", async () => {
    const { result } = renderHook(() => useWeddingSite());
    await act(async () => {
      await result.current.createSite({
        ...baseInput,
        theme: "royal-heritage",
        suggestedColors: ["#111111", "#222222", "#333333"],
        displayFont: "Cinzel",
        bodyFont: "Lora",
      });
    });
    const payload = insertSpy.mock.calls[0][0];
    expect(payload.theme).toBe("royal-heritage");
    expect(payload.suggested_colors).toEqual(["#111111", "#222222", "#333333"]);
    expect(payload.display_font).toBe("Cinzel");
    expect(payload.body_font).toBe("Lora");
  });
});