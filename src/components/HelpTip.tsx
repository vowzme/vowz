import { useState } from "react";
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
  if (!item) return null;
  return (
    <span className={`inline-flex items-start relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Help: ${item.title}`}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-muted-foreground hover:text-gold hover:bg-gold/10 transition-colors focus:outline-none focus:ring-2 focus:ring-gold/40"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {open && (
        <span
          role="dialog"
          className="absolute left-6 top-0 z-30 w-72 sm:w-80 bg-card border border-gold/40 rounded-lg shadow-elegant p-3 animate-fade-in"
        >
          <span className="flex items-start justify-between gap-2">
            <span className="font-display text-sm font-semibold text-foreground">
              {item.title}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close help"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
          <span className="block mt-2 font-body text-xs text-muted-foreground leading-relaxed">
            <span className="block font-semibold text-foreground/80 uppercase tracking-wide text-[10px] mb-0.5">
              What this does
            </span>
            {item.what}
          </span>
          {item.why && (
            <span className="block mt-2 font-body text-xs text-muted-foreground leading-relaxed">
              <span className="block font-semibold text-foreground/80 uppercase tracking-wide text-[10px] mb-0.5">
                Why it matters
              </span>
              {item.why}
            </span>
          )}
          {item.try && item.try.length > 0 && (
            <span className="block mt-2 font-body text-xs text-muted-foreground leading-relaxed">
              <span className="block font-semibold text-foreground/80 uppercase tracking-wide text-[10px] mb-0.5">
                Try this
              </span>
              <ul className="list-disc pl-4 space-y-0.5">
                {item.try.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </span>
          )}
        </span>
      )}
    </span>
  );
};

export default HelpTip;