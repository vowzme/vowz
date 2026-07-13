import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
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

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: null, loading: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/hooks/use-wedding-site", () => ({
  useWeddingSite: () => ({
    loadUserSite: async () => null,
    updateSite: async () => {},
    createSite: async () => ({ id: "test" }),
  }),
  sanitizeColors: (c: unknown) => c,
  DEFAULT_COLORS: {},
}));

describe("/themes count", () => {
  it("hero pill and meta description report WEDDING_THEMES.length", async () => {
    const helmetContext: { helmet?: HelmetServerState } = {};
    render(
      <HelmetProvider context={helmetContext}>
        <MemoryRouter initialEntries={["/themes"]}>
          <Themes />
        </MemoryRouter>
      </HelmetProvider>,
    );

    const n = WEDDING_THEMES.length;

    // Hero pill (visible copy). Text is split across child nodes so we
    // scan the rendered document text.
    await screen.findByPlaceholderText(/Search themes/i);
    expect(document.body.textContent).toContain(`${n} curated collections`);

    // Helmet updates asynchronously — wait a tick.
    await new Promise((r) => setTimeout(r, 0));
    const title = helmetContext.helmet?.title.toString() ?? "";
    const meta = helmetContext.helmet?.meta.toString() ?? "";
    expect(title).toContain(`${n} Wedding Website Themes`);
    expect(meta).toContain(`Explore ${n} curated wedding website themes`);
  });
});
