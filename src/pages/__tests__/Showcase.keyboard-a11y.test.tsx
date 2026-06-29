import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Showcase from "../Showcase";

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea';

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Showcase />
    </MemoryRouter>,
  );

const focusables = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el.tagName === "A",
  );

describe("Showcase — keyboard navigation & focus order", () => {
  describe("list page (no pagination)", () => {
    it("renders filter chips and demo cards as keyboard-reachable controls", () => {
      renderAt("/showcase");

      // Filter chips
      const allChips = screen.getAllByRole("button", { name: /^All$/ });
      expect(allChips.length).toBeGreaterThanOrEqual(2); // Category + Style rows
      allChips.forEach((chip) => {
        expect(chip).not.toBeDisabled();
        expect(chip.getAttribute("tabindex")).not.toBe("-1");
        expect(chip).toHaveAttribute("aria-pressed");
      });

      // At least one demo card opens via the "View live demo →" link/button
      const viewLinks = screen.getAllByRole("button", { name: /view live demo/i });
      expect(viewLinks.length).toBeGreaterThan(0);
    });

    it("has no pagination controls (single-page browsing)", () => {
      renderAt("/showcase");
      expect(screen.queryByRole("button", { name: /^next$/i })).toBeNull();
      expect(screen.queryByRole("button", { name: /^previous$/i })).toBeNull();
      expect(screen.queryByText(/page \d+ of \d+/i)).toBeNull();
    });

    it("orders focusable controls: filter chips before demo card actions", () => {
      const { container } = renderAt("/showcase");
      const order = focusables(container);
      const firstChipIdx = order.findIndex(
        (el) => el.getAttribute("aria-pressed") !== null,
      );
      const firstCardLinkIdx = order.findIndex((el) =>
        /view live demo/i.test(el.textContent ?? ""),
      );
      expect(firstChipIdx).toBeGreaterThanOrEqual(0);
      expect(firstCardLinkIdx).toBeGreaterThan(firstChipIdx);
    });
  });

  describe("demo detail page", () => {
    it("places Back, Start-with-this-demo, then RSVP form in tab order", () => {
      const { container } = renderAt("/showcase?id=aarav-priya");

      const back = screen.getByRole("button", { name: /back to showcase/i });
      const starts = screen.getAllByRole("link", { name: /start with this demo/i });
      expect(starts.length).toBeGreaterThanOrEqual(1);
      starts.forEach((s) => expect(s).toHaveAttribute("href"));

      const order = focusables(container);
      const backIdx = order.indexOf(back);
      const startIdx = order.indexOf(starts[0]);
      const submit = screen.getByRole("button", { name: /send rsvp/i });
      const submitIdx = order.indexOf(submit);

      expect(backIdx).toBeGreaterThanOrEqual(0);
      expect(startIdx).toBeGreaterThan(backIdx);
      expect(submitIdx).toBeGreaterThan(startIdx);
    });

    it("RSVP inputs are labelled and keyboard-reachable", () => {
      renderAt("/showcase?id=aarav-priya");
      const form = screen.getByRole("button", { name: /send rsvp/i }).closest("form")!;
      const inputs = within(form as HTMLElement).getAllByRole("textbox");
      const numbers = (form as HTMLElement).querySelectorAll('input[type="number"]');
      expect(inputs.length + numbers.length).toBeGreaterThanOrEqual(2);
      inputs.forEach((el) => {
        expect(el).not.toBeDisabled();
        expect((el as HTMLElement).getAttribute("tabindex")).not.toBe("-1");
      });
    });
  });
});