import { motion } from "framer-motion";
import { Building2, User, MapPin, Mail, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";

const AboutUs = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="About Us – Vowz | AXPIR TECH"
      description="Vowz is a product of AXPIR TECH, founded by Anooj Xavier. We build beautiful digital wedding invitations and websites for couples in India and abroad."
      ogTitle="About Vowz – AXPIR TECH"
      ogDescription="Learn about the team behind Vowz – beautiful wedding websites made simple."
      ogImage="https://vowz.me/og-home.jpg"
      ogUrl="https://vowz.me/about"
      ogType="website"
      twitterCard="summary"
      canonical="https://vowz.me/about"
      robots="index, follow"
    />
    <Navbar />
    <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-accent font-semibold font-body tracking-wider uppercase text-sm mb-3">About Us</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
          The Story Behind <span className="text-gradient-gold italic">Vowz</span>
        </h1>
        <p className="text-muted-foreground font-body leading-relaxed mb-10 max-w-2xl">
          Vowz is built with one mission — to make every couple's wedding journey beautiful, personal, and effortless. From stunning digital invitations to full-featured wedding websites, we help you share your love story with the world.
        </p>
      </motion.div>

      <div className="space-y-6">
        {[
          {
            icon: Building2,
            label: "Company",
            value: "AXPIR Tech India LLP",
            description: "A technology company focused on building delightful digital experiences for life's most important moments.",
          },
          {
            icon: User,
            label: "Partner",
            value: "Anooj Xavier",
            description: "Passionate about design, technology, and making wedding planning stress-free for every couple.",
          },
          {
            icon: MapPin,
            label: "Registered Address",
            value: "1st Floor, CC 54,2593-5, Door No G-307, Bose Nagar Road, Elamkulam, Kochi, Ernakulam, Kerala - 682020",
          },
          {
            icon: Mail,
            label: "Email",
            value: "hi@vowz.me",
          },
          {
            icon: Phone,
            label: "Support",
            value: "+91 8111852030",
          },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border/50 shadow-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
          >
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <item.icon className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-body text-sm text-muted-foreground">{item.label}</p>
              <p className="font-body font-medium text-foreground">{item.value}</p>
              {item.description && (
                <p className="font-body text-sm text-muted-foreground mt-1">{item.description}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

export default AboutUs;
