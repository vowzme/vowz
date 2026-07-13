import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/**
 * Accessibility tests for the full-screen theme preview modal.
 *
 * The real modal lives in `src/pages/Themes.tsx` and is composed from the
 * shadcn `Dialog` (Radix UI) primitives. These tests exercise the same
 * primitives with the same aria wiring to verify:
 *   1. Focus is trapped inside the dialog while open.
 *   2. Escape closes the dialog.
 *   3. Tab / Shift+Tab navigate between interactive elements and cycle.
 *   4. Focus returns to the trigger after close.
 */

function PreviewHarness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="open-preview"
      >
        Open preview
      </button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) onClose?.();
        }}
      >
        <DialogContent
          className="max-w-[100vw] w-screen h-[100dvh] p-0"
          aria-describedby="theme-preview-desc"
        >
          <DialogTitle>Royal Rajput · landing preview</DialogTitle>
          <DialogDescription id="theme-preview-desc">
            Press Escape to close.
          </DialogDescription>
          <button type="button" data-testid="use-theme">
            Use this theme
          </button>
          <button
            type="button"
            data-testid="close-preview"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

afterEach(() => cleanup());

describe("full-screen preview modal accessibility", () => {
  it("moves focus into the dialog when opened", async () => {
    const user = userEvent.setup();
    render(<PreviewHarness />);
    await user.click(screen.getByTestId("open-preview"));
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  it("closes on Escape key", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PreviewHarness onClose={onClose} />);
    await user.click(screen.getByTestId("open-preview"));
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("traps focus inside the dialog when tabbing", async () => {
    const user = userEvent.setup();
    render(<PreviewHarness />);
    await user.click(screen.getByTestId("open-preview"));
    const dialog = await screen.findByRole("dialog");

    // Tab through several times — focus must never escape the dialog.
    for (let i = 0; i < 6; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    // Shift+Tab cycles backwards, still inside the dialog.
    for (let i = 0; i < 3; i++) {
      await user.tab({ shift: true });
      expect(dialog.contains(document.activeElement)).toBe(true);
    }

    // The trigger button, which lives outside the dialog, must never receive focus.
    expect(document.activeElement).not.toBe(screen.getByTestId("open-preview"));
  });

  it("returns focus to the trigger after closing", async () => {
    const user = userEvent.setup();
    render(<PreviewHarness />);
    const trigger = screen.getByTestId("open-preview");
    await user.click(trigger);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });

  it("exposes accessible name and description via aria attributes", async () => {
    const user = userEvent.setup();
    render(<PreviewHarness />);
    await user.click(screen.getByTestId("open-preview"));
    const dialog = await screen.findByRole("dialog");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(labelledBy).toBeTruthy();
    expect(describedBy).toBe("theme-preview-desc");
    expect(document.getElementById(labelledBy!)?.textContent).toMatch(/landing preview/i);
    expect(document.getElementById(describedBy!)?.textContent).toMatch(/escape to close/i);
  });
});

// Silence unused import warning in some ts configs.
void act;