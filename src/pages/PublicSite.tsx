import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Calendar, MapPin, Mail, User, Users, Utensils, MessageSquare, Check, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Lightbox from "@/components/Lightbox";
import type { GalleryPhoto } from "@/hooks/use-gallery-photos";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────────────
interface WeddingSite {
  id: string;
  partner1: string;
  partner2: string;
  cultural_background: string;
  how_we_met: string;
  theme: string;
  tagline: string;
  suggested_colors: string[];
  sections: any[];
  slug: string;
  is_published: boolean;
}

// ─── RSVP Validation ──────────────────────────────────────────────────
const rsvpSchema = z.object({
  guest_name: z.string().trim().min(1, "Name is required").max(100),
  guest_email: z.string().trim().email("Invalid email").max(255),
  attending: z.boolean(),
  guest_count: z.number().int().min(1).max(20),
  meal_preference: z.string().max(50).nullable(),
  selected_events: z.array(z.string()).nullable(),
  message: z.string().trim().max(500).nullable(),
});

// ─── Page Component ───────────────────────────────────────────────────
const PublicSite = () => {
  const { slug } = useParams<{ slug: string }>();
  const [site, setSite] = useState<WeddingSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("wedding_sites")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setSite(data as any);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (notFound || !site) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Site Not Found</h1>
          <p className="text-muted-foreground font-body mb-6">
            This wedding site doesn't exist or hasn't been published yet.
          </p>
          <Button variant="outline" asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const colors = (site.suggested_colors as string[]) || ["#6B1D2A", "#D4A853", "#FFF5E6"];
  const [bg, accent, light] = colors.length >= 3 ? colors : ["#6B1D2A", "#D4A853", "#FFF5E6"];
  const sections = (site.sections as any[]) || [];

  return (
    <div className="min-h-screen bg-background">
      {sections.filter((s) => s.visible !== false).map((section) => (
        <PublicSection key={section.id} section={section} site={site} bg={bg} accent={accent} light={light} />
      ))}
      {/* Footer */}
      <footer className="py-8 text-center border-t border-border/30">
        <p className="text-xs text-muted-foreground font-body">
          Made with <Heart className="w-3 h-3 inline text-gold" fill="currentColor" /> on ShaadiSite
        </p>
      </footer>
    </div>
  );
};

// ─── Public Section Renderer ──────────────────────────────────────────
function PublicSection({
  section,
  site,
  bg,
  accent,
  light,
}: {
  section: any;
  site: WeddingSite;
  bg: string;
  accent: string;
  light: string;
}) {
  const { type, data } = section;

  if (type === "hero") return <HeroSection data={data} bg={bg} accent={accent} light={light} />;
  if (type === "story") return <StorySection data={data} accent={accent} />;
  if (type === "events") return <EventsSection data={data} accent={accent} />;
  if (type === "gallery") return <GallerySection data={data} accent={accent} />;
  if (type === "rsvp") return <RsvpSection data={data} site={site} bg={bg} accent={accent} />;
  if (type === "custom") return <StorySection data={data} accent={accent} />;

  return null;
}

