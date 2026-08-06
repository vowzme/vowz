import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { display, body, GOLD, GOLD_LIGHT, IVORY, NAVY_DEEP } from "../theme";
import { Backdrop } from "../components/Backdrop";
import { Eyebrow } from "../components/Bits";

const ITEMS = [
  { t: "RSVP that actually works", d: "Meals, dietary tags, plus-ones" },
  { t: "WhatsApp invites", d: "Per-guest links, one tap to share" },
  { t: "Live photo album", d: "Guests upload, you moderate" },
  { t: "Budget & checklist", d: "Reminders, exports, calendar sync" },
  { t: "QR invitation cards", d: "Print-ready PDF in one click" },
];

export const Scene3Features: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 4, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ padding: "170px 80px", justifyContent: "flex-start" }}>
        <Eyebrow delay={2} font={body}>
          One platform
        </Eyebrow>
        <div
          style={{
            marginTop: 20, opacity: head, transform: `translateY(${interpolate(head, [0, 1], [34, 0])}px)`,
            fontFamily: display, fontSize: 96, color: IVORY, fontWeight: 700, lineHeight: 1.05,
          }}
        >
          Everything the
          <br />
          <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 500 }}>big day needs</span>
        </div>

        <div style={{ marginTop: 80, display: "flex", flexDirection: "column", gap: 26 }}>
          {ITEMS.map((it, i) => {
            const s = spring({ frame: frame - 30 - i * 11, fps, config: { damping: 20, stiffness: 120 } });
            return (
              <div
                key={it.t}
                style={{
                  opacity: s,
                  transform: `translateX(${interpolate(s, [0, 1], [-90, 0])}px)`,
                  display: "flex", alignItems: "center", gap: 28,
                  padding: "26px 32px", borderRadius: 20,
                  background: "rgba(245,245,220,0.05)",
                  border: "1px solid rgba(212,175,55,0.3)",
                }}
              >
                <div
                  style={{
                    width: 58, height: 58, borderRadius: 14, flexShrink: 0,
                    background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: body, fontWeight: 600, fontSize: 28, color: NAVY_DEEP,
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontFamily: display, fontSize: 44, color: IVORY, fontWeight: 700, lineHeight: 1.15 }}>{it.t}</div>
                  <div style={{ fontFamily: body, fontSize: 28, color: "rgba(245,245,220,0.6)", fontWeight: 300, marginTop: 4 }}>
                    {it.d}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};