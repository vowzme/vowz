import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/card-templates-preview"]}>
      <CardTemplatesPreview />
    </MemoryRouter>,
  );
}

describe("CardTemplatesPreview accessibility — header count badge & tooltip", () => {
  beforeEach(() => localStorage.clear());

  it("exposes the header count badge as a keyboard-reachable, named element", () => {
    renderPage();
    const badge = screen.getByRole("button", { name: /\d+ premium of \d+ total templates/i });
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("tabindex", "0");
    // aria-live ensures count updates are announced to screen readers.
    expect(badge).toHaveAttribute("aria-live", "polite");
  });

  it("announces tooltip content on focus", async () => {
    renderPage();
    const badge = screen.getByRole("button", { name: /premium of/i });
    fireEvent.focus(badge);
    const tip = await waitFor(() =>
      screen.getByText(/counts the templates that match your current/i),
    );
    expect(tip).toBeInTheDocument();
  });

  it("has no axe violations in the header region", async () => {
    const { container } = renderPage();
    // Scan just the header area to keep the run fast and focused.
    const header = container.querySelector("header, section") ?? container;
    const results = await axe(header as Element, {
      rules: {
        // Page-level landmark rules are noisy in component-level tests.
        region: { enabled: false },
        "landmark-one-main": { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });
});