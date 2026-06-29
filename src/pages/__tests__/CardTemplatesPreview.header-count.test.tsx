import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// --- Mocks for heavy / network deps -----------------------------------------
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
import { FALLBACK_TEMPLATES, CARD_THEMES, OCCASIONS, occasionOf } from "@/lib/card-templates";

function renderPage(initial = "/card-templates-preview") {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <CardTemplatesPreview />
    </MemoryRouter>,
  );
}

function expectedCounts(opts: { category?: string; occasion?: string }) {
  const list = FALLBACK_TEMPLATES.filter((t) => CARD_THEMES[t.slug])
    .filter((t) => !opts.category || opts.category === "all" || t.category === opts.category)
    .filter((t) => {
      if (!opts.occasion || opts.occasion === "all") return true;
      const occ = t.occasion ?? occasionOf(t.slug) ?? "wedding";
      return occ === opts.occasion;
    });
  return { premium: list.filter((t) => t.is_premium).length, total: list.length };
}

const badgeText = () => {
  const badge = screen.getByText(/premium/i, { selector: "div" }).closest("div")!;
  return within(badge).getByText(/premium/i).parentElement!.textContent || "";
};

describe("CardTemplatesPreview header count badge", () => {
  beforeEach(() => localStorage.clear());

  it("renders the all/all count by default", async () => {
    renderPage();
    const { premium, total } = expectedCounts({ category: "all", occasion: "all" });
    expect(await screen.findByText(new RegExp(`${premium} premium\\s*/\\s*${total} total`))).toBeInTheDocument();
  });

  it("updates when the occasion filter changes", async () => {
    renderPage();
    const occ = OCCASIONS[1] || OCCASIONS[0]; // any non-wedding occasion
    const occLabelButton = screen.getAllByRole("button").find((b) =>
      b.textContent?.trim().toLowerCase().includes(occ.replace(/_/g, " ")),
    );
    expect(occLabelButton).toBeTruthy();
    fireEvent.click(occLabelButton!);

    const { premium, total } = expectedCounts({ category: "all", occasion: occ });
    expect(await screen.findByText(new RegExp(`${premium} premium\\s*/\\s*${total} total`))).toBeInTheDocument();
  });

  it("updates when the theme filter changes", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /modern.*minimal/i }));
    const { premium, total } = expectedCounts({ category: "modern_minimal", occasion: "all" });
    expect(await screen.findByText(new RegExp(`${premium} premium\\s*/\\s*${total} total`))).toBeInTheDocument();
  });
});