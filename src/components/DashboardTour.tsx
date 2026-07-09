import { useEffect, useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { TOUR_STEPS } from "@/lib/dashboard-help";

const STORAGE_KEY = "vowz_dashboard_tour_seen";

/**
 * Interactive spotlight tour for the customer dashboard. Uses driver.js
 * to highlight key sections with next/prev navigation. Auto-opens on
 * first visit (per-browser via localStorage) and can be re-triggered
 * from the header button rendered by this component.
 */
const DashboardTour = () => {
  const runTour = useCallback(() => {
    if (typeof document === "undefined") return;
    const steps = TOUR_STEPS
      .filter((s) => document.querySelector(s.selector))
      .map((s) => ({
        element: s.selector,
        popover: {
          title: s.title,
          description: s.html,
          side: "bottom" as const,
          align: "start" as const,
          onPopoverRender: () => {
            // Switch to the relevant tab so the highlighted element is visible.
            if (s.tab) {
              const trigger = document.querySelector<HTMLElement>(
                `[data-tour="tab-${s.tab}"]`,
              );
              trigger?.click();
            }
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
    });
    d.drive();
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
      // Delay so target elements are mounted
      const t = setTimeout(() => {
        runTour();
        try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
      }, 900);
      return () => clearTimeout(t);
    } catch {}
  }, [runTour]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={runTour}
      data-tour="tour-trigger"
      className="gap-1.5"
    >
      <HelpCircle className="w-4 h-4" />
      <span className="hidden sm:inline">Take a tour</span>
    </Button>
  );
};

export default DashboardTour;