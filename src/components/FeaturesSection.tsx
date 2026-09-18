import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Music,
  Users,
  Radio,
  FileDown,
  Gift,
  Link2,
  Clock,
  Crown,

  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  { icon: Bot, title: "AI Editor Assistant", desc: "AI-powered theme suggestions, content writing & cultural advice" },
  { icon: Video, title: "Video Embeds", desc: "Add pre-wedding shoots and ceremony videos from YouTube or Vimeo" },
  { icon: Lock, title: "Password Protection", desc: "Keep your site private with guest-only access" },
  { icon: Languages, title: "Multilingual Support", desc: "Auto-translate your site into Hindi, Tamil, Spanish and more" },
  { icon: Palette, title: "35+ Beautiful Templates", desc: "Choose from elegant Indian, modern minimalist, and global wedding themes" },
  { icon: Leaf, title: "Eco Wedding Tips", desc: "Showcase your green wedding commitments with a dedicated section" },
  { icon: Music, title: "Background Music", desc: "Curated romantic, cinematic & cultural tracks — pick a soundtrack guests hear when they open your site" },
  { icon: Users, title: "Family Collaboration", desc: "Invite parents & siblings to help edit, or share a read-only preview link before you go live" },
  { icon: Radio, title: "Livestream Embed", desc: "Broadcast your ceremony live for guests who can't attend — YouTube, Zoom or custom stream" },
  { icon: FileDown, title: "Invitation Cards & PDF", desc: "Design digital invitation cards with 30+ templates and export high-res PDFs to share on WhatsApp" },
  { icon: Crown, title: "Opening Reveal Cards", desc: "Top-tier cards that open with a gesture — light the lamps, ring the bell, break the wax seal or part the curtain" },

  { icon: Gift, title: "Gift Registry", desc: "Share your wishlist, UPI ID or bank details so guests can send blessings your way" },
  { icon: Link2, title: "Custom URL Slug", desc: "Pick a memorable link like vowz.me/site/rahul-sona — old links auto-redirect if you change it" },
  { icon: Clock, title: "Timezone-Aware Events", desc: "Show event times in each guest's local timezone — no more confused overseas cousins" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const VISIBLE_COUNT = 6;

const FeaturesSection = () => {
  const [showAll, setShowAll] = useState(false);
  const visibleFeatures = showAll ? allFeatures : allFeatures.slice(0, VISIBLE_COUNT);

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
          <AnimatePresence mode="popLayout">
            {visibleFeatures.map((f) => (
              <motion.div
                key={f.title}
                layout
                variants={itemVariants}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-card rounded-xl p-5 sm:p-6 shadow-card hover:shadow-elegant transition-shadow duration-300 border border-border/50 group"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center mb-4 shadow-gold group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <f.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {allFeatures.length > VISIBLE_COUNT && (
          <div className="flex justify-center mt-12">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowAll((s) => !s)}
              className="rounded-full border-gold/40 hover:bg-gold/10 hover:border-gold/60 px-8 font-body"
              aria-expanded={showAll}
            >
              {showAll ? (
                <>
                  Show less <ChevronUp className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  View all features <ChevronDown className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturesSection;
