import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

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

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <CardTemplatesPreview />
    </MemoryRouter>,
  );
}

const totalCount = FALLBACK_TEMPLATES.filter((t) => CARD_THEMES[t.slug]).length;

function expectedTotalPages(pageSize: number) {
  return Math.max(1, Math.ceil(totalCount / pageSize));
}

function getPaginationSummary() {
  return screen.getByText(/Showing/i).closest("p")!;
}

describe("CardTemplatesPreview pagination + sorting", () => {
  beforeEach(() => localStorage.clear());

  it("renders correct totals for default pageSize=12", async () => {
    renderAt("/card-templates-preview");
    const summary = getPaginationSummary();
    expect(within(summary).getByText(String(totalCount))).toBeInTheDocument();
    expect(
      await screen.findByText(new RegExp(`Page 1 of ${expectedTotalPages(12)}`)),
    ).toBeInTheDocument();
  });

  it("updates total pages when pageSize changes via URL", async () => {
    renderAt("/card-templates-preview?pageSize=48");
    expect(
      await screen.findByText(new RegExp(`Page 1 of ${expectedTotalPages(48)}`)),
    ).toBeInTheDocument();
  });

  it("advances to page 2 when Next is clicked", async () => {
    renderAt("/card-templates-preview?pageSize=12");
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(
      await screen.findByText(new RegExp(`Page 2 of ${expectedTotalPages(12)}`)),
    ).toBeInTheDocument();
    const summary = getPaginationSummary();
    // First index on page 2 with pageSize 12 = 13
    expect(within(summary).getByText("13")).toBeInTheDocument();
  });

  it("keeps total page count consistent across sorts but updates ordering on page 1", async () => {
    const { unmount } = renderAt("/card-templates-preview?pageSize=12&sort=recommended");
    expect(
      await screen.findByText(new RegExp(`Page 1 of ${expectedTotalPages(12)}`)),
    ).toBeInTheDocument();
    unmount();

    renderAt("/card-templates-preview?pageSize=12&sort=name");
    // Same total pages — sorting must not change total count.
    expect(
      await screen.findByText(new RegExp(`Page 1 of ${expectedTotalPages(12)}`)),
    ).toBeInTheDocument();

    // Sort=name → first visible card name is alphabetically first.
    const sortedByName = [...FALLBACK_TEMPLATES.filter((t) => CARD_THEMES[t.slug])].sort(
      (a, b) => a.name.localeCompare(b.name),
    );
    const firstName = sortedByName[0].name;
    expect(screen.getAllByText(firstName).length).toBeGreaterThan(0);
  });
});