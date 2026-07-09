import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Edit3,
  Share2,
  Users,
  Camera,
  CheckCircle2,
  ChevronRight,
  BookOpen,
} from "lucide-react";

interface GuideStep {
  icon: React.ElementType;
  title: string;
  description: string;
  tips: string[];
}

const steps: GuideStep[] = [
  {
    icon: Sparkles,
    title: "1. Create with the Wedding Wizard",
    description: "Answer a few questions about your wedding and get a complete site draft instantly.",
    tips: [
      "Share your love story — it becomes your 'Our Story' page",
      "Mention your cultural background for ceremony-specific events",
      "You can always edit everything later in the visual editor",
    ],
  },
  {
    icon: Edit3,
    title: "2. Customize Your Site",
    description: "Use the visual editor to tweak colors, photos, text, and layout to match your vision.",
    tips: [
      "Upload high-quality couple photos for the hero section",
      "Add all ceremony events with times and venues",
      "Premium users can use the AI assistant for quick content & theme changes",
    ],
  },
  {
    icon: Camera,
    title: "3. Add Photos & Gallery",
    description: "Upload your engagement, pre-wedding, or family photos to create a stunning gallery.",
    tips: [
      "Free plan supports up to 50 photos (100MB)",
      "Use landscape photos for the hero, portrait for the gallery",
      "Photos are automatically optimized for fast loading",
    ],
  },
  {
    icon: Users,
    title: "4. Set Up RSVPs",
    description: "Your RSVP form is ready out of the box. Guests can confirm attendance and select events.",
    tips: [
      "Track responses in real-time from this dashboard",
      "Guests can choose meal preferences and leave messages",
      "Export your guest list anytime from the RSVPs tab",
    ],
  },
  {
    icon: Share2,
    title: "5. Share & Publish",
    description: "Hit publish and share your site link or QR code with family and friends.",
    tips: [
      "Share the link via WhatsApp, email, or social media",
      "Generate QR codes for physical invites",
      "Your site works beautifully on every device",
    ],
  }
];

const GettingStartedGuide = () => {
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-foreground">Getting Started Guide</h3>
          <p className="font-body text-sm text-muted-foreground">Follow these steps to build your perfect wedding site</p>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => {
          const isExpanded = expandedStep === i;
          return (
            <motion.div
              key={i}
              className={`rounded-xl border transition-colors cursor-pointer ${
                isExpanded
                  ? "border-gold/40 bg-gradient-card shadow-card"
                  : "border-border/50 hover:border-border"
              }`}
              onClick={() => setExpandedStep(isExpanded ? null : i)}
              layout
            >
              <div className="flex items-center gap-4 p-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isExpanded ? "bg-gold/20" : "bg-muted"
                }`}>
                  <step.icon className={`w-4.5 h-4.5 ${isExpanded ? "text-gold" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-sm sm:text-base font-semibold text-foreground">{step.title}</h4>
                  {!isExpanded && (
                    <p className="font-body text-xs text-muted-foreground truncate">{step.description}</p>
                  )}
                </div>
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
              </div>

              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 pb-4"
                >
                  <p className="font-body text-sm text-muted-foreground mb-3 ml-13">{step.description}</p>
                  <div className="ml-13 space-y-2">
                    {step.tips.map((tip, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald mt-0.5 shrink-0" />
                        <span className="font-body text-xs sm:text-sm text-foreground/80">{tip}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GettingStartedGuide;
