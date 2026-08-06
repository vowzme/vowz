import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { GOLD, GOLD_LIGHT } from "../theme";

export const useReveal = (delay: number, damping = 200) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping, stiffness: 90, mass: 0.9 } });
  return {
    opacity: s,
    transform: `translateY(${interpolate(s, [0, 1], [42, 0])}px)`,
    filter: `blur(${interpolate(s, [0, 1], [10, 0])}px)`,
  } as React.CSSProperties;
};

export const GoldRule: React.FC<{ delay: number; width?: number }> = ({ delay, width = 180 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        width: s * width, height: 2,
        background: `linear-gradient(90deg, transparent, ${GOLD_LIGHT}, ${GOLD}, transparent)`,
      }}
    />
  );
};

export const Eyebrow: React.FC<{ children: React.ReactNode; delay: number; font: string }> = ({ children, delay, font }) => {
  const st = useReveal(delay);
  return (
    <div style={{ ...st, fontFamily: font, color: GOLD, letterSpacing: 6, textTransform: "uppercase", fontSize: 26, fontWeight: 600 }}>
      {children}
    </div>
  );
};