import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { display, body, GOLD, GOLD_LIGHT, IVORY, NAVY_DEEP } from "../theme";
import { Backdrop } from "../components/Backdrop";
import { Eyebrow } from "../components/Bits";

export const Scene4Card: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame: frame - 8, fps, config: { damping: 16, stiffness: 110, mass: 1.1 } });
  const tilt = interpolate(frame, [0, 100], [7, -4]);
  const float = Math.sin(frame / 24) * 10;
  const qr = spring({ frame: frame - 44, fps, config: { damping: 14, stiffness: 150 } });

  const cells = [...Array(64)].map((_, i) => {
    const r = Math.sin(i * 12.9898) * 43758.5453;
    return r - Math.floor(r) > 0.45;
  });

  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ padding: "0 80px", alignItems: "center", justifyContent: "center" }}>
        <Eyebrow delay={2} font={body}>
          Digital invitations
        </Eyebrow>
        <div
          style={{
            marginTop: 18, fontFamily: display, fontSize: 84, color: IVORY, fontWeight: 700, textAlign: "center",
            opacity: spring({ frame: frame - 8, fps, config: { damping: 200 } }),
          }}
        >
          Scan. <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 500 }}>RSVP.</span> Done.
        </div>

        <div
          style={{
            marginTop: 78,
            width: 700, padding: "64px 56px", borderRadius: 28,
            background: "linear-gradient(160deg, #FFFDF5 0%, #F5F0DF 100%)",
            border: `3px solid ${GOLD}`,
            boxShadow: "0 50px 110px rgba(0,0,0,0.55)",
            opacity: card,
            transform: `perspective(1600px) rotateY(${tilt}deg) translateY(${interpolate(card, [0, 1], [120, float])}px) scale(${interpolate(card, [0, 1], [0.9, 1])})`,
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: body, fontSize: 22, letterSpacing: 8, color: "#8A7328", textTransform: "uppercase" }}>
            Together with their families
          </div>
          <div style={{ fontFamily: display, fontSize: 82, color: NAVY_DEEP, fontWeight: 700, marginTop: 22, lineHeight: 1.1 }}>
            Aarav
            <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 500 }}> & </span>
            Meera
          </div>
          <div style={{ height: 2, width: "60%", margin: "26px auto", background: GOLD, opacity: 0.6 }} />
          <div style={{ fontFamily: body, fontSize: 28, color: "#33404F", fontWeight: 300, letterSpacing: 2 }}>
            14 · 12 · 2026 &nbsp;·&nbsp; JAIPUR
          </div>

          <div
            style={{
              marginTop: 40, display: "inline-grid", gridTemplateColumns: "repeat(8, 16px)", gap: 3,
              padding: 16, background: "#fff", borderRadius: 12, border: `2px solid ${NAVY_DEEP}`,
              opacity: qr, transform: `scale(${interpolate(qr, [0, 1], [0.7, 1])})`,
            }}
          >
            {cells.map((on, i) => (
              <div key={i} style={{ width: 16, height: 16, background: on ? NAVY_DEEP : "transparent", borderRadius: 2 }} />
            ))}
          </div>
          <div style={{ fontFamily: body, fontSize: 24, color: "#5A6A7A", marginTop: 16, letterSpacing: 1 }}>
            vowz.me/aarav-meera
          </div>
        </div>

        <div
          style={{
            marginTop: 56, padding: "20px 44px", borderRadius: 999,
            background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
            fontFamily: body, fontWeight: 600, fontSize: 32, color: NAVY_DEEP,
            opacity: spring({ frame: frame - 62, fps, config: { damping: 14 } }),
          }}
        >
          Share on WhatsApp
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};