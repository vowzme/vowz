import { useEffect, useCallback, useRef, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Button } from "@/components/ui/button";
import { HelpCircle, PlayCircle } from "lucide-react";
import { TOUR_STEPS } from "@/lib/dashboard-help";
import { supabase } from "@/integrations/supabase/client";

const SEEN_KEY = "vowz_dashboard_tour_seen";
const PROGRESS_KEY = "vowz_dashboard_tour_step";

// Cache the user's primary wedding site id for the session so we don't
// re-query on every step transition.
let cachedSiteId: string | null | undefined;
async function getPrimarySiteId(): Promise<string | null> {
  if (cachedSiteId !== undefined) return cachedSiteId;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { cachedSiteId = null; return null; }
    const { data } = await supabase
      .from("wedding_sites")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    cachedSiteId = (data?.id as string) ?? null;
  } catch {
    cachedSiteId = null;
  }
  return cachedSiteId;
}

async function logTourEvent(
  eventType: "tour_start" | "tour_step" | "tour_complete" | "tour_dismiss",
  metadata: Record<string, any>,
) {
  try {
    const siteId = await getPrimarySiteId();
    if (!siteId) return;
    await supabase.from("site_analytics" as any).insert({
      wedding_site_id: siteId,
      event_type: eventType,
      metadata,
    });
  } catch {
    // never break the tour on analytics failure
  }
}

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
  const liveRef = useRef<HTMLDivElement>(null);

  const announce = (msg: string) => {
    if (liveRef.current) liveRef.current.textContent = msg;
  };

  const runTour = useCallback((startAt?: number) => {
    if (typeof document === "undefined") return;
    const available = TOUR_STEPS.filter((s) => document.querySelector(s.selector));
    const totalSteps = available.length;
    const seenSteps = new Set<number>();
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
          // Announce step change for screen readers.
          announce(`Step ${idx + 1} of ${totalSteps}: ${s.title}`);
          // A11y: label the driver.js popover and move focus into it.
          requestAnimationFrame(() => {
            const popover = document.querySelector<HTMLElement>(".driver-popover");
            if (!popover) return;
            popover.setAttribute("role", "dialog");
            popover.setAttribute("aria-modal", "true");
            popover.setAttribute("aria-label", `${s.title} (step ${idx + 1} of ${totalSteps})`);
            popover.setAttribute("tabindex", "-1");
            const next = popover.querySelector<HTMLElement>(
              ".driver-popover-next-btn, .driver-popover-done-btn",
            );
            (next ?? popover).focus({ preventScroll: true });
          });
          if (!seenSteps.has(idx)) {
            seenSteps.add(idx);
            void logTourEvent("tour_step", {
              step_index: idx,
              step_title: s.title,
              step_selector: s.selector,
              total_steps: totalSteps,
            });
          }
        },
      },
    }));
    if (!steps.length) return;
    const d = driver({
      showProgress: true,
      allowClose: true,
      allowKeyboardControl: true,
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 12,
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Finish tour",
      steps,
      onDestroyed: () => {
        const active = d.getActiveIndex?.();
        const completed =
          typeof active !== "number" || active >= steps.length - 1;
        // Finished the last step (or driver.js reports no active step after Finish)
        if (completed) {
          markDone();
          setResumeStep(0);
          announce("Dashboard tour complete.");
          void logTourEvent("tour_complete", {
            total_steps: totalSteps,
            steps_viewed: seenSteps.size,
          });
        } else {
          announce("Dashboard tour closed.");
          void logTourEvent("tour_dismiss", {
            last_step_index: typeof active === "number" ? active : null,
            total_steps: totalSteps,
            steps_viewed: seenSteps.size,
          });
        }
        // Return focus to the trigger button.
        const trigger = document.querySelector<HTMLElement>('[data-tour="tour-trigger"]');
        trigger?.focus();
      },
    });
    const clamped = Math.min(Math.max(startAt ?? 0, 0), steps.length - 1);
    void logTourEvent("tour_start", {
      start_index: clamped,
      total_steps: totalSteps,
      resumed: (startAt ?? 0) > 0,
    });
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
    <>
    <Button
      variant="gold"
      size="sm"
      onClick={() => runTour(resumeStep)}
      data-tour="tour-trigger"
      aria-label={label}
      className="gap-1.5 min-h-11 shadow-gold animate-in fade-in"
    >
      {isResuming ? (
        <PlayCircle className="w-4 h-4" aria-hidden="true" />
      ) : (
        <HelpCircle className="w-4 h-4" aria-hidden="true" />
      )}
      <span className="font-body font-medium">
        <span className="hidden sm:inline">
          {label}
          {isResuming ? ` (step ${resumeStep + 1})` : ""}
        </span>
        <span className="sm:hidden">{shortLabel}</span>
      </span>
    </Button>
    <div
      ref={liveRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
    </>
  );
};

export default DashboardTour;