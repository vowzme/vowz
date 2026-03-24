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
  Timer,
  MessageSquareHeart,
  IndianRupee,
  ClipboardList,
  Vote,
  Leaf,
  Bot,
  Palette,
} from "lucide-react";

const allFeatures = [
  { icon: Sparkles, title: "Easy Wedding Wizard", desc: "Answer a few simple questions and get a complete wedding site draft instantly" },
  { icon: Image, title: "Photo Gallery", desc: "Showcase your best moments with a beautiful, responsive photo gallery" },
  { icon: Calendar, title: "Event Schedule", desc: "Mehendi, Sangeet, Pheras — list all functions with maps & times" },
  { icon: Heart, title: "Our Story & Couple Profiles", desc: "Share your love story and add individual bride & groom profiles with photos" },
  { icon: QrCode, title: "QR Code Invites", desc: "Generate branded QR codes to replace traditional paper invites" },
  { icon: BarChart3, title: "RSVP & Analytics", desc: "Track responses, guest counts, meal preferences & visitor stats" },
  { icon: Timer, title: "Countdown Timer", desc: "Build excitement with a live countdown to your wedding day" },
  { icon: MessageSquareHeart, title: "Guestbook & Blessings", desc: "Let guests leave heartfelt messages, photos, and blessings" },
  { icon: IndianRupee, title: "Budget & Expense Tracker", desc: "Set a budget, log expenses across categories, and track spending" },
  { icon: ClipboardList, title: "Wedding Checklist", desc: "Pre-seeded task list to keep your wedding planning on track" },
  { icon: Vote, title: "Guest Polls", desc: "Gather guest feedback on music, food & more with interactive polls" },
  { icon: Globe, title: "Custom Domain", desc: "Connect your own domain like arjunandmeera.com with guided DNS setup" },
  { icon: Bot, title: "AI Editor Assistant", desc: "AI-powered theme suggestions, content writing & cultural advice" },
  { icon: Video, title: "Video Embeds", desc: "Add pre-wedding shoots and ceremony videos from YouTube or Vimeo" },
  { icon: Lock, title: "Password Protection", desc: "Keep your site private with guest-only access" },
  { icon: Languages, title: "Multilingual Support", desc: "Auto-translate your site into Hindi, Tamil, Spanish and more" },
  { icon: Palette, title: "35+ Beautiful Templates", desc: "Choose from elegant Indian, modern minimalist, and global wedding themes" },
  { icon: Leaf, title: "Eco Wedding Tips", desc: "Showcase your green wedding commitments with a dedicated section" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
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
            From traditional ceremonies to modern fusion celebrations, Vowz has you covered.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {allFeatures.map((f) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-card rounded-xl p-6 shadow-card hover:shadow-elegant transition-shadow duration-300 border border-border/50 group"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center mb-4 shadow-gold group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <f.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
