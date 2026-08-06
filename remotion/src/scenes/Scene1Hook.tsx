import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { display, body, GOLD, IVORY, NAVY_DEEP } from "../theme";
import { GoldRule } from "../components/Bits";

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zoom = interpolate(frame, [0, 110], [1.16, 1.3]);
  const drift = interpolate(frame, [0, 110], [0, -30]);

  const w1 = spring({ frame: frame - 14, fps, config: { damping: 200 } });
  const w2 = spring({ frame: frame - 26, fps, config: { damping: 200 } });
  const sub = spring({ frame: frame - 52, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ background: NAVY_DEEP }}>
      <AbsoluteFill>
        <Img
          src={staticFile("images/hero.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom}) translateY(${drift}px)` }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{ background: "linear-gradient(180deg, rgba(0,20,42,0.55) 0%, rgba(0,31,63,0.72) 45%, rgba(0,20,42,0.96) 100%)" }}
      />

      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", padding: "0 90px 320px" }}>
        <div style={{ opacity: w1, transform: `translateY(${interpolate(w1, [0, 1], [50, 0])}px)`, textAlign: "center" }}>
          <div style={{ fontFamily: display, fontSize: 128, lineHeight: 1.02, color: IVORY, fontWeight: 700, letterSpacing: -2 }}>
            Where Vows
          </div>
        </div>
        <div style={{ opacity: w2, transform: `translateY(${interpolate(w2, [0, 1], [50, 0])}px)`, textAlign: "center" }}>
          <div style={{ fontFamily: display, fontSize: 128, lineHeight: 1.06, color: GOLD, fontWeight: 500, fontStyle: "italic" }}>
            Come Alive
          </div>
        </div>
        <div style={{ marginTop: 44, marginBottom: 34 }}>
          <GoldRule delay={62} width={220} />
        </div>
        <div
          style={{
            opacity: sub, transform: `translateY(${interpolate(sub, [0, 1], [26, 0])}px)`,
            fontFamily: body, fontWeight: 300, fontSize: 40, color: "rgba(245,245,220,0.82)",
            textAlign: "center", lineHeight: 1.4, letterSpacing: 0.5,
          }}
        >
          A stunning wedding website,
          <br />
          ready in five minutes.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};