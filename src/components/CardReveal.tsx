import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { REVEAL_HINTS, type RevealType } from "@/lib/card-templates";

interface Props {
  reveal: RevealType;
  /** Card palette so the opening act matches the design. */
  bg: string;
  panel: string;
  ink: string;
  accent: string;
  coupleNames?: string;
  /** Render the card itself. */
  children: React.ReactNode;
  onRevealed?: () => void;
  className?: string;
}

/**
 * LUXE opening act. The guest performs one small gesture — pull a rope, ring a
 * bell, break a wax seal, part a curtain — and the invitation is revealed.
 * Fully keyboard operable, with a skip control and reduced-motion support.
 */
export default function CardReveal({
  reveal, bg, panel, ink, accent, coupleNames, children, onRevealed, className,
}: Props) {
  const [stage, setStage] = useState<"closed" | "opening" | "open">("closed");
  const reduce = useReducedMotion();

  useEffect(() => {
    if (stage !== "opening") return;
    const t = setTimeout(() => setStage("open"), reduce ? 200 : 1500);
    return () => clearTimeout(t);
  }, [stage, reduce]);

  useEffect(() => {
    if (stage === "open") onRevealed?.();
  }, [stage, onRevealed]);

  const open = () => stage === "closed" && setStage("opening");
  const lit = stage !== "closed";

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`} style={{ backgroundColor: bg }}>
      {/* The invitation underneath */}
      <div
        className="transition-opacity duration-700"
        style={{ opacity: stage === "open" ? 1 : 0 }}
        aria-hidden={stage !== "open"}
      >
        {children}
      </div>

      <AnimatePresence>
        {stage !== "open" && (
          <motion.div
            key="curtain"
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: bg }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.7 }}
          >
            {coupleNames && (
              <p
                className="font-display text-sm sm:text-base tracking-[0.4em] uppercase mb-6 sm:mb-10 text-center px-6"
                style={{ color: accent, opacity: 0.9 }}
              >
                {coupleNames}
              </p>
            )}

            <button
              type="button"
              onClick={open}
              disabled={stage !== "closed"}
              aria-label={REVEAL_HINTS[reveal]}
              className="group relative outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-2xl"
              style={{ ["--tw-ring-color" as any]: accent }}
            >
              {reveal === "rope" && <RopeScene lit={lit} accent={accent} ink={ink} reduce={!!reduce} />}
              {reveal === "bell" && <BellScene rung={lit} accent={accent} ink={ink} reduce={!!reduce} />}
              {reveal === "envelope" && <EnvelopeScene opened={lit} accent={accent} ink={ink} panel={panel} reduce={!!reduce} />}
              {reveal === "curtain" && <CurtainScene parted={lit} accent={accent} ink={ink} reduce={!!reduce} />}
            </button>

            <motion.p
              className="mt-6 sm:mt-8 font-body text-xs sm:text-sm tracking-widest uppercase text-center px-6"
              style={{ color: ink, opacity: 0.75 }}
              animate={reduce || lit ? {} : { opacity: [0.35, 0.85, 0.35] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            >
              {lit ? "Opening…" : REVEAL_HINTS[reveal]}
            </motion.p>

            <button
              type="button"
              onClick={() => setStage("open")}
              className="mt-4 font-body text-[11px] underline underline-offset-4"
              style={{ color: ink, opacity: 0.5 }}
            >
              Skip the opening
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Scenes ────────────────────────────────────────────────────── */

function RopeScene({ lit, accent, ink, reduce }: { lit: boolean; accent: string; ink: string; reduce: boolean }) {
  return (
    <svg viewBox="0 0 200 240" width={220} height={264} role="img" aria-hidden="true">
      <defs>
        <radialGradient id="glow" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor={accent} stopOpacity={lit ? 0.55 : 0.06} />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="200" height="240" fill="url(#glow)" />
      {/* archway */}
      <path d="M25 230 V110 Q100 20 175 110 V230" fill="none" stroke={ink} strokeOpacity={0.25} strokeWidth="1.5" />
      {/* hanging lamps */}
      {[45, 100, 155].map((x, i) => (
        <g key={x}>
          <line x1={x} y1={i === 1 ? 46 : 86} x2={x} y2={i === 1 ? 74 : 112} stroke={ink} strokeOpacity={0.35} strokeWidth="1" />
          <motion.g
            animate={reduce ? {} : { y: lit ? [0, -2, 0] : 0 }}
            transition={{ duration: 2, repeat: lit ? Infinity : 0 }}
          >
            <path
              d={`M${x - 12} ${i === 1 ? 74 : 112} q12 -18 24 0 q-4 26 -12 30 q-8 -4 -12 -30 z`}
              fill={accent}
              fillOpacity={lit ? 0.9 : 0.18}
              stroke={accent}
              strokeOpacity={0.7}
            />
            <circle cx={x} cy={(i === 1 ? 74 : 112) + 14} r={lit ? 16 : 0} fill={accent} fillOpacity={0.18} />
          </motion.g>
        </g>
      ))}
      {/* rope */}
      <motion.g animate={{ y: lit ? 16 : 0 }} transition={{ type: "spring", stiffness: 220, damping: 12 }}>
        <line x1="100" y1="150" x2="100" y2="212" stroke={ink} strokeOpacity={0.55} strokeWidth="2.5" strokeDasharray="5 3" />
        <circle cx="100" cy="218" r="9" fill={accent} fillOpacity={0.85} />
      </motion.g>
    </svg>
  );
}

function BellScene({ rung, accent, ink, reduce }: { rung: boolean; accent: string; ink: string; reduce: boolean }) {
  return (
    <svg viewBox="0 0 200 220" width={210} height={231} role="img" aria-hidden="true">
      <line x1="40" y1="30" x2="160" y2="30" stroke={ink} strokeOpacity={0.3} strokeWidth="2" />
      <line x1="100" y1="30" x2="100" y2="58" stroke={ink} strokeOpacity={0.4} strokeWidth="2" />
      <motion.g
        style={{ originX: "100px", originY: "40px" }}
        animate={reduce ? {} : rung ? { rotate: [0, 14, -11, 8, -5, 0] } : { rotate: 0 }}
        transition={{ duration: 1.4 }}
      >
        <path d="M100 58 q-38 12 -38 66 h76 q0 -54 -38 -66 z" fill={accent} fillOpacity={rung ? 0.95 : 0.6} stroke={accent} />
        <rect x="56" y="124" width="88" height="9" rx="4" fill={accent} />
        <circle cx="100" cy="144" r="8" fill={accent} fillOpacity={0.85} />
      </motion.g>
      {rung && !reduce && [1, 2].map((i) => (
        <motion.circle
          key={i}
          cx="100" cy="100" r="50" fill="none" stroke={accent} strokeWidth="1"
          initial={{ opacity: 0.5, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 1.2, delay: i * 0.25 }}
          style={{ originX: "100px", originY: "100px" }}
        />
      ))}
    </svg>
  );
}

function EnvelopeScene({ opened, accent, ink, panel, reduce }: { opened: boolean; accent: string; ink: string; panel: string; reduce: boolean }) {
  return (
    <svg viewBox="0 0 240 170" width={250} height={177} role="img" aria-hidden="true">
      <rect x="10" y="30" width="220" height="130" rx="6" fill={panel} stroke={ink} strokeOpacity={0.25} />
      {/* letter sliding out */}
      <motion.rect
        x="34" y="46" width="172" height="104" rx="4"
        fill={panel} stroke={accent} strokeOpacity={0.6}
        animate={{ y: opened ? -18 : 46, opacity: opened ? 1 : 0.65 }}
        transition={{ duration: reduce ? 0.2 : 0.9, delay: opened ? 0.35 : 0 }}
      />
      {/* flap */}
      <motion.path
        d="M10 36 L120 108 L230 36 Z"
        fill={panel} stroke={ink} strokeOpacity={0.3}
        style={{ originX: "120px", originY: "36px" }}
        animate={{ rotateX: opened ? 180 : 0 }}
        transition={{ duration: reduce ? 0.2 : 0.7 }}
      />
      {/* wax seal */}
      <motion.g animate={{ scale: opened ? 0.2 : 1, opacity: opened ? 0 : 1 }} transition={{ duration: 0.5 }} style={{ originX: "120px", originY: "104px" }}>
        <circle cx="120" cy="104" r="22" fill={accent} />
        <circle cx="120" cy="104" r="16" fill="none" stroke={ink} strokeOpacity={0.35} />
        <text x="120" y="111" textAnchor="middle" fontSize="16" fontFamily="serif" fill={panel}>&amp;</text>
      </motion.g>
    </svg>
  );
}

function CurtainScene({ parted, accent, ink, reduce }: { parted: boolean; accent: string; ink: string; reduce: boolean }) {
  const dur = reduce ? 0.2 : 1.2;
  return (
    <svg viewBox="0 0 240 200" width={250} height={208} role="img" aria-hidden="true">
      <rect x="0" y="0" width="240" height="14" rx="4" fill={accent} fillOpacity={0.85} />
      <rect x="20" y="20" width="200" height="170" fill={ink} fillOpacity={0.06} />
      {[0, 1].map((side) => (
        <motion.g
          key={side}
          animate={{ x: parted ? (side === 0 ? -96 : 96) : 0 }}
          transition={{ duration: dur, ease: "easeInOut" }}
        >
          <path
            d={side === 0 ? "M0 14 H120 V200 H0 Z" : "M120 14 H240 V200 H120 Z"}
            fill={accent}
            fillOpacity={0.22}
          />
          {Array.from({ length: 6 }).map((_, i) => {
            const x = side === 0 ? 8 + i * 20 : 128 + i * 20;
            return <line key={i} x1={x} y1="16" x2={x} y2="198" stroke={accent} strokeOpacity={0.5} strokeWidth="2" />;
          })}
        </motion.g>
      ))}
    </svg>
  );
}
