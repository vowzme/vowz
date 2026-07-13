import { Heart, Calendar, MapPin } from "lucide-react";
import { ThemeMotif } from "@/components/ThemeMotif";
import type { WeddingTheme } from "@/lib/wedding-themes";

// A compact but full-fidelity live demo of a theme — hero, story, events,
// palette strip. Used both as a card preview and inside the modal.
export function ThemeDemo({ theme, compact = false }: { theme: WeddingTheme; compact?: boolean }) {
  const { colors, fonts, motif, heroGradient, sampleCouple, sampleTagline } = theme;
  const [p1, p2] = sampleCouple;

  return (
    <div
      className="w-full overflow-hidden rounded-xl border border-black/5 shadow-md"
      style={{ background: colors.surface, color: colors.ink, fontFamily: `'${fonts.body}', serif` }}
    >
      {/* Hero */}
      <div
        className="relative text-center px-4 py-8 sm:py-10 overflow-hidden"
        style={{ background: heroGradient, color: colors.light }}
      >
        <div className="absolute inset-0 opacity-15" style={{ color: colors.accent }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <ThemeMotif motif={motif} className="w-[110%] h-[110%]" />
          </div>
        </div>
        <div className="relative z-10">
          <Heart className="w-4 h-4 mx-auto mb-2" style={{ color: colors.accent }} fill="currentColor" />
          <p className="text-[10px] tracking-[0.25em] uppercase mb-2 opacity-80">The Wedding Of</p>
          <h1
            className="text-2xl sm:text-3xl font-semibold leading-tight"
            style={{ fontFamily: `'${fonts.display}', serif`, color: colors.light }}
          >
            {p1} <span style={{ color: colors.accent }}>&amp;</span> {p2}
          </h1>
          <p
            className="italic mt-2 text-xs sm:text-sm"
            style={{ color: colors.accent, fontFamily: `'${fonts.display}', serif` }}
          >
            {sampleTagline}
          </p>
        </div>
      </div>

      {!compact && (
        <>
          {/* Story */}
          <div className="px-5 py-6 text-center">
            <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: `'${fonts.display}', serif` }}>
              Our Story
            </h2>
            <div className="w-10 h-px mx-auto mb-3" style={{ background: colors.accent }} />
            <p className="text-xs leading-relaxed opacity-80 max-w-md mx-auto">
              A chance encounter, a shared laugh, and a love story worth telling — in the colours and craft that feel most like us.
            </p>
          </div>

          {/* Events */}
          <div className="px-5 py-5" style={{ background: `${colors.accent}12` }}>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Heart, label: "Haldi" },
                { icon: Calendar, label: "Mehendi" },
                { icon: MapPin, label: "Wedding" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="text-center rounded-lg p-2 border" style={{ borderColor: `${colors.accent}40`, background: colors.surface }}>
                  <Icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: colors.accent }} />
                  <div className="text-[11px] font-semibold" style={{ fontFamily: `'${fonts.display}', serif` }}>{label}</div>
                  <div className="text-[9px] opacity-60">TBD</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Palette strip */}
      <div className="flex h-2">
        {[colors.bg, colors.accent, colors.surface, colors.ink].map((c) => (
          <div key={c} style={{ background: c }} className="flex-1" />
        ))}
      </div>
    </div>
  );
}
