import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING;

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <CardTemplatesPreview />
    </MemoryRouter>,
  );
}

describe("CardTemplatesPreview — keyboard a11y of sort & pagination", () => {
  beforeEach(() => localStorage.clear());

  it("Sort and Per-page triggers are focusable comboboxes in DOM order", async () => {
    renderAt("/card-templates-preview?pageSize=12&page=1");
    await screen.findByText(/Page 1 of/);

    // Radix SelectTrigger exposes role=combobox.
    const combos = screen.getAllByRole("combobox");
    expect(combos.length).toBeGreaterThanOrEqual(2);
    const [sortTrigger, perPageTrigger] = combos;

    // Both reachable via keyboard (not tabindex=-1, not disabled).
    for (const el of [sortTrigger, perPageTrigger]) {
      expect(el).not.toBeDisabled();
      expect(el.getAttribute("tabindex")).not.toBe("-1");
    }

    // DOM/tab order: Sort precedes Per-page.
    expect(sortTrigger.compareDocumentPosition(perPageTrigger) & FOLLOWING).toBeTruthy();

    // Pagination buttons follow the sort controls in tab order.
    const next = screen.getByRole("button", { name: /^next$/i });
    expect(perPageTrigger.compareDocumentPosition(next) & FOLLOWING).toBeTruthy();

    // The page-status text is an aria-live region so SR users hear updates.
    const status = screen.getByText(/Page \d+ of \d+/);
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("On page 1, Previous is disabled (skipped by Tab); on page 2 it becomes focusable", async () => {
    const { unmount } = renderAt("/card-templates-preview?pageSize=12&page=1");
    await screen.findByText(/Page 1 of/);
    expect(screen.getByRole("button", { name: /^previous$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^next$/i })).not.toBeDisabled();
    unmount();

    renderAt("/card-templates-preview?pageSize=12&page=2");
    await screen.findByText(/Page 2 of/);
    const prev = screen.getByRole("button", { name: /^previous$/i });
    expect(prev).not.toBeDisabled();
    prev.focus();
    expect(document.activeElement).toBe(prev);
  });
});
