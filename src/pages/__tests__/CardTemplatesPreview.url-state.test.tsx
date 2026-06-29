import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, useLocation, useSearchParams } from "react-router-dom";
import { useEffect } from "react";

vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock("@/hooks/use-premium-status", () => ({ usePremiumStatus: () => ({ isPremium: false, loading: false }) }));
vi.mock("@/hooks/use-template-favorites", () => ({
  useTemplateFavorites: () => ({ favorites: [], toggle: vi.fn() }),
}));
vi.mock("@/lib/template-analytics", () => ({
  trackTemplateEvent: vi.fn(),
  fetchTemplatePopularity: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/template-pdf-export", () => ({ exportTemplateToPdf: vi.fn() }));
vi.mock("html2canvas", () => ({ default: vi.fn() }));
vi.mock("qrcode.react", () => ({ QRCodeSVG: () => null }));

import CardTemplatesPreview from "@/pages/CardTemplatesPreview";
import { FALLBACK_TEMPLATES, CARD_THEMES } from "@/lib/card-templates";

const totalCount = FALLBACK_TEMPLATES.filter((t) => CARD_THEMES[t.slug]).length;
const expectedTotalPages = (size: number) => Math.max(1, Math.ceil(totalCount / size));

function UrlProbe({ onChange }: { onChange: (url: string) => void }) {
  const loc = useLocation();
  const [params] = useSearchParams();
  useEffect(() => {
    onChange(`${loc.pathname}?${params.toString()}`);
  }, [loc.pathname, params, onChange]);
  return null;
}

function renderAt(url: string, onUrl: (u: string) => void = () => {}) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <CardTemplatesPreview />
      <UrlProbe onChange={onUrl} />
    </MemoryRouter>,
  );
}

describe("CardTemplatesPreview URL state sync", () => {
  beforeEach(() => localStorage.clear());

  it("restores sort, pageSize, and page from the URL on mount", async () => {
    renderAt("/card-templates-preview?sort=name&pageSize=24&page=2");
    expect(
      await screen.findByText(new RegExp(`Page 2 of ${expectedTotalPages(24)}`)),
    ).toBeInTheDocument();
    // First index on page 2 with pageSize 24 = 25
    const summary = screen.getByText(/Showing/i).closest("p")!;
    expect(within(summary).getByText("25")).toBeInTheDocument();
  });

  it("syncs pagination clicks to the URL and restores them on reload", async () => {
    let url = "";
    const { unmount } = renderAt("/card-templates-preview?pageSize=12", (u) => { url = u; });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(
      await screen.findByText(new RegExp(`Page 2 of ${expectedTotalPages(12)}`)),
    ).toBeInTheDocument();
    expect(url).toMatch(/page=2/);
    expect(url).toMatch(/pageSize=12/);

    // Simulate a full reload by remounting with the captured URL.
    unmount();
    renderAt(url);
    expect(
      await screen.findByText(new RegExp(`Page 2 of ${expectedTotalPages(12)}`)),
    ).toBeInTheDocument();
  });

  it("syncs theme filter clicks to the URL and resets page to 1", async () => {
    let url = "";
    renderAt("/card-templates-preview?pageSize=12&page=3", (u) => { url = u; });
    fireEvent.click(screen.getByRole("button", { name: /modern.*minimal/i }));
    // theme is persisted in URL; page must reset to 1 on filter change
    await screen.findByText(/Page 1 of/);
    expect(url).toMatch(/theme=modern_minimal/);
    expect(url).not.toMatch(/page=3/);
  });
});