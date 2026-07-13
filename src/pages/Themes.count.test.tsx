import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { waitFor } from "@testing-library/react";
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
    render(
      <HelmetProvider>
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

    // Helmet writes to document.head asynchronously.
    await waitFor(() =>
      expect(document.title).toContain(`${n} Wedding Website Themes`),
    );
    const desc = document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content") ?? "";
    expect(desc).toContain(`Explore ${n} curated wedding website themes`);

    // Extra safety: the number in the description must equal the array
    // length — guarantees the copy is derived, not a stale literal that
    // happens to match today.
    const match = desc.match(/Explore (\d+) curated wedding website themes/);
    expect(match, `description missing count: ${desc}`).not.toBeNull();
    expect(Number(match![1])).toBe(WEDDING_THEMES.length);
  });
});
