import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWeddingWizard } from "./use-wedding-wizard";

/**
 * Resume flow: the wizard autosaves `step` + full `wizardData` (which
 * includes `theme`, `suggestedColors`, `displayFont`, `bodyFont`) to
 * localStorage on every change. When the user reopens the wizard we must
 * restore the exact step they left off on AND the theme/palette they had
 * selected — not the defaults, not step 1.
 */
describe("useWeddingWizard resume", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("persists step + selected template through unmount/remount", () => {
    // First session: user picks a template, advances to the events step.
    const first = renderHook(() => useWeddingWizard());
    act(() => {
      first.result.current.updateField("partner1", "Asha");
      first.result.current.updateField("partner2", "Rohan");
      first.result.current.updateField("theme", "royal-rajput");
      first.result.current.updateField("suggestedColors", ["#6B1D2A", "#D4A853", "#FFF5E6"]);
      first.result.current.updateField("displayFont", "Playfair Display");
      first.result.current.updateField("bodyFont", "Inter");
      first.result.current.setStep("events");
    });

    // The autosave effect runs on every change — the draft must be on disk.
    const raw = localStorage.getItem("vowz_wizard_draft");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.step).toBe("events");
    expect(parsed.data.theme).toBe("royal-rajput");
    expect(parsed.data.suggestedColors).toEqual(["#6B1D2A", "#D4A853", "#FFF5E6"]);
    expect(parsed.data.displayFont).toBe("Playfair Display");

    first.unmount();

    // Second session: fresh mount rehydrates the exact page + theme.
    const resumed = renderHook(() => useWeddingWizard());
    expect(resumed.result.current.step).toBe("events");
    expect(resumed.result.current.wizardData.partner1).toBe("Asha");
    expect(resumed.result.current.wizardData.partner2).toBe("Rohan");
    expect(resumed.result.current.wizardData.theme).toBe("royal-rajput");
    expect(resumed.result.current.wizardData.suggestedColors).toEqual([
      "#6B1D2A", "#D4A853", "#FFF5E6",
    ]);
    expect(resumed.result.current.wizardData.displayFont).toBe("Playfair Display");
    expect(resumed.result.current.wizardData.bodyFont).toBe("Inter");
  });

  it("falls back to sessionStorage when localStorage is empty", () => {
    sessionStorage.setItem(
      "vowz_wizard_draft",
      JSON.stringify({
        step: "theme",
        data: { theme: "modern-minimal", suggestedColors: ["#000", "#fff", "#888"] },
      }),
    );
    const { result } = renderHook(() => useWeddingWizard());
    expect(result.current.step).toBe("theme");
    expect(result.current.wizardData.theme).toBe("modern-minimal");
  });
});