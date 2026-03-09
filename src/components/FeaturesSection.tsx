import { motion } from "framer-motion";
import {
  Sparkles,
  Image,
  Calendar,
  Heart,
  QrCode,
  BarChart3,
  Globe,
  Video,
  Lock,
  Languages,
} from "lucide-react";

const freeFeatures = [
  { icon: Sparkles, title: "AI Wedding Wizard", desc: "Answer 5 questions, get a complete wedding site draft instantly" },
  { icon: Image, title: "50 Photo Gallery", desc: "Showcase your best moments with a beautiful, responsive gallery" },
  { icon: Calendar, title: "Event Schedule", desc: "Mehendi, Sangeet, Pheras — list all functions with maps & times" },
  { icon: Heart, title: "Our Story Page", desc: "Share your love story timeline with photos and milestones" },
  { icon: QrCode, title: "QR Code Invites", desc: "Generate shareable QR codes to replace traditional paper invites" },
  { icon: BarChart3, title: "RSVP & Analytics", desc: "Track responses, guest counts, and visitor stats in real time" },
];

const premiumFeatures = [
  { icon: Globe, title: "Custom Domain", desc: "Use your own domain like arjunandmeera.com" },
  { icon: Video, title: "Video Embeds", desc: "Add pre-wedding shoots and ceremony videos" },
  { icon: Lock, title: "Password Protection", desc: "Keep your site private with guest-only access" },
  { icon: Languages, title: "Multilingual", desc: "Auto-translate your site into Hindi, Tamil, and more" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => {
  return (
    <section className="py-16 sm:py-24 px-4 bg-gradient-warm" id="features">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-accent font-semibold font-body tracking-wider uppercase text-sm mb-3">
            Everything You Need
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Celebrate Every <span className="text-gradient-gold italic">Ritual</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-body">
            From traditional ceremonies to modern fusion celebrations, ShaadiSite has you covered.
          </p>
        </motion.div>

        {/* Free features */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {freeFeatures.map((f) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              className="bg-card rounded-xl p-6 shadow-card hover:shadow-elegant transition-shadow duration-300 border border-border/50"
            >
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">{f.desc}</p>
              <span className="inline-block mt-3 text-xs font-body font-semibold text-emerald bg-emerald/10 px-2 py-1 rounded-full">
                Free
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Premium features */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-accent font-semibold font-body tracking-wider uppercase text-sm">
            ✨ Premium Upgrades
          </p>
        </motion.div>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {premiumFeatures.map((f) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              className="bg-gradient-card rounded-xl p-5 border border-gold/20 hover:border-gold/40 transition-colors duration-300"
            >
              <f.icon className="w-5 h-5 text-gold mb-3" />
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-muted-foreground font-body text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
