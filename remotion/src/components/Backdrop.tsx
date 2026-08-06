import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { bgGradient, GOLD } from "../theme";

export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: bgGradient }}>
      {[...Array(14)].map((_, i) => {
        const seed = (i * 97) % 100;
        const x = 4 + ((i * 37) % 92);
        const speed = 0.35 + (seed % 7) * 0.07;
        const y = ((1900 - ((frame * speed * 6 + seed * 19) % 2100)) / 1920) * 100;
        const size = 3 + (seed % 5);
        const o = interpolate(y, [-5, 15, 85, 105], [0, 0.55, 0.45, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: `${x}%`, top: `${y}%`,
              width: size, height: size, borderRadius: "50%",
              background: GOLD, opacity: o,
              boxShadow: `0 0 ${size * 4}px ${GOLD}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};