import { motion } from "framer-motion";
import { Heart, User } from "lucide-react";

interface CoupleProfilesProps {
  data: {
    heading?: string;
    partner1Name?: string;
    partner1Bio?: string;
    partner1Photo?: string;
    partner2Name?: string;
    partner2Bio?: string;
    partner2Photo?: string;
  };
  accent: string;
  bg: string;
  light: string;
}

export function CoupleProfilesPublic({ data, accent, bg, light }: CoupleProfilesProps) {
  const profiles = [
    { name: data.partner1Name || "Partner 1", bio: data.partner1Bio, photo: data.partner1Photo },
    { name: data.partner2Name || "Partner 2", bio: data.partner2Bio, photo: data.partner2Photo },
  ];

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-foreground mb-2"
          style={{ fontFamily: "var(--font-display, 'Cormorant Garamond'), serif" }}
        >
          {data.heading || "Meet the Couple"}
        </motion.h2>
        <div className="w-12 h-0.5 mx-auto mb-10" style={{ backgroundColor: accent }} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {profiles.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="flex flex-col items-center"
            >
              <div
                className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden mb-5 border-4 shadow-lg"
                style={{ borderColor: accent }}
              >
                {p.photo ? (
                  <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
                    <User className="w-16 h-16" style={{ color: `${accent}40` }} />
                  </div>
                )}
              </div>
              <h3
                className="text-2xl font-bold text-foreground mb-2"
                style={{ fontFamily: "var(--font-display, 'Cormorant Garamond'), serif" }}
              >
                {p.name}
              </h3>
              {p.bio && (
                <p
                  className="text-muted-foreground leading-relaxed max-w-xs mx-auto"
                  style={{ fontFamily: "var(--font-body, 'DM Sans'), sans-serif" }}
                >
                  {p.bio}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Heart className="w-8 h-8 mx-auto" style={{ color: accent }} fill="currentColor" />
        </motion.div>
      </div>
    </section>
  );
}
