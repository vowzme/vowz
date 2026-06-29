import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, useSearchParams } from "react-router-dom";

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

// Test harness: exposes a button that mutates the `sort` search param
// so we can drive the change without going through the Radix Select
// (which is unreliable in jsdom).
function SortChanger({ value }: { value: string }) {
  const [params, setParams] = useSearchParams();
  return (
    <button
      type="button"
      data-testid="set-sort"
      onClick={() => {
        const next = new URLSearchParams(params);
        next.set("sort", value);
        setParams(next, { replace: true });
      }}
    >
      set sort
    </button>
  );
}

describe("CardTemplatesPreview — sort change resets page to 1", () => {
  beforeEach(() => localStorage.clear());

  it("resets page from 2 to 1 when the sort option changes", async () => {
    render(
      <MemoryRouter initialEntries={["/card-templates-preview?pageSize=12&page=2&sort=recommended"]}>
        <CardTemplatesPreview />
        <SortChanger value="name" />
      </MemoryRouter>,
    );

    // Start on page 2 (URL restored).
    expect(await screen.findByText(/Page 2 of/)).toBeInTheDocument();

    // Change sort → should reset to page 1.
    fireEvent.click(screen.getByTestId("set-sort"));

    expect(await screen.findByText(/Page 1 of/)).toBeInTheDocument();
  });
});