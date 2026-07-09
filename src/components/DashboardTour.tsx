import { useEffect, useCallback, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Button } from "@/components/ui/button";
import { HelpCircle, PlayCircle } from "lucide-react";
import { TOUR_STEPS } from "@/lib/dashboard-help";

const SEEN_KEY = "vowz_dashboard_tour_seen";
const PROGRESS_KEY = "vowz_dashboard_tour_step";

function readProgress(): number {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw || raw === "done") return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function saveProgress(step: number) {
  try { localStorage.setItem(PROGRESS_KEY, String(step)); } catch {}
}

function markDone() {
  try { localStorage.setItem(PROGRESS_KEY, "done"); } catch {}
}

/**
 * Interactive spotlight tour for the customer dashboard. Uses driver.js
 * to highlight key sections with next/prev navigation. Auto-opens on
 * first visit (per-browser via localStorage) and can be re-triggered
 * from the header button rendered by this component.
 */
const DashboardTour = () => {
  const [resumeStep, setResumeStep] = useState<number>(() => readProgress());

  const runTour = useCallback((startAt?: number) => {
    if (typeof document === "undefined") return;
    const available = TOUR_STEPS.filter((s) => document.querySelector(s.selector));
    const steps = available.map((s, idx) => ({
      element: s.selector,
      popover: {
        title: s.title,
        description: s.html,
        popoverClass: "vowz-tour-popover",
        onPopoverRender: () => {
          if (s.tab) {
            const trigger = document.querySelector<HTMLElement>(
              `[data-tour="tab-${s.tab}"]`,
            );
            trigger?.click();
          }
          // Persist current step so we can resume later.
          saveProgress(idx);
          setResumeStep(idx);
        },
      },
    }));
    if (!steps.length) return;
    const d = driver({
      showProgress: true,
      allowClose: true,
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 12,
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Finish",
      steps,
      onDestroyed: () => {
        const active = d.getActiveIndex?.();
        // Finished the last step (or driver.js reports no active step after Finish)
        if (typeof active !== "number" || active >= steps.length - 1) {
          markDone();
          setResumeStep(0);
        }
      },
    });
    const clamped = Math.min(Math.max(startAt ?? 0, 0), steps.length - 1);
    d.drive(clamped);
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(SEEN_KEY)) return;
      // Delay so target elements are mounted
      const t = setTimeout(() => {
        runTour();
        try { localStorage.setItem(SEEN_KEY, "1"); } catch {}
      }, 900);
      return () => clearTimeout(t);
    } catch {}
  }, [runTour]);

  const isResuming = resumeStep > 0;
  const label = isResuming ? "Resume tour" : "Start dashboard tour";
  const shortLabel = isResuming ? "Resume" : "Tour";

  return (
    <Button
      variant="gold"
      size="sm"
      onClick={() => runTour(resumeStep)}
      data-tour="tour-trigger"
      aria-label={label}
      className="gap-1.5 min-h-11 shadow-gold animate-in fade-in"
    >
      {isResuming ? <PlayCircle className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
      <span className="font-body font-medium">
        <span className="hidden sm:inline">
          {label}
          {isResuming ? ` (step ${resumeStep + 1})` : ""}
        </span>
        <span className="sm:hidden">{shortLabel}</span>
      </span>
    </Button>
  );
};

export default DashboardTour;