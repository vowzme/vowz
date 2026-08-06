import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { display, body, GOLD, IVORY, NAVY_DEEP } from "../theme";
import { Backdrop } from "../components/Backdrop";
import { GoldRule } from "../components/Bits";

export const Scene5CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: frame - 4, fps, config: { damping: 18, stiffness: 110 } });
  const line = spring({ frame: frame - 30, fps, config: { damping: 200 } });
  const url = spring({ frame: frame - 52, fps, config: { damping: 13, stiffness: 140 } });
  const foot = spring({ frame: frame - 70, fps, config: { damping: 200 } });
  const glow = 0.35 + Math.sin(frame / 18) * 0.15;

  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 40% at 50% 52%, rgba(212,175,55,${glow * 0.35}) 0%, transparent 70%)`,
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 90px" }}>
        <Img
          src={staticFile("images/logo.png")}
          style={{
            width: 620, opacity: logo,
            transform: `translateY(${interpolate(logo, [0, 1], [40, 0])}px) scale(${interpolate(logo, [0, 1], [0.9, 1])})`,
          }}
        />
        <div style={{ marginTop: 40 }}>
          <GoldRule delay={26} width={260} />
        </div>
        <div
          style={{
            marginTop: 40, opacity: line, transform: `translateY(${interpolate(line, [0, 1], [30, 0])}px)`,
            fontFamily: display, fontSize: 74, color: IVORY, fontWeight: 700, textAlign: "center", lineHeight: 1.15,
          }}
        >
          Start free for
          <br />
          <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 500 }}>7 days</span>
        </div>
        <div
          style={{
            marginTop: 60, padding: "28px 70px", borderRadius: 999,
            background: GOLD, color: NAVY_DEEP, fontFamily: body, fontWeight: 600, fontSize: 46, letterSpacing: 1,
            opacity: url, transform: `scale(${interpolate(url, [0, 1], [0.8, 1])})`,
            boxShadow: `0 0 ${40 + glow * 90}px rgba(212,175,55,0.55)`,
          }}
        >
          vowz.me
        </div>
        <div
          style={{
            marginTop: 44, opacity: foot, fontFamily: body, fontWeight: 300, fontSize: 30,
            color: "rgba(245,245,220,0.65)", textAlign: "center", letterSpacing: 1,
          }}
        >
          No credit card · Publish in minutes
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};