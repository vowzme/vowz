import type { WeddingTheme } from "@/lib/wedding-themes";

// Decorative SVG motifs rendered inside hero previews. Uses `currentColor`
// so each caller can tint via the surrounding element's text color.
export function ThemeMotif({ motif, className }: { motif: WeddingTheme["motif"]; className?: string }) {
  const common = { className, fill: "none", stroke: "currentColor", strokeWidth: 0.6 } as const;
  switch (motif) {
    case "mandala":
      return (
        <svg viewBox="0 0 200 200" {...common}>
          {[...Array(10)].map((_, i) => (
            <circle key={i} cx="100" cy="100" r={10 + i * 8} />
          ))}
          {[...Array(16)].map((_, i) => (
            <line key={i} x1="100" y1="100" x2={100 + 90 * Math.cos((i * Math.PI) / 8)} y2={100 + 90 * Math.sin((i * Math.PI) / 8)} />
          ))}
        </svg>
      );
    case "temple":
      return (
        <svg viewBox="0 0 200 200" {...common}>
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${40 + i * 8} ${180 - i * 20} L100 ${40 + i * 20} L${160 - i * 8} ${180 - i * 20}Z`} />
          ))}
          <circle cx="100" cy="100" r="12" />
        </svg>
      );
    case "arch":
      return (
        <svg viewBox="0 0 200 200" {...common}>
          <path d="M40 180 L40 100 A60 60 0 0 1 160 100 L160 180" />
          <path d="M55 180 L55 105 A45 45 0 0 1 145 105 L145 180" />
        </svg>
      );
    case "waves":
      return (
        <svg viewBox="0 0 200 200" {...common}>
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M0 ${60 + i * 25} Q50 ${40 + i * 25} 100 ${60 + i * 25} T200 ${60 + i * 25}`} />
          ))}
        </svg>
      );
    case "palm":
      return (
        <svg viewBox="0 0 200 200" {...common}>
          <path d="M100 190 Q95 130 100 60" />
          {[-1, 1].map((s) =>
            [0, 1, 2, 3].map((i) => (
              <path key={`${s}-${i}`} d={`M100 ${70 + i * 20} Q${100 + s * (60 - i * 8)} ${60 + i * 22} ${100 + s * (80 - i * 10)} ${50 + i * 22}`} />
            )),
          )}
        </svg>
      );
    case "alpona":
      return (
        <svg viewBox="0 0 200 200" {...common}>
          <circle cx="100" cy="100" r="70" />
          {[...Array(12)].map((_, i) => {
            const a = (i * Math.PI) / 6;
            return <path key={i} d={`M100 100 Q${100 + 50 * Math.cos(a)} ${100 + 50 * Math.sin(a)} ${100 + 70 * Math.cos(a)} ${100 + 70 * Math.sin(a)}`} />;
          })}
          <circle cx="100" cy="100" r="20" />
        </svg>
      );
    case "haveli":
      return (
        <svg viewBox="0 0 200 200" {...common}>
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => (
              <path key={`${r}-${c}`} d={`M${30 + c * 55} ${180 - r * 55} L${30 + c * 55} ${140 - r * 55} A20 20 0 0 1 ${70 + c * 55} ${140 - r * 55} L${70 + c * 55} ${180 - r * 55}Z`} />
            )),
          )}
        </svg>
      );
    case "cross":
      return (
        <svg viewBox="0 0 200 200" {...common}>
          <path d="M100 30 L100 170 M60 80 L140 80" />
          <circle cx="100" cy="100" r="70" />
          <circle cx="100" cy="100" r="55" />
        </svg>
      );
    case "khanda":
      return (
        <svg viewBox="0 0 200 200" {...common}>
          <circle cx="100" cy="100" r="35" />
          <path d="M100 40 L100 160" />
          <path d="M70 80 Q100 100 70 120" />
          <path d="M130 80 Q100 100 130 120" />
        </svg>
      );
    case "boho":
    default:
      return (
        <svg viewBox="0 0 200 200" {...common}>
          <circle cx="100" cy="100" r="60" />
          <path d="M40 100 L160 100 M100 40 L100 160" />
          <path d="M55 55 L145 145 M145 55 L55 145" />
          <circle cx="100" cy="100" r="20" />
        </svg>
      );
  }
}
