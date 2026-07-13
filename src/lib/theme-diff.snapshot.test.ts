import { describe, it, expect } from "vitest";
import { WEDDING_THEMES } from "./wedding-themes";
import { diffThemes, computeThemeDiff } from "./theme-diff";

// UI snapshot tests: for every ordered pair of wedding themes, freeze
// (a) the "What will change" summary (list of changed field labels) and
// (b) the full token-diff table rendered in the theme-switch dialog.
// Any drift in the diff surface — added fields, renamed labels, changed
// token readers — will show up as a snapshot diff.
describe("theme-diff snapshots", () => {
  for (const from of WEDDING_THEMES) {
    for (const to of WEDDING_THEMES) {
      const label = `${from.id} → ${to.id}`;

      it(`what-will-change summary: ${label}`, () => {
        const { changedLabels } = diffThemes(from, to);
        expect(changedLabels).toMatchSnapshot();
      });

      it(`token-diff table: ${label}`, () => {
        const rows = computeThemeDiff(from, to).map((r) => ({
          field: r.field,
          from: r.from,
          to: r.to,
          changed: r.changed,
          isColor: r.isColor,
        }));
        expect(rows).toMatchSnapshot();
      });
    }
  }
});
