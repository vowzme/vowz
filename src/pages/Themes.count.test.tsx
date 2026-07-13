import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Themes from "./Themes";
import { WEDDING_THEMES } from "@/lib/wedding-themes";

// Auth is not needed to render the marketing surface, but the page
// imports the Supabase client — stub the two entrypoints it touches.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
    }),
  },
}));

describe("/themes count", () => {
  it("hero pill and meta description report WEDDING_THEMES.length", async () => {
    const helmetContext: { helmet?: { title: { toString: () => string }; meta: { toString: () => string } } } = {};
    render(
      <HelmetProvider context={helmetContext}>
        <MemoryRouter initialEntries={["/themes"]}>
          <Themes />
        </MemoryRouter>
      </HelmetProvider>,
    );

    const n = WEDDING_THEMES.length;

    // Hero pill (visible copy).
    expect(
      await screen.findByText(
        (_, node) =>
          node?.textContent?.includes(`${n} curated collections`) ?? false,
      ),
    ).toBeInTheDocument();

    // Helmet updates asynchronously — wait a tick.
    await new Promise((r) => setTimeout(r, 0));
    const title = helmetContext.helmet?.title.toString() ?? "";
    const meta = helmetContext.helmet?.meta.toString() ?? "";
    expect(title).toContain(`${n} Wedding Website Themes`);
    expect(meta).toContain(`Explore ${n} curated wedding website themes`);
  });
});
