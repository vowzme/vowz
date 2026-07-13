import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWeddingWizard } from "./use-wedding-wizard";

const KEY = "vowz_wizard_draft";

describe("useWeddingWizard resetDraft", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("clears both storages and reloads the wizard in a fresh state", () => {
    // Seed both storages with an in-progress draft on the 'story' step.
    const seeded = {
      step: "story",
      data: {
        partner1: "Asha",
        partner2: "Rohan",
        howWeMet: "We met at a wedding in Jaipur many years ago.",
        theme: "royal-rajput",
        suggestedColors: ["#111111", "#222222", "#333333"],
      },
      savedAt: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(seeded));
    sessionStorage.setItem(KEY, JSON.stringify(seeded));

    // First mount: hook should hydrate from the seeded draft.
    const first = renderHook(() => useWeddingWizard());
    expect(first.result.current.step).toBe("story");
    expect(first.result.current.wizardData.partner1).toBe("Asha");
    expect(first.result.current.wizardData.partner2).toBe("Rohan");

    // Reset the draft — this must wipe both storages.
    act(() => {
      first.result.current.resetDraft();
    });
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(sessionStorage.getItem(KEY)).toBeNull();

    first.unmount();

    // Simulate a full page reload by mounting a brand new hook instance.
    // With storage cleared it must come up on the first step with defaults.
    const fresh = renderHook(() => useWeddingWizard());
    expect(fresh.result.current.step).toBe("names");
    expect(fresh.result.current.wizardData.partner1).toBe("");
    expect(fresh.result.current.wizardData.partner2).toBe("");
    expect(fresh.result.current.wizardData.howWeMet).toBe("");
    expect(fresh.result.current.wizardData.functions).toEqual([]);
  });
});