// ─── Hero ─────────────────────────────────────────────────────────────
function HeroSection({ data, bg, accent, light }: { data: any; bg: string; accent: string; light: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative py-28 md:py-40 px-6 text-center overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${bg}, ${bg}dd)` }}
    >
      <div className="absolute inset-0 opacity-10">
        <svg viewBox="0 0 400 400" className="w-full h-full">
          {[...Array(8)].map((_, i) => (
            <circle key={i} cx="200" cy="200" r={50 + i * 30} fill="none" stroke={light} strokeWidth="0.5" />
          ))}
        </svg>
      </div>
      <div className="relative z-10 max-w-3xl mx-auto">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}>
          <Heart className="w-10 h-10 mx-auto mb-5" style={{ color: accent }} fill="currentColor" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="font-body text-sm tracking-[0.3em] uppercase mb-4"
          style={{ color: `${light}99` }}
        >
          {data.subheading || "You're Invited to the Wedding of"}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="font-display text-5xl md:text-7xl font-bold mb-4"
          style={{ color: light }}
        >
          {data.heading}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="font-display text-xl md:text-2xl italic"
          style={{ color: accent }}
        >
          {data.tagline}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8"
        >
          <ChevronDown className="w-6 h-6 mx-auto animate-bounce" style={{ color: `${light}60` }} />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Story ────────────────────────────────────────────────────────────
function StorySection({ data, accent }: { data: any; accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="bg-card py-16 md:py-20 px-6"
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
          {data.heading}
        </h2>
        <div className="w-14 h-0.5 mx-auto mb-8" style={{ backgroundColor: accent }} />
        <p className="text-muted-foreground font-body text-lg leading-relaxed whitespace-pre-wrap">
          {data.body}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Events ───────────────────────────────────────────────────────────
function EventsSection({ data, accent }: { data: any; accent: string }) {
  const events = data.events || [];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="py-16 md:py-20 px-6"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center mb-3">
          {data.heading}
        </h2>
        <div className="w-14 h-0.5 mx-auto mb-10" style={{ backgroundColor: accent }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border border-border/50 rounded-2xl p-6 text-center bg-card hover:shadow-elegant transition-shadow"
            >
              <div
                className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${accent}20` }}
              >
                <Calendar className="w-6 h-6" style={{ color: accent }} />
              </div>
              <p className="font-display text-lg font-semibold text-foreground mb-1">{event.name}</p>
              {event.date && <p className="text-sm text-muted-foreground font-body">{event.date}</p>}
              {event.time && <p className="text-sm text-muted-foreground font-body">{event.time}</p>}
              {event.venue && (
                <p className="text-sm text-muted-foreground font-body flex items-center justify-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {event.venue}
                </p>
              )}
              {!event.date && !event.time && (
                <p className="text-sm text-muted-foreground font-body">Date & time TBD</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────
function GallerySection({ data, accent }: { data: any; accent: string }) {
  const photos: GalleryPhoto[] = data.photos || [];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="bg-card py-16 md:py-20 px-6"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center mb-3">
          {data.heading || "Our Moments"}
        </h2>
        <div className="w-14 h-0.5 mx-auto mb-10" style={{ backgroundColor: accent }} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo, i) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setLightboxIndex(i)}
            >
              <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
            </motion.div>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={photos}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── RSVP Form ────────────────────────────────────────────────────────
function RsvpSection({ data, site, bg, accent }: { data: any; site: WeddingSite; bg: string; accent: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    guest_name: "",
    guest_email: "",
    attending: true,
    guest_count: 1,
    meal_preference: "veg",
    selected_events: [] as string[],
    message: "",
  });

  // Extract event names from sections for checkboxes
  const eventsSection = (site.sections as any[])?.find((s) => s.type === "events");
  const eventNames: string[] = eventsSection?.data?.events?.map((e: any) => e.name) || [];

  const handleToggleEvent = (name: string) => {
    setForm((prev) => ({
      ...prev,
      selected_events: prev.selected_events.includes(name)
        ? prev.selected_events.filter((e) => e !== name)
        : [...prev.selected_events, name],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const validated = rsvpSchema.parse({
        ...form,
        message: form.message || null,
        selected_events: form.selected_events.length > 0 ? form.selected_events : null,
        meal_preference: form.meal_preference || null,
      });

      const { error } = await supabase.from("rsvps").insert({
        wedding_site_id: site.id,
        guest_name: validated.guest_name,
        guest_email: validated.guest_email,
        attending: validated.attending,
        guest_count: validated.guest_count,
        meal_preference: validated.meal_preference,
        selected_events: validated.selected_events as any,
        message: validated.message,
      });

      if (error) throw error;
      setSubmitted(true);
      toast({ title: "RSVP submitted! 🎉" });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast({ title: "Please check your details", description: err.errors[0]?.message, variant: "destructive" });
      } else {
        toast({ title: "Failed to submit RSVP", description: err.message, variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="py-16 md:py-20 px-6"
      style={{ background: `linear-gradient(135deg, ${bg}08, ${accent}08)` }}
    >
      <div className="max-w-lg mx-auto text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
          {data.heading || "Join Us"}
        </h2>
        <div className="w-14 h-0.5 mx-auto mb-4" style={{ backgroundColor: accent }} />
        <p className="text-muted-foreground font-body mb-8">
          {data.body || "We'd love to have you celebrate with us!"}
        </p>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border/50 rounded-2xl p-8"
          >
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
              <Check className="w-7 h-7" style={{ color: accent }} />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">Thank you!</h3>
            <p className="text-muted-foreground font-body">
              Your RSVP has been received. We can't wait to celebrate with you!
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 text-left space-y-5">
            {/* Name */}
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" /> Your Name
              </label>
              <Input
                placeholder="Enter your full name"
                value={form.guest_name}
                onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                required
                maxLength={100}
                className="font-body"
              />
            </div>

            {/* Email */}
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={form.guest_email}
                onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
                required
                maxLength={255}
                className="font-body"
              />
            </div>

            {/* Attending */}
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-2 block">Will you attend?</label>
              <div className="flex gap-3">
                {[
                  { label: "Joyfully Accept", value: true },
                  { label: "Regretfully Decline", value: false },
                ].map(({ label, value }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setForm({ ...form, attending: value })}
                    className={`flex-1 py-2.5 rounded-xl font-body text-sm border transition-colors ${
                      form.attending === value
                        ? "border-gold bg-gold/10 text-foreground font-medium"
                        : "border-border/50 text-muted-foreground hover:border-border"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {form.attending && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-5"
              >
                {/* Guest count */}
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" /> Number of Guests
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={form.guest_count}
                    onChange={(e) => setForm({ ...form, guest_count: parseInt(e.target.value) || 1 })}
                    className="font-body w-24"
                  />
                </div>

                {/* Meal preference */}
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-muted-foreground" /> Meal Preference
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["veg", "non-veg", "vegan", "no preference"].map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => setForm({ ...form, meal_preference: pref })}
                        className={`px-4 py-2 rounded-xl font-body text-sm border capitalize transition-colors ${
                          form.meal_preference === pref
                            ? "border-gold bg-gold/10 text-foreground font-medium"
                            : "border-border/50 text-muted-foreground hover:border-border"
                        }`}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event selection */}
                {eventNames.length > 0 && (
                  <div>
                    <label className="font-body text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Which events will you attend?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {eventNames.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => handleToggleEvent(name)}
                          className={`px-4 py-2 rounded-xl font-body text-sm border transition-colors ${
                            form.selected_events.includes(name)
                              ? "border-gold bg-gold/10 text-foreground font-medium"
                              : "border-border/50 text-muted-foreground hover:border-border"
                          }`}
                        >
                          {form.selected_events.includes(name) && <Check className="w-3 h-3 inline mr-1" />}
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Message */}
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" /> Message (optional)
              </label>
              <Textarea
                placeholder="Any wishes or notes for the couple..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                maxLength={500}
                rows={3}
                className="font-body"
              />
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full font-body"
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                "Send RSVP"
              )}
            </Button>
          </form>
        )}
      </div>
    </motion.div>
  );
}

export default PublicSite;
