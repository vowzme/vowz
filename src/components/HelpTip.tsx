import { useEffect, useId, useRef, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { HELP } from "@/lib/dashboard-help";

interface HelpTipProps {
  topic: keyof typeof HELP;
  className?: string;
}

/**
 * Small "?" icon that expands an inline help panel with contextual
 * guidance for a dashboard section. Content is sourced from
 * src/lib/dashboard-help.ts so copy can be edited in one place.
 */
const HelpTip = ({ topic, className = "" }: HelpTipProps) => {
  const [open, setOpen] = useState(false);
  const item = HELP[topic];
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    // Move focus into the panel for screen-reader + keyboard users.
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  if (!item) return null;
  return (
    <span className={`inline-flex items-start relative align-middle ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? titleId : undefined}
        aria-label={`Help: ${item.title}`}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-muted-foreground hover:text-gold hover:bg-gold/10 transition-colors focus:outline-none focus:ring-2 focus:ring-gold/40"
      >
        <HelpCircle className="w-4 h-4" aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={panelRef}
          id={titleId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${titleId}-title`}
          className="absolute left-6 top-0 z-30 w-72 sm:w-80 bg-card border border-gold/40 rounded-lg shadow-elegant p-3 animate-fade-in"
        >
          <div className="flex items-start justify-between gap-2">
            <span id={`${titleId}-title`} className="font-display text-sm font-semibold text-foreground">
              {item.title}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              aria-label="Close help"
              className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 rounded min-w-6 min-h-6 inline-flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-2 font-body text-xs text-muted-foreground leading-relaxed">
            <div className="font-semibold text-foreground/80 uppercase tracking-wide text-[10px] mb-0.5">
              What this does
            </div>
            {item.what}
          </div>
          {item.why && (
            <div className="mt-2 font-body text-xs text-muted-foreground leading-relaxed">
              <div className="font-semibold text-foreground/80 uppercase tracking-wide text-[10px] mb-0.5">
                Why it matters
              </div>
              {item.why}
            </div>
          )}
          {item.try && item.try.length > 0 && (
            <div className="mt-2 font-body text-xs text-muted-foreground leading-relaxed">
              <div className="font-semibold text-foreground/80 uppercase tracking-wide text-[10px] mb-0.5">
                Try this
              </div>
              <ul className="list-disc pl-4 space-y-0.5">
                {item.try.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </span>
  );
};

export default HelpTip;