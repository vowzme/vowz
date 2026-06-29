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

function visibleCardNames(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>("p.font-medium.text-sm.truncate"),
  ).map((el) => el.textContent?.trim() ?? "");
}

describe("CardTemplatesPreview — URL restore after hard refresh", () => {
  beforeEach(() => localStorage.clear());

  it("restores page, pageSize, and sort ordering on remount (simulated reload)", async () => {
    const url = "/card-templates-preview?pageSize=12&page=2&sort=name";

    // First mount.
    const first = render(
      <MemoryRouter initialEntries={[url]}>
        <CardTemplatesPreview />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Page 2 of/)).toBeInTheDocument();

    const namesA = visibleCardNames(first.container);
    expect(namesA.length).toBe(12);
    // sort=name → alphabetical (case-insensitive) across the visible page.
    const sortedA = [...namesA].sort((x, y) => x.localeCompare(y));
    expect(namesA).toEqual(sortedA);

    first.unmount();

    // Hard refresh: brand-new MemoryRouter mounted at the same URL.
    const second = render(
      <MemoryRouter initialEntries={[url]}>
        <CardTemplatesPreview />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Page 2 of/)).toBeInTheDocument();

    const namesB = visibleCardNames(second.container);
    expect(namesB).toEqual(namesA); // same ordering + same slice = same items
  });

  it("different page in URL yields a different slice but same ordering rule", async () => {
    const p1 = render(
      <MemoryRouter initialEntries={["/card-templates-preview?pageSize=12&page=1&sort=name"]}>
        <CardTemplatesPreview />
      </MemoryRouter>,
    );
    await screen.findByText(/Page 1 of/);
    const page1 = visibleCardNames(p1.container);
    p1.unmount();

    const p2 = render(
      <MemoryRouter initialEntries={["/card-templates-preview?pageSize=12&page=2&sort=name"]}>
        <CardTemplatesPreview />
      </MemoryRouter>,
    );
    await screen.findByText(/Page 2 of/);
    const page2 = visibleCardNames(p2.container);

    expect(page1[0]).not.toEqual(page2[0]);
    // Both pages individually alphabetized; page 1's last <= page 2's first.
    expect(page1[page1.length - 1].localeCompare(page2[0])).toBeLessThanOrEqual(0);
  });
});
