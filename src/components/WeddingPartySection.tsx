import { motion } from "framer-motion";
import { User, Instagram } from "lucide-react";

export interface PartyMember {
  name?: string;
  role?: string;
  side?: string;
  note?: string;
  photo?: string;
  social?: string;
}

interface WeddingPartyProps {
  data: {
    heading?: string;
    description?: string;
    members?: PartyMember[];
  };
  accent: string;
  bg?: string;
  light?: string;
}

const SIDE_ORDER = ["Bride's side", "Groom's side", "Family", "Friends"];

export function WeddingPartyPublic({ data, accent }: WeddingPartyProps) {
  const members = (data.members || []).filter((m) => (m?.name || "").trim().length > 0);
  if (members.length === 0) return null;

  const groups = new Map<string, PartyMember[]>();
  members.forEach((m) => {
    const key = (m.side || "").trim() || "Wedding party";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  });
  const ordered = [...groups.entries()].sort(
    (a, b) => (SIDE_ORDER.indexOf(a[0]) + 1 || 99) - (SIDE_ORDER.indexOf(b[0]) + 1 || 99)
  );

  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-foreground mb-2"
          style={{ fontFamily: "var(--font-display, 'Cormorant Garamond'), serif" }}
        >
          {data.heading || "Our Wedding Party"}
        </motion.h2>
        <div className="w-12 h-0.5 mx-auto mb-4" style={{ backgroundColor: accent }} />
        {data.description && (
          <p
            className="text-muted-foreground max-w-xl mx-auto mb-10"
            style={{ fontFamily: "var(--font-body, 'DM Sans'), sans-serif" }}
          >
            {data.description}
          </p>
        )}

        <div className="space-y-10">
          {ordered.map(([side, list]) => (
            <div key={side}>
              {ordered.length > 1 && (
                <p
                  className="text-sm uppercase tracking-[0.2em] mb-5"
                  style={{ color: accent, fontFamily: "var(--font-body, 'DM Sans'), sans-serif" }}
                >
                  {side}
                </p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {list.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(i * 0.08, 0.4) }}
                    className="flex flex-col items-center"
                  >
                    <div
                      className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-3 border-2 shadow-md"
                      style={{ borderColor: accent }}
                    >
                      {p.photo ? (
                        <img src={p.photo} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: `${accent}15` }}
                        >
                          <User className="w-10 h-10" style={{ color: `${accent}40` }} />
                        </div>
                      )}
                    </div>
                    <h3
                      className="text-lg font-semibold text-foreground"
                      style={{ fontFamily: "var(--font-display, 'Cormorant Garamond'), serif" }}
                    >
                      {p.name}
                    </h3>
                    {p.role && (
                      <p className="text-xs uppercase tracking-wider mt-0.5" style={{ color: accent }}>
                        {p.role}
                      </p>
                    )}
                    {p.note && (
                      <p
                        className="text-sm text-muted-foreground mt-1.5 leading-relaxed"
                        style={{ fontFamily: "var(--font-body, 'DM Sans'), sans-serif" }}
                      >
                        {p.note}
                      </p>
                    )}
                    {p.social && (
                      <a
                        href={p.social}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs underline underline-offset-2 opacity-75 hover:opacity-100"
                        style={{ color: accent }}
                      >
                        <Instagram className="w-3.5 h-3.5" /> Profile
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
