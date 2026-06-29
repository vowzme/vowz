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

  it("provides a screen-reader announcement on focus via aria-describedby", () => {
    renderPage();
    const badge = screen.getByRole("button", { name: /premium of/i });
    fireEvent.focus(badge);
    // Radix wires aria-describedby on the trigger so SR users hear the tooltip body.
    expect(badge).toHaveAttribute("aria-describedby");
  });

  it("has no axe violations on the badge + tooltip subtree", async () => {
    renderPage();
    const badge = screen.getByRole("button", { name: /premium of/i });
    // Scope axe to the badge's immediate wrapper to avoid noise from unrelated UI.
    const region = badge.closest("div") ?? badge;
    const results = await axe(region, {
      rules: {
        region: { enabled: false },
        "landmark-one-main": { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });
});