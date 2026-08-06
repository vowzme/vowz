import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { display, body, GOLD, IVORY } from "../theme";
import { Backdrop } from "../components/Backdrop";
import { Eyebrow, GoldRule } from "../components/Bits";

const SHOTS = [
  "images/couple-hindu.jpg",
  "images/couple-christian.jpg",
  "images/couple-modern.jpg",
  "images/couple-muslim.jpg",
  "images/couple-beach.jpg",
  "images/venue-garden.jpg",
];

export const Scene2Templates: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 6, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ padding: "150px 70px", alignItems: "center" }}>
        <Eyebrow delay={4} font={body}>
          35+ Templates
        </Eyebrow>
        <div
          style={{
            marginTop: 22, opacity: head, transform: `translateY(${interpolate(head, [0, 1], [34, 0])}px)`,
            fontFamily: display, fontSize: 92, color: IVORY, fontWeight: 700, textAlign: "center", lineHeight: 1.08,
          }}
        >
          Every ritual,
          <br />
          <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 500 }}>every culture</span>
        </div>
        <div style={{ marginTop: 30 }}>
          <GoldRule delay={22} width={200} />
        </div>

        <div style={{ marginTop: 76, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 26, width: "100%" }}>
          {SHOTS.map((src, i) => {
            const s = spring({ frame: frame - 26 - i * 6, fps, config: { damping: 18, stiffness: 130 } });
            const float = Math.sin((frame + i * 30) / 26) * 8;
            return (
              <div
                key={src}
                style={{
                  opacity: s,
                  transform: `translateY(${interpolate(s, [0, 1], [70, float])}px) scale(${interpolate(s, [0, 1], [0.86, 1])})`,
                  borderRadius: 22, overflow: "hidden", aspectRatio: "3 / 4",
                  border: "1.5px solid rgba(212,175,55,0.45)",
                  boxShadow: "0 26px 60px rgba(0,0,0,0.5)",
                }}
              >
                <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};