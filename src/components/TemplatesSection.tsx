import { motion } from "framer-motion";

const templates = [
  { name: "Royal Maroon", colors: ["#6B1D2A", "#D4A853", "#FFF5E6"], style: "Traditional", couple: "Arjun & Meera" },
  { name: "Pastel Bloom", colors: ["#E8D5E0", "#F5E6CC", "#C8E6C0"], style: "Fusion", couple: "James & Sofia" },
  { name: "Golden Mandala", colors: ["#2C1810", "#D4A853", "#F0E6D2"], style: "Traditional", couple: "Ravi & Anita" },
  { name: "Sage & Ivory", colors: ["#8B9D77", "#F5F0E8", "#D4C5A9"], style: "Eco-Friendly", couple: "David & Grace" },
  { name: "Lavender Dream", colors: ["#9B8EC4", "#F0E8F5", "#D4A853"], style: "Fusion", couple: "Omar & Ayesha" },
  { name: "Kerala Spice", colors: ["#1A4D2E", "#D4A853", "#FFF5E6"], style: "Regional", couple: "Zain & Fatima" },
];

const TemplatesSection = () => {
  return (
    <section className="py-24 px-4" id="templates">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-accent font-semibold font-body tracking-wider uppercase text-sm mb-3">
            20+ Templates
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Themes for Every <span className="text-gradient-gold italic">Tradition</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-body">
            Traditional, fusion, eco-friendly, and regional — all free to start.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative rounded-xl overflow-hidden shadow-card hover:shadow-elegant transition-all duration-300 border border-border/50">
                {/* Template preview */}
                <div
                  className="h-48 relative"
                  style={{
                    background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})`,
                  }}
                >
                  {/* Decorative mandala pattern */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <svg viewBox="0 0 200 200" className="w-32 h-32">
                      <circle cx="100" cy="100" r="80" fill="none" stroke={t.colors[2]} strokeWidth="0.5" />
                      <circle cx="100" cy="100" r="60" fill="none" stroke={t.colors[2]} strokeWidth="0.5" />
                      <circle cx="100" cy="100" r="40" fill="none" stroke={t.colors[2]} strokeWidth="0.5" />
                      {[...Array(12)].map((_, j) => (
                        <line
                          key={j}
                          x1="100"
                          y1="20"
                          x2="100"
                          y2="180"
                          stroke={t.colors[2]}
                          strokeWidth="0.3"
                          transform={`rotate(${j * 30} 100 100)`}
                        />
                      ))}
                    </svg>
                  </div>
                  {/* Sample text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <p className="font-display text-sm tracking-widest uppercase mb-1" style={{ color: t.colors[2] + "99" }}>
                      You're Invited
                    </p>
                    <p className="font-display text-2xl font-bold" style={{ color: t.colors[2] }}>
                      {t.couple}
                    </p>
                    <p className="font-body text-xs mt-2" style={{ color: t.colors[2] + "80" }}>
                      December 15, 2026
                    </p>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary-foreground bg-primary/80 backdrop-blur-sm px-4 py-2 rounded-full font-body text-sm font-medium">
                      Use Template
                    </span>
                  </div>
                </div>
                {/* Info bar */}
                <div className="p-4 bg-card flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">{t.name}</h3>
                    <p className="text-xs text-muted-foreground font-body">{t.style}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {t.colors.map((c, j) => (
                      <div
                        key={j}
                        className="w-5 h-5 rounded-full border border-border/50"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TemplatesSection;
