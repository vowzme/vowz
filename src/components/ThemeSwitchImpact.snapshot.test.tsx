import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { WEDDING_THEMES } from "@/lib/wedding-themes";
import { WhatWillChangeSummary, TokenDiffTable } from "./ThemeSwitchImpact";

// True UI snapshot tests — render the actual DOM produced by the impact
// panel and token-diff table for every ordered pair of wedding themes.
describe("ThemeSwitchImpact rendered snapshots", () => {
  for (const from of WEDDING_THEMES) {
    for (const to of WEDDING_THEMES) {
      const label = `${from.id} → ${to.id}`;

      it(`WhatWillChangeSummary DOM: ${label}`, () => {
        const { container } = render(<WhatWillChangeSummary current={from} next={to} />);
        expect(container.firstChild).toMatchSnapshot();
      });

      it(`TokenDiffTable DOM: ${label}`, () => {
        const { container } = render(<TokenDiffTable current={from} next={to} />);
        expect(container.firstChild).toMatchSnapshot();
      });
    }
  }
});
