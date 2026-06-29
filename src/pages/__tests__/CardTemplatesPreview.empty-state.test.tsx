import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

// Force zero matching premium templates so the empty-state renders.
vi.mock("@/lib/card-templates", () => ({
  CARD_THEMES: {} as Record<string, unknown>,
  CATEGORY_LABELS: {
    hindu_sikh: "Hindu & Sikh",
    christian_muslim: "Christian & Muslim",
    modern_minimal: "Modern Minimal",
    royal_traditional: "Royal Traditional",
  },
  FALLBACK_TEMPLATES: [],
  InvitationCardArtwork: () => null,
  OCCASIONS: ["wedding"],
  OCCASION_LABELS: { wedding: "Wedding" },
  OCCASION_COPY: { wedding: { invitationLine: "x", message: "y" } },
  occasionOf: () => "wedding",
}));

const upgradeOpenSpy = vi.fn();
vi.mock("@/components/UpgradeTemplateDialog", () => ({
  __esModule: true,
  default: ({ open }: { open: boolean }) => {
    upgradeOpenSpy(open);
    return open ? <div role="dialog" aria-label="upgrade">Upgrade dialog</div> : null;
  },
  writePendingPremiumTemplate: vi.fn(),
  clearPendingPremiumTemplate: vi.fn(),
  readPendingPremiumTemplate: () => null,
}));

import CardTemplatesPreview from "@/pages/CardTemplatesPreview";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/card-templates-preview"]}>
      <CardTemplatesPreview />
    </MemoryRouter>,
  );
}

describe("CardTemplatesPreview empty state", () => {
  beforeEach(() => {
    localStorage.clear();
    upgradeOpenSpy.mockClear();
  });

  it("renders the premium empty-state card when no templates match", () => {
    renderPage();
    expect(
      screen.getByText(/no premium templates match these filters/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /unlock premium templates/i }),
    ).toBeInTheDocument();
  });

  it("opens the upgrade dialog when the CTA is clicked", () => {
    renderPage();
    expect(screen.queryByRole("dialog", { name: /upgrade/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /unlock premium templates/i }));
    expect(screen.getByRole("dialog", { name: /upgrade/i })).toBeInTheDocument();
  });
});