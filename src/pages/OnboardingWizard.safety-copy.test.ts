import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Regression tests: the reset/switch confirmation dialog and the
// merge-apply toast MUST keep reassuring users that event details,
// RSVP settings, and gallery media stay unchanged. If someone rewrites
// this copy, these tests fail and force a conscious decision.
const src = readFileSync(
  resolve(__dirname, "OnboardingWizard.tsx"),
  "utf8",
);

const REQUIRED = [/event details/i, /RSVP/i, /gallery/i];

describe("theme-switch safety copy", () => {
  it("confirmation dialog description mentions events, RSVP, and gallery", () => {
    const m = src.match(/<AlertDialogDescription>[\s\S]*?<\/AlertDialogDescription>/);
    expect(m, "AlertDialogDescription not found").toBeTruthy();
    for (const re of REQUIRED) expect(m![0]).toMatch(re);
  });

  it("merge-apply toast mentions events, RSVP, and gallery", () => {
    // Find the toast({...}) call inside applyTheme.
    const m = src.match(/applyTheme[\s\S]*?toast\(\{[\s\S]*?\}\)/);
    expect(m, "applyTheme toast not found").toBeTruthy();
    for (const re of REQUIRED) expect(m![0]).toMatch(re);
  });
});
