import { Heart, Calendar, MapPin } from "lucide-react";
import { ThemeMotif } from "@/components/ThemeMotif";
import type { WeddingTheme, ThemeArchetype } from "@/lib/wedding-themes";

// A compact but full-fidelity live demo of a theme — hero, story, events,
// palette strip. Each archetype renders a genuinely different page structure
// (hero composition, alignment, typographic scale and section order), not just
// a recoloured version of the same layout.
export function ThemeDemo({
  theme,
  compact = false,
  motifIntensity = 0.15,
}: {
  theme: WeddingTheme;
  compact?: boolean;
  /** 0 = hidden, 1 = fully opaque. Default matches the standard preview. */
  motifIntensity?: number;
}) {
  const { colors, fonts, motif, heroGradient, sampleCouple, sampleTagline } = theme;
  const [p1, p2] = sampleCouple;
  const archetype: ThemeArchetype = theme.archetype ?? "classic";
  const opacity = Math.max(0, Math.min(1, motifIntensity));
  const display = `'${fonts.display}', serif`;
  const initials = `${p1[0]}${p2[0]}`.toUpperCase();

  const Motif = (
    <div className="absolute inset-0" style={{ color: colors.accent, opacity }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <ThemeMotif motif={motif} className="w-[110%] h-[110%]" />
      </div>
    </div>
  );

  const heroBase = "relative overflow-hidden px-4 py-8 sm:py-10";

  let hero: JSX.Element;

  switch (archetype) {
    case "editorial":
      hero = (
        <div className={`${heroBase} grid grid-cols-5 gap-3 items-center py-7`} style={{ background: heroGradient, color: colors.light }}>
          {Motif}
          <div className="relative z-10 col-span-3 text-left">
            <p className="text-[9px] tracking-[0.35em] uppercase mb-2 opacity-70">The Wedding Of</p>
            <h1 className="text-2xl sm:text-4xl font-semibold leading-[1.05]" style={{ fontFamily: display, color: colors.light }}>
              {p1}
              <br />
              <span style={{ color: colors.accent }}>&amp;</span> {p2}
            </h1>
            <div className="w-10 h-px my-3" style={{ background: colors.accent }} />
            <p className="text-[11px] opacity-85 max-w-[22ch]">{sampleTagline}</p>
          </div>
          <div className="relative z-10 col-span-2">
            <div className="aspect-[3/4] rounded-sm border" style={{ borderColor: `${colors.accent}66`, background: `${colors.accent}1F` }} />
          </div>
        </div>
      );
      break;

    case "poster":
      hero = (
        <div className={`${heroBase} text-left py-10`} style={{ background: heroGradient, color: colors.light }}>
          {Motif}
          <div className="relative z-10">
            <h1 className="text-[2.6rem] sm:text-6xl font-bold uppercase leading-[0.85] tracking-tight" style={{ fontFamily: display }}>
              {p1}
              <br />
              <span style={{ color: colors.accent }}>{p2}</span>
            </h1>
            <div className="mt-4 flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase opacity-85">
              <span>Save the date</span>
              <span className="flex-1 h-px" style={{ background: colors.accent }} />
              <span>2026</span>
            </div>
          </div>
        </div>
      );
      break;

    case "framed":
      hero = (
        <div className={`${heroBase} py-6`} style={{ background: heroGradient, color: colors.light }}>
          {Motif}
          <div className="relative z-10 border-2 px-4 py-7 text-center" style={{ borderColor: `${colors.accent}AA` }}>
            <p className="text-[9px] tracking-[0.4em] uppercase mb-3 opacity-80">Together with their families</p>
            <h1 className="text-2xl sm:text-3xl leading-tight" style={{ fontFamily: display }}>
              {p1}
            </h1>
            <p className="my-1 text-xs italic" style={{ color: colors.accent, fontFamily: display }}>and</p>
            <h1 className="text-2xl sm:text-3xl leading-tight" style={{ fontFamily: display }}>
              {p2}
            </h1>
            <p className="mt-3 text-[10px] tracking-[0.25em] uppercase opacity-75">{sampleTagline}</p>
          </div>
        </div>
      );
      break;

    case "monogram":
      hero = (
        <div className={`${heroBase} text-center py-9`} style={{ background: heroGradient, color: colors.light }}>
          {Motif}
          <div className="relative z-10">
            <div
              className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full border-2 text-lg"
              style={{ borderColor: colors.accent, color: colors.accent, fontFamily: display }}
            >
              {initials}
            </div>
            <h1 className="text-xl sm:text-2xl tracking-[0.18em] uppercase" style={{ fontFamily: display }}>
              {p1} &amp; {p2}
            </h1>
            <div className="mx-auto my-3 h-px w-16" style={{ background: colors.accent }} />
            <p className="text-[11px] italic opacity-85">{sampleTagline}</p>
          </div>
        </div>
      );
      break;

    case "column":
      hero = (
        <div className={`${heroBase} py-9`} style={{ background: heroGradient, color: colors.light }}>
          {Motif}
          <div className="relative z-10 mx-auto max-w-[18rem] border-l-2 pl-4" style={{ borderColor: colors.accent }}>
            <p className="text-[9px] tracking-[0.3em] uppercase opacity-70">Wedding</p>
            <h1 className="mt-2 text-2xl sm:text-3xl leading-tight" style={{ fontFamily: display }}>
              {p1} &amp; {p2}
            </h1>
            <p className="mt-3 text-[11px] leading-relaxed opacity-80">{sampleTagline}</p>
          </div>
        </div>
      );
      break;

    case "arcade":
      hero = (
        <div className={`${heroBase} py-7 text-center`} style={{ background: heroGradient, color: colors.light }}>
          {Motif}
          <div
            className="relative z-10 mx-auto max-w-[16rem] border px-4 py-8"
            style={{ borderColor: `${colors.accent}99`, borderRadius: "9999px 9999px 8px 8px", background: `${colors.accent}14` }}
          >
            <Heart className="mx-auto mb-2 h-4 w-4" style={{ color: colors.accent }} fill="currentColor" />
            <h1 className="text-xl sm:text-2xl leading-tight" style={{ fontFamily: display }}>
              {p1} <span style={{ color: colors.accent }}>&amp;</span> {p2}
            </h1>
            <p className="mt-2 text-[10px] tracking-[0.2em] uppercase opacity-80">{sampleTagline}</p>
          </div>
        </div>
      );
      break;

    case "ticket":
      hero = (
        <div className={`${heroBase} py-8`} style={{ background: heroGradient, color: colors.light }}>
          {Motif}
          <div className="relative z-10 flex items-stretch gap-3">
            <div className="flex-1">
              <p className="text-[9px] tracking-[0.3em] uppercase opacity-70">Admit two</p>
              <h1 className="mt-1 text-2xl sm:text-3xl leading-tight" style={{ fontFamily: display }}>
                {p1} &amp; {p2}
              </h1>
              <p className="mt-2 text-[11px] opacity-80">{sampleTagline}</p>
            </div>
            <div className="w-px border-l border-dashed" style={{ borderColor: `${colors.accent}AA` }} />
            <div className="flex w-16 flex-col items-center justify-center text-center">
              <span className="text-[9px] uppercase tracking-[0.2em] opacity-70">Date</span>
              <span className="text-lg" style={{ fontFamily: display, color: colors.accent }}>
                12
              </span>
              <span className="text-[9px] uppercase opacity-70">Dec</span>
            </div>
          </div>
        </div>
      );
      break;

    default:
      hero = (
        <div className={`${heroBase} text-center`} style={{ background: heroGradient, color: colors.light }}>
          {Motif}
          <div className="relative z-10">
            <Heart className="w-4 h-4 mx-auto mb-2" style={{ color: colors.accent }} fill="currentColor" />
            <p className="text-[10px] tracking-[0.25em] uppercase mb-2 opacity-80">The Wedding Of</p>
            <h1 className="text-2xl sm:text-3xl font-semibold leading-tight" style={{ fontFamily: display, color: colors.light }}>
              {p1} <span style={{ color: colors.accent }}>&amp;</span> {p2}
            </h1>
            <p className="italic mt-2 text-xs sm:text-sm" style={{ color: colors.accent, fontFamily: display }}>
              {sampleTagline}
            </p>
          </div>
        </div>
      );
  }

  const storyAlign = archetype === "editorial" || archetype === "poster" || archetype === "column" || archetype === "ticket" ? "text-left" : "text-center";
  const eventsAsList = archetype === "editorial" || archetype === "column" || archetype === "ticket";

  const story = (
    <div className={`px-5 py-6 ${storyAlign}`}>
      <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: display }}>
        Our Story
      </h2>
      <div className={`w-10 h-px mb-3 ${storyAlign === "text-center" ? "mx-auto" : ""}`} style={{ background: colors.accent }} />
      <p className={`text-xs leading-relaxed opacity-80 max-w-md ${storyAlign === "text-center" ? "mx-auto" : ""}`}>
        A chance encounter, a shared laugh, and a love story worth telling — in the colours and craft that feel most like us.
      </p>
    </div>
  );

  const items = [
    { icon: Heart, label: "Haldi" },
    { icon: Calendar, label: "Mehendi" },
    { icon: MapPin, label: "Wedding" },
  ];

  const events = (
    <div className="px-5 py-5" style={{ background: `${colors.accent}12` }}>
      {eventsAsList ? (
        <div className="space-y-2">
          {items.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-md border px-3 py-2"
              style={{ borderColor: `${colors.accent}40`, background: colors.surface }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: colors.accent }} />
              <span className="text-[11px] font-semibold" style={{ fontFamily: display }}>
                {label}
              </span>
              <span className="ml-auto text-[9px] opacity-60">TBD</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {items.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="text-center rounded-lg p-2 border"
              style={{ borderColor: `${colors.accent}40`, background: colors.surface }}
            >
              <Icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: colors.accent }} />
              <div className="text-[11px] font-semibold" style={{ fontFamily: display }}>
                {label}
              </div>
              <div className="text-[9px] opacity-60">TBD</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Some archetypes lead with the schedule rather than the story.
  const eventsFirst = archetype === "poster" || archetype === "ticket";

  return (
    <div
      className="w-full overflow-hidden rounded-xl border border-black/5 shadow-md"
      style={{ background: colors.surface, color: colors.ink, fontFamily: `'${fonts.body}', serif` }}
    >
      {hero}

      {!compact && (eventsFirst ? (
        <>
          {events}
          {story}
        </>
      ) : (
        <>
          {story}
          {events}
        </>
      ))}

      {/* Palette strip */}
      <div className="flex h-2">
        {[colors.bg, colors.accent, colors.surface, colors.ink].map((c) => (
          <div key={c} style={{ background: c }} className="flex-1" />
        ))}
      </div>
    </div>
  );
}
