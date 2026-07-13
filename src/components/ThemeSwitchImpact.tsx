import { Palette } from "lucide-react";
import { WEDDING_THEMES } from "@/lib/wedding-themes";
import { computeThemeDiff, diffThemes, THEME_TOKEN_LABELS } from "@/lib/theme-diff";

type Theme = typeof WEDDING_THEMES[number];

/** Pure "What will change" summary — a plain bullet list of changed field labels. */
export function WhatWillChangeSummary({ current, next }: { current: Theme; next: Theme }) {
  // The summary is derived from the SAME computeThemeDiff output that
  // the token-diff table uses, so it can never disagree with the diff.
  const changed = computeThemeDiff(current, next).filter((r) => r.changed);
  const labels = changed.map((r) => THEME_TOKEN_LABELS[r.field]);
  return (
    <div data-testid="what-will-change" className="rounded-lg border border-gold/40 bg-gold/10 p-2.5">
      <p className="text-[10px] uppercase tracking-widest font-body text-gold mb-1.5 flex items-center gap-1">
        <Palette className="w-3 h-3" aria-hidden /> What changes
      </p>
      {labels.length === 0 ? (
        <p className="text-[11px] font-body text-foreground/80">
          Nothing — this preset matches your current theme.
        </p>
      ) : (
        <ul className="text-[11px] font-body text-foreground/80 space-y-0.5 list-disc pl-4">
          {changed.map((r) => (
            <li key={r.field} data-field={r.field}>{THEME_TOKEN_LABELS[r.field]}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Pure token-diff table — one row per applyTheme field. */
export function TokenDiffTable({ current, next }: { current: Theme; next: Theme }) {
  const { rows } = diffThemes(current, next);
  return (
    <ul data-testid="token-diff" className="space-y-1.5 text-xs font-body">
      {rows.map((r) => (
        <li
          key={r.label}
          data-label={r.label}
          data-changed={r.changed ? "true" : "false"}
          className={`flex items-center gap-2 ${r.changed ? "text-foreground" : "text-muted-foreground/70"}`}
        >
          <span className="w-24 shrink-0">{r.label}</span>
          <span className="flex items-center gap-1 min-w-0 flex-1">
            {r.swatchFrom && (
              <span className="w-3 h-3 rounded-full border border-border/60" style={{ background: r.swatchFrom }} aria-hidden />
            )}
            <span className="truncate">{r.from}</span>
          </span>
          <span className="text-muted-foreground shrink-0">→</span>
          <span className="flex items-center gap-1 min-w-0 flex-1">
            {r.swatchTo && (
              <span className="w-3 h-3 rounded-full border border-border/60" style={{ background: r.swatchTo }} aria-hidden />
            )}
            <span className={`truncate ${r.changed ? "font-semibold" : ""}`}>{r.to}</span>
          </span>
          {!r.changed && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">same</span>
          )}
        </li>
      ))}
    </ul>
  );
}
