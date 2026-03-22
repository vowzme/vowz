import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Calendar, MapPin, Mail, User, Users, Utensils, MessageSquare, Check, ChevronDown, Loader2, Clock, Plane, Hotel, Send, CalendarPlus, BarChart3, Leaf, Navigation, Gift, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Lightbox from "@/components/Lightbox";
import type { GalleryPhoto } from "@/hooks/use-gallery-photos";
import { useAnalyticsTracker } from "@/hooks/use-analytics";
import { z } from "zod";
import SEOHead from "@/components/SEOHead";
import { TimezoneDisplay, TimezoneNotice } from "@/components/TimezoneDisplay";
import { LivestreamPublicSection } from "@/components/LivestreamSection";
import BlessingWall from "@/components/BlessingWall";
import { CurrencyDisplay } from "@/components/CurrencyConverter";
import LanguageSelector from "@/components/LanguageSelector";

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
  site_password?: string | null;
  site_language?: string;
  translations?: Record<string, Record<string, string>> | null;
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

// ─── Translation helper ───────────────────────────────────────────────
type TranslateFn = (key: string, fallback: string) => string;

function makeTranslate(translations: Record<string, Record<string, string>> | null | undefined, lang: string): TranslateFn {
  return (key: string, fallback: string) => {
    if (lang === "en" || !translations) return fallback;
    return translations[lang]?.[key] || fallback;
  };
}

// Map section type to translation key prefixes
const SECTION_KEY_MAP: Record<string, { heading?: string; body?: string; description?: string }> = {
  hero: { heading: undefined, body: "hero_subheading" },
  story: { heading: "story_heading", body: "story_body" },
  events: { heading: "events_heading" },
  gallery: { heading: "gallery_heading" },
  rsvp: { heading: "rsvp_heading", description: "rsvp_description" },
  guestbook: { heading: "guestbook_heading" },
  travel: { heading: "travel_heading" },
  countdown: { heading: "countdown_label" },
  blessings: { heading: "blessings_heading" },
  registry: { heading: "registry_heading" },
  livestream: { heading: "livestream_heading" },
};

// ─── Page Component ───────────────────────────────────────────────────
const PublicSite = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [site, setSite] = useState<WeddingSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pausedSite, setPausedSite] = useState(false);
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const { trackEvent, trackPageView } = useAnalyticsTracker(site?.id);

  // Derive available languages from translations
  const availableLanguages = useMemo(() => {
    if (!site?.translations) return ["en"];
    const langs = Object.keys(site.translations).filter(
      (l) => l !== "en" && Object.values(site.translations![l] || {}).some(Boolean)
    );
    return ["en", ...langs];
  }, [site]);

  // Translation function
  const t = useMemo(() => makeTranslate(site?.translations, currentLang), [site?.translations, currentLang]);

  useEffect(() => {
    if (!slug) return;
    const fetchSite = async () => {
      // Try finding site by slug (published or paused)
      const { data, error } = await supabase
        .from("wedding_sites")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (data && !error) {
        // Handle paused sites
        if ((data as any).status === "paused") {
          setSite(null);
          setLoading(false);
          setPausedSite(true);
          return;
        }
        // Handle unpublished (draft) sites
        if (!data.is_published) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setSite(data as any);
        setLoading(false);
        return;
      }

      // Not found — check slug_redirects for old slug
      const { data: redirect } = await supabase
        .from("slug_redirects")
        .select("wedding_site_id")
        .eq("old_slug", slug)
        .maybeSingle();

      if (redirect?.wedding_site_id) {
        const { data: redirectedSite } = await supabase
          .from("wedding_sites")
          .select("slug")
          .eq("id", redirect.wedding_site_id)
          .eq("is_published", true)
          .maybeSingle();

        if (redirectedSite?.slug) {
          navigate(`/site/${redirectedSite.slug}`, { replace: true });
          return;
        }
      }

      setNotFound(true);
      setLoading(false);
    };
    fetchSite();
  }, [slug, navigate]);

  // Track page view once site loads
  useEffect(() => {
    if (site) trackPageView();
  }, [site, trackPageView]);

  // Extract dynamic SEO data from site
  const seoData = useMemo(() => {
    if (!site) return null;
    const sections = (site.sections as any[]) || [];
    const eventsSection = sections.find((s) => s.type === "events");
    const firstEvent = eventsSection?.data?.events?.[0];
    const coupleNames = `${site.partner1} & ${site.partner2}`;
    const weddingDate = firstEvent?.date || "";
    const venue = firstEvent?.venue || "";
    const venueAddress = firstEvent?.address || "";
    const city = firstEvent?.city || "";
    const publicURL = `https://vowz.me/site/${site.slug}`;
    const ogImageUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-image?slug=${site.slug}`;
    const description = site.tagline
      ? site.tagline
      : venue && weddingDate
        ? `Join ${site.partner1} & ${site.partner2}'s wedding on ${weddingDate} at ${venue}. RSVP now! Created with Vowz.`
        : `You're invited to celebrate the wedding of ${site.partner1} & ${site.partner2}. RSVP now! Created with Vowz.`;

    return { coupleNames, weddingDate, venue, venueAddress, city, publicURL, ogImageUrl, description };
  }, [site]);

  // JSON-LD structured data for published wedding pages
  const jsonLd = useMemo(() => {
    if (!site || !seoData) return null;
    // Try to parse date into ISO format
    let startDateISO = seoData.weddingDate;
    try {
      const parsed = new Date(seoData.weddingDate);
      if (!isNaN(parsed.getTime())) startDateISO = parsed.toISOString().split("T")[0];
    } catch {}

    return {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": `${seoData.coupleNames} Wedding`,
      "startDate": startDateISO,
      "endDate": startDateISO,
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "eventStatus": "https://schema.org/EventScheduled",
      "location": {
        "@type": "Place",
        "name": seoData.venue || "Wedding Venue",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": seoData.venueAddress,
          "addressLocality": seoData.city,
          "addressCountry": "IN",
        },
      },
      "image": seoData.ogImageUrl,
      "description": `Digital wedding invitation for ${site.partner1} and ${site.partner2} – created with Vowz`,
      "url": seoData.publicURL,
      "organizer": {
        "@type": "Organization",
        "name": "Vowz",
        "url": "https://vowz.me",
      },
    };
  }, [site, seoData]);

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
  const rawSections = (site.sections as any[]) || [];

  // Normalize old-format sections (from WizardPreview v1 which saved {type:"event", title:...})
  const sections = rawSections.length > 0 && rawSections[0]?.type === "event"
    ? [
        { id: "hero", type: "hero", visible: true, data: { heading: `${site.partner1} & ${site.partner2}`, subheading: "You're Invited to the Wedding of", tagline: site.tagline } },
        { id: "story", type: "story", visible: true, data: { heading: "Our Story", body: site.how_we_met } },
        { id: "events", type: "events", visible: true, data: { heading: "Wedding Events", events: rawSections.map((s: any) => ({ name: s.title, date: s.date || "", time: s.time || "", venue: s.venue || "", location: "" })) } },
        { id: "rsvp", type: "rsvp", visible: true, data: { heading: "Join Us", body: "We'd love to have you celebrate with us!" } },
      ]
    : rawSections;

  const siteUrl = `${window.location.origin}/site/${site.slug}`;
  // Use og-meta proxy URL for sharing so crawlers get proper OG tags
  const shareUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-meta?slug=${site.slug}`;
  const shareText = `You're invited to ${site.partner1} & ${site.partner2}'s wedding! 💍✨`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(`${site.partner1} & ${site.partner2}'s Wedding Invitation`)}&body=${encodeURIComponent(`${shareText}\n\nView our wedding site: ${shareUrl}`)}`;

  // Password gate
  if (site.site_password && !passwordUnlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm w-full">
          <Heart className="w-10 h-10 mx-auto mb-4" style={{ color: accent }} fill="currentColor" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">This site is private</h1>
          <p className="text-muted-foreground font-body text-sm mb-6">Enter the password to view this wedding site.</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (pwInput === site.site_password) {
              setPasswordUnlocked(true);
              setPwError(false);
            } else {
              setPwError(true);
            }
          }} className="space-y-3">
            <input
              type="password"
              value={pwInput}
              onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
              placeholder="Enter password"
              className="w-full rounded-lg border border-border bg-card px-4 py-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
            {pwError && <p className="text-sm text-destructive font-body">Incorrect password. Try again.</p>}
            <Button type="submit" className="w-full font-body" style={{ backgroundColor: accent, color: light }}>
              Enter
            </Button>
          </form>
          <p className="text-xs text-muted-foreground font-body mt-6">
            Made with <Heart className="w-3 h-3 inline text-gold" fill="currentColor" /> on Vowz
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {seoData && (
        <SEOHead
          title={`${seoData.coupleNames} Wedding Invitation | Vowz`}
          description={seoData.description}
          ogTitle={`${seoData.coupleNames} Wedding Invitation`}
          ogDescription={site.tagline || "You are invited to our special day!"}
          ogImage={seoData.ogImageUrl}
          ogUrl={seoData.publicURL}
          ogType="website"
          twitterCard="summary_large_image"
          twitterTitle={`${seoData.coupleNames} Wedding`}
          twitterDescription="Digital invitation & website by Vowz"
          twitterImage={seoData.ogImageUrl}
          canonical={seoData.publicURL}
          robots="index, follow"
        >
          {jsonLd && (
            <script type="application/ld+json">
              {JSON.stringify(jsonLd)}
            </script>
          )}
        </SEOHead>
      )}
      {/* Language selector */}
      {availableLanguages.length > 1 && (
        <div className="fixed top-4 right-4 z-50">
          <LanguageSelector
            currentLang={currentLang as any}
            availableLanguages={availableLanguages as any}
            onLanguageChange={(lang) => setCurrentLang(lang)}
            accent={accent}
          />
        </div>
      )}

      {sections.filter((s) => s.visible !== false).map((section) => (
        <PublicSection key={section.id} section={section} site={site} bg={bg} accent={accent} light={light} trackEvent={trackEvent} t={t} />
      ))}
      {/* Floating share bar */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
        className="fixed bottom-6 right-6 z-40 flex flex-col gap-2"
      >
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("share_click", { platform: "whatsapp" })}
          className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
          style={{ backgroundColor: "#25D366" }}
          title="Share on WhatsApp"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
        <a
          href={emailUrl}
          onClick={() => trackEvent("share_click", { platform: "email" })}
          className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
          style={{ backgroundColor: accent }}
          title="Share via Email"
        >
          <Mail className="w-5 h-5" style={{ color: light }} />
        </a>
      </motion.div>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-border/30">
        <div className="flex items-center justify-center gap-3 mb-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-body font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#25D366" }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Share on WhatsApp
          </a>
          <a
            href={emailUrl}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-body font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent, color: bg }}
          >
            <Mail className="w-4 h-4" />
            Share via Email
          </a>
        </div>
        <p className="text-xs text-muted-foreground font-body">
          Made with <Heart className="w-3 h-3 inline text-gold" fill="currentColor" /> on Vowz
        </p>
        <a
          href="https://vowz.me"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors text-[10px] font-body text-muted-foreground hover:text-foreground"
        >
          Powered by <span className="font-semibold" style={{ color: accent }}>vowz.me</span>
        </a>
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
  trackEvent,
  t,
}: {
  section: any;
  site: WeddingSite;
  bg: string;
  accent: string;
  light: string;
  trackEvent: (type: string, meta?: Record<string, any>) => void;
  t: TranslateFn;
}) {
  const { type, data } = section;
  const coupleNames = `${site.partner1} & ${site.partner2}`;

  // Build translated data by overlaying translation values onto original data
  const td = { ...data };
  const keyMap = SECTION_KEY_MAP[type];
  if (keyMap) {
    if (keyMap.heading && td.heading) td.heading = t(keyMap.heading, td.heading);
    if (keyMap.body && td.body) td.body = t(keyMap.body, td.body);
    if (keyMap.description && td.description) td.description = t(keyMap.description, td.description);
  }

  // Special: tagline lives on hero
  if (type === "hero" && td.tagline) td.tagline = t("tagline", td.tagline);
  if (type === "hero" && td.subheading) td.subheading = t("hero_subheading", td.subheading);

  if (type === "hero") return <HeroSection data={td} bg={bg} accent={accent} light={light} coupleNames={coupleNames} />;
  if (type === "countdown") return <CountdownSection data={td} accent={accent} bg={bg} />;
  if (type === "story") return <StorySection data={td} accent={accent} />;
  if (type === "events") return <EventsSection data={td} accent={accent} />;
  if (type === "gallery") return <GallerySection data={td} accent={accent} coupleNames={coupleNames} />;
  if (type === "travel") return <TravelSection data={td} accent={accent} />;
  if (type === "guestbook") return <GuestbookSection data={td} site={site} accent={accent} trackEvent={trackEvent} />;
  if (type === "rsvp") return <RsvpSection data={td} site={site} bg={bg} accent={accent} trackEvent={trackEvent} />;
  if (type === "custom") return <StorySection data={td} accent={accent} />;
  if (type === "polls") return <PollsSection data={td} site={site} accent={accent} />;
  if (type === "ecotips") return <EcoTipsSection data={td} accent={accent} />;
  if (type === "video") return <VideoSection data={td} accent={accent} coupleNames={coupleNames} />;
  if (type === "livestream") return <LivestreamPublicSection data={td} accent={accent} />;
  if (type === "blessings") return <BlessingWall siteId={site.id} accent={accent} heading={td.heading} description={td.description} trackEvent={trackEvent} />;
  if (type === "registry") return <RegistrySection data={td} accent={accent} />;

  return null;
}

// ─── Hero ─────────────────────────────────────────────────────────────
function HeroSection({ data, bg, accent, light, coupleNames }: { data: any; bg: string; accent: string; light: string; coupleNames: string }) {
  return (
    <section
      aria-label={`${coupleNames} wedding hero`}
      className="relative py-28 md:py-40 px-6 text-center overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${bg}, ${bg}dd)` }}
    >
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <svg viewBox="0 0 400 400" className="w-full h-full" role="img" aria-label="Decorative circles">
          {[...Array(8)].map((_, i) => (
            <circle key={i} cx="200" cy="200" r={50 + i * 30} fill="none" stroke={light} strokeWidth="0.5" />
          ))}
        </svg>
      </div>
      <div className="relative z-10 max-w-3xl mx-auto">
        {data.logoUrl && (
          <motion.img
            src={data.logoUrl}
            alt={`${coupleNames} wedding logo`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-5 object-contain rounded-xl"
          />
        )}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} aria-hidden="true">
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
          aria-hidden="true"
        >
          <ChevronDown className="w-6 h-6 mx-auto animate-bounce" style={{ color: `${light}60` }} />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Story ────────────────────────────────────────────────────────────
function StorySection({ data, accent }: { data: any; accent: string }) {
  return (
    <section
      aria-label={data.heading || "Our Story"}
      className="bg-card py-16 md:py-20 px-6"
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
          {data.heading}
        </h2>
        <div className="w-14 h-0.5 mx-auto mb-8" style={{ backgroundColor: accent }} aria-hidden="true" />
        <p className="text-muted-foreground font-body text-lg leading-relaxed whitespace-pre-wrap">
          {data.body}
        </p>
      </div>
    </section>
  );
}

// ─── Events ───────────────────────────────────────────────────────────
function EventsSection({ data, accent }: { data: any; accent: string }) {
  const events = data.events || [];
  return (
    <section
      aria-label={data.heading || "Wedding Events"}
      className="py-16 md:py-20 px-6"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center mb-3">
          {data.heading}
        </h2>
        <TimezoneNotice accent={accent} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event: any, i: number) => (
            <article
              key={i}
              className="border border-border/50 rounded-2xl p-6 text-center bg-card hover:shadow-elegant transition-shadow"
            >
              <div
                className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${accent}20` }}
                aria-hidden="true"
              >
                <Calendar className="w-6 h-6" style={{ color: accent }} />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">{event.name}</h3>
              {event.date && <p className="text-sm text-muted-foreground font-body">{event.date}</p>}
              {event.time && <p className="text-sm text-muted-foreground font-body">{event.time}</p>}
              <TimezoneDisplay date={event.date} time={event.time} eventTimezone={event.timezone} accent={accent} />
              {event.venue && (
                <p className="text-sm text-muted-foreground font-body flex items-center justify-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {event.venue}
                </p>
              )}
              {event.address && (
                <p className="text-sm text-muted-foreground/70 font-body mt-0.5">{event.address}</p>
              )}
              {(event.locationLink || event.location) && (
                <a
                  href={event.locationLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address || event.location || event.venue || "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-body mt-1 inline-flex items-center gap-1 underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity"
                  style={{ color: accent }}
                >
                  <MapPin className="w-3 h-3" /> View on Map
                </a>
              )}
              {(event.address || event.venue || event.location) && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.address || event.venue || event.location || "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-body mt-2 px-2.5 py-1 rounded-full border transition-colors hover:bg-card"
                  style={{ borderColor: `${accent}40`, color: accent }}
                >
                  <Navigation className="w-3 h-3" /> Get Directions
                </a>
              )}
              {event.date && (
                <a
                  href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${encodeURIComponent(event.date.replace(/[^0-9]/g, ""))}/${encodeURIComponent(event.date.replace(/[^0-9]/g, ""))}&details=${encodeURIComponent(`${event.name}${event.venue ? " at " + event.venue : ""}`)}&location=${encodeURIComponent(event.location || event.venue || "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-body mt-2 px-2.5 py-1 rounded-full border transition-colors hover:bg-card"
                  style={{ borderColor: `${accent}40`, color: accent }}
                >
                  <CalendarPlus className="w-3 h-3" /> Add to Calendar
                </a>
              )}
              {!event.date && !event.time && (
                <p className="text-sm text-muted-foreground font-body">Date & time TBD</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────
function GallerySection({ data, accent, coupleNames }: { data: any; accent: string; coupleNames: string }) {
  const photos: GalleryPhoto[] = data.photos || [];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <section
      aria-label={data.heading || "Photo Gallery"}
      className="bg-card py-16 md:py-20 px-6"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center mb-3">
          {data.heading || "Our Moments"}
        </h2>
        <div className="w-14 h-0.5 mx-auto mb-10" style={{ backgroundColor: accent }} aria-hidden="true" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setLightboxIndex(i)}
            >
              <img
                src={photo.url}
                alt={photo.name ? `Wedding photo of ${coupleNames} – ${photo.name}` : `Wedding photo of ${coupleNames}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
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
    </section>
  );
}

// ─── Countdown ────────────────────────────────────────────────────────
function CountdownSection({ data, accent, bg }: { data: any; accent: string; bg: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const targetDate = data.date ? new Date(data.date) : null;

  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const diff = Math.max(0, targetDate.getTime() - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [data.date]);

  if (!targetDate) return null;

  return (
    <section
      aria-label={data.label || "Countdown"}
      className="py-12 md:py-16 px-6 text-center"
      style={{ background: `linear-gradient(135deg, ${bg}08, ${accent}08)` }}
    >
      <Clock className="w-6 h-6 mx-auto mb-3" style={{ color: accent }} aria-hidden="true" />
      <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground mb-6">
        {data.label || "Counting Down"}
      </h2>
      <div className="flex justify-center gap-4 sm:gap-8" role="timer" aria-label="Wedding countdown">
        {[
          { value: timeLeft.days, label: "Days" },
          { value: timeLeft.hours, label: "Hours" },
          { value: timeLeft.minutes, label: "Minutes" },
          { value: timeLeft.seconds, label: "Seconds" },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <div className="font-display text-3xl sm:text-5xl font-bold" style={{ color: accent }}>
              {String(value).padStart(2, "0")}
            </div>
            <div className="font-body text-xs sm:text-sm text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Travel & Stay ────────────────────────────────────────────────────
function TravelSection({ data, accent }: { data: any; accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="py-16 md:py-20 px-6"
    >
      <div className="max-w-3xl mx-auto">
        <Plane className="w-6 h-6 mx-auto mb-3" style={{ color: accent }} />
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center mb-3">
          {data.heading || "Travel & Stay"}
        </h2>
        <div className="w-14 h-0.5 mx-auto mb-4" style={{ backgroundColor: accent }} />
        <p className="text-muted-foreground font-body text-center max-w-xl mx-auto mb-8">
          {data.description}
        </p>

        {(data.hotels || []).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {data.hotels.map((hotel: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border border-border/50 rounded-2xl p-5 bg-card hover:shadow-elegant transition-shadow"
              >
                <div className="w-10 h-10 rounded-full mb-3 flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
                  <Hotel className="w-5 h-5" style={{ color: accent }} />
                </div>
                <p className="font-display text-base font-semibold text-foreground">{hotel.name}</p>
                <p className="text-sm text-muted-foreground font-body mt-1">{hotel.description}</p>
                {hotel.address && (
                  <p className="text-xs text-muted-foreground/70 font-body mt-1">{hotel.address}</p>
                )}
                <p className="text-sm font-body mt-2 flex items-center gap-1" style={{ color: accent }}>
                  <MapPin className="w-3.5 h-3.5" /> {hotel.distance}
                </p>
                {(hotel.locationLink || hotel.address || hotel.name) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {hotel.locationLink && (
                      <a
                        href={hotel.locationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-body inline-flex items-center gap-1 underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity"
                        style={{ color: accent }}
                      >
                        <MapPin className="w-3 h-3" /> View on Map
                      </a>
                    )}
                    {(hotel.address || hotel.name) && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hotel.address || hotel.name || "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-body inline-flex items-center gap-1 underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity"
                        style={{ color: accent }}
                      >
                        <Navigation className="w-3 h-3" /> Get Directions
                      </a>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {data.directions && (
          <div className="bg-card border border-border/50 rounded-2xl p-6 max-w-xl mx-auto">
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">Getting There</h3>
            <p className="text-muted-foreground font-body text-sm whitespace-pre-wrap">{data.directions}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Guestbook / Wishes ──────────────────────────────────────────────
function GuestbookSection({ data, site, accent, trackEvent }: { data: any; site: WeddingSite; accent: string; trackEvent: (type: string, meta?: Record<string, any>) => void }) {
  const [wishes, setWishes] = useState<{ id: string; guest_name: string; message: string; created_at: string }[]>([]);
  const [form, setForm] = useState({ guest_name: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase
      .from("guestbook")
      .select("*")
      .eq("wedding_site_id", site.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data: rows }) => {
        if (rows) setWishes(rows as any);
      });
  }, [site.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guest_name.trim() || !form.message.trim()) return;
    setSubmitting(true);
    const { data: newWish, error } = await supabase
      .from("guestbook")
      .insert({ wedding_site_id: site.id, guest_name: form.guest_name.trim(), message: form.message.trim() })
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      toast({ title: "Failed to post wish", description: error.message, variant: "destructive" });
    } else {
      setSubmitted(true);
      if (newWish) setWishes((prev) => [newWish as any, ...prev]);
      setForm({ guest_name: "", message: "" });
      toast({ title: "Wish posted! 💕" });
      trackEvent("guestbook_post");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="bg-card py-16 md:py-20 px-6"
    >
      <div className="max-w-2xl mx-auto">
        <MessageSquare className="w-6 h-6 mx-auto mb-3" style={{ color: accent }} />
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center mb-3">
          {data.heading || "Wishes & Blessings"}
        </h2>
        <div className="w-14 h-0.5 mx-auto mb-4" style={{ backgroundColor: accent }} />
        <p className="text-muted-foreground font-body text-center mb-8">
          {data.description}
        </p>

        {/* Post wish form */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="bg-background border border-border/50 rounded-2xl p-6 mb-8 space-y-4">
            <Input
              placeholder="Your name"
              value={form.guest_name}
              onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
              required
              maxLength={100}
              className="font-body"
            />
            <Textarea
              placeholder="Write your wishes for the couple..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              maxLength={500}
              rows={3}
              className="font-body"
            />
            <Button type="submit" variant="gold" className="w-full font-body" disabled={submitting}>
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...</> : <><Send className="w-4 h-4 mr-2" /> Post Wish</>}
            </Button>
          </form>
        ) : (
          <div className="bg-background border border-border/50 rounded-2xl p-6 mb-8 text-center">
            <Check className="w-8 h-8 mx-auto mb-2" style={{ color: accent }} />
            <p className="font-body text-foreground font-medium">Thank you for your wishes! 💕</p>
            <button onClick={() => setSubmitted(false)} className="text-sm text-accent hover:underline font-body mt-2">
              Post another wish
            </button>
          </div>
        )}

        {/* Wishes wall */}
        {wishes.length > 0 && (
          <div className="space-y-3">
            {wishes.map((wish) => (
              <motion.div
                key={wish.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background border border-border/50 rounded-xl p-4"
              >
                <p className="font-body text-sm text-foreground">{wish.message}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="font-body text-xs font-medium" style={{ color: accent }}>— {wish.guest_name}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    {new Date(wish.created_at).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── RSVP Form ────────────────────────────────────────────────────────
function RsvpSection({ data, site, bg, accent, trackEvent }: { data: any; site: WeddingSite; bg: string; accent: string; trackEvent: (type: string, meta?: Record<string, any>) => void }) {
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
      trackEvent("rsvp_submit", { attending: form.attending, guest_count: form.guest_count });
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

// ─── Polls Section ────────────────────────────────────────────────────
function PollsSection({ data, site, accent }: { data: any; site: WeddingSite; accent: string }) {
  const [votes, setVotes] = useState<Record<string, Record<number, number>>>({});
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [voterName, setVoterName] = useState("");

  useEffect(() => {
    // Load polls from DB and count votes
    const loadPolls = async () => {
      const { data: dbPolls } = await supabase
        .from("wedding_polls")
        .select("id, question, options")
        .eq("wedding_site_id", site.id);
      if (!dbPolls) return;

      const voteMap: Record<string, Record<number, number>> = {};
      for (const poll of dbPolls) {
        const { data: pollVotes } = await supabase
          .from("poll_votes")
          .select("option_index")
          .eq("poll_id", poll.id);
        const counts: Record<number, number> = {};
        (pollVotes || []).forEach((v: any) => {
          counts[v.option_index] = (counts[v.option_index] || 0) + 1;
        });
        voteMap[poll.id] = counts;
      }
      setVotes(voteMap);
    };
    loadPolls();
  }, [site.id]);

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (voted.has(pollId) || !voterName.trim()) return;
    const { error } = await supabase.from("poll_votes").insert({
      poll_id: pollId,
      option_index: optionIndex,
      voter_name: voterName.trim(),
    });
    if (!error) {
      setVoted((prev) => new Set(prev).add(pollId));
      setVotes((prev) => ({
        ...prev,
        [pollId]: {
          ...(prev[pollId] || {}),
          [optionIndex]: ((prev[pollId] || {})[optionIndex] || 0) + 1,
        },
      }));
    }
  };

  // Try to match local poll data with DB polls
  const [dbPolls, setDbPolls] = useState<any[]>([]);
  useEffect(() => {
    supabase
      .from("wedding_polls")
      .select("*")
      .eq("wedding_site_id", site.id)
      .then(({ data: polls }) => { if (polls) setDbPolls(polls); });
  }, [site.id]);

  // Use local data for display, match with DB for voting
  const polls = data.polls || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="bg-card py-16 md:py-20 px-6"
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">{data.heading}</h2>
        <div className="w-14 h-0.5 mx-auto mb-10" style={{ backgroundColor: accent }} />

        {!voterName && (
          <div className="max-w-xs mx-auto mb-8">
            <p className="text-sm text-muted-foreground font-body mb-2">Enter your name to vote</p>
            <div className="flex gap-2">
              <Input
                placeholder="Your name"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                className="font-body"
              />
              <Button variant="gold" size="sm" onClick={() => {}} disabled={!voterName.trim()}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {polls.map((poll: any, pi: number) => {
            const matchedDb = dbPolls.find((dp) => dp.question === poll.question);
            const pollId = matchedDb?.id || `local-${pi}`;
            const pollVotes = votes[pollId] || {};
            const totalVotes = Object.values(pollVotes).reduce((a: number, b: any) => a + (b as number), 0) as number;
            const hasVoted = voted.has(pollId);

            return (
              <div key={pi} className="border border-border/50 rounded-2xl p-6 text-left bg-background">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5" style={{ color: accent }} />
                  <p className="font-display text-lg font-semibold text-foreground">{poll.question}</p>
                </div>
                <div className="space-y-2">
                  {(poll.options || []).map((opt: string, oi: number) => {
                    const voteCount = pollVotes[oi] || 0;
                    const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                    return (
                      <button
                        key={oi}
                        onClick={() => matchedDb && handleVote(pollId, oi)}
                        disabled={hasVoted || !voterName.trim() || !matchedDb}
                        className={`w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden ${
                          hasVoted ? "cursor-default" : "hover:border-gold/50 cursor-pointer"
                        }`}
                        style={{ borderColor: hasVoted ? `${accent}30` : undefined }}
                      >
                        {hasVoted && (
                          <div
                            className="absolute inset-0 opacity-15 transition-all"
                            style={{ width: `${pct}%`, backgroundColor: accent }}
                          />
                        )}
                        <div className="relative flex justify-between items-center">
                          <span className="font-body text-sm text-foreground">{opt}</span>
                          {hasVoted && (
                            <span className="font-body text-xs font-semibold" style={{ color: accent }}>
                              {pct}% ({voteCount})
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {totalVotes > 0 && (
                  <p className="text-xs text-muted-foreground font-body mt-2">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Eco Tips Section ─────────────────────────────────────────────────
function EcoTipsSection({ data, accent }: { data: any; accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="py-16 md:py-20 px-6"
      style={{ background: `linear-gradient(135deg, #2D501610, #8DB37015)` }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center bg-green-100">
          <Leaf className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">{data.heading}</h2>
        <div className="w-14 h-0.5 mx-auto mb-6" style={{ backgroundColor: accent }} />
        <p className="text-muted-foreground font-body text-lg mb-8 max-w-lg mx-auto">{data.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
          {(data.tips || []).map((tip: string, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/30"
            >
              <span className="text-lg shrink-0">🌱</span>
              <p className="font-body text-sm text-foreground leading-relaxed">{tip}</p>
            </motion.div>
          ))}
        </div>

        {data.showDigitalInviteTracker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-green-50 border border-green-200"
          >
            <span className="text-lg">🌍</span>
            <p className="font-body text-sm text-green-700 font-medium">
              This wedding went paperless — digital invites saved trees!
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Video ────────────────────────────────────────────────────────────
function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

function VideoSection({ data, accent, coupleNames }: { data: any; accent: string; coupleNames: string }) {
  const videos = data.videos || [];
  if (videos.length === 0 || !videos.some((v: any) => v.url)) return null;

  return (
    <section aria-label={data.heading || "Videos"} className="bg-card py-16 md:py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center mb-3">{data.heading || "Our Moments"}</h2>
        <div className="w-14 h-0.5 mx-auto mb-10" style={{ backgroundColor: accent }} aria-hidden="true" />
        <div className="space-y-8">
          {videos.filter((v: any) => v.url).map((video: any, i: number) => {
            const embedUrl = getVideoEmbedUrl(video.url);
            if (!embedUrl) return null;
            return (
              <div key={i}>
                <div className="aspect-video rounded-xl overflow-hidden shadow-elegant">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title={video.caption || `${coupleNames} wedding video ${i + 1}`}
                    loading="lazy"
                  />
                </div>
                {video.caption && (
                  <p className="text-center text-sm text-muted-foreground font-body mt-3">{video.caption}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Password Gate ────────────────────────────────────────────────────
function PasswordGate({ onUnlock, accent }: { onUnlock: () => void; accent: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [storedPassword, setStoredPassword] = useState("");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm w-full"
      >
        <Heart className="w-10 h-10 mx-auto mb-4" style={{ color: accent }} fill="currentColor" />
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">This site is private</h1>
        <p className="text-muted-foreground font-body text-sm mb-6">Enter the password to view this wedding site.</p>
        <form onSubmit={(e) => { e.preventDefault(); onUnlock(); }} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Enter password"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
          {error && <p className="text-sm text-destructive font-body">Incorrect password. Try again.</p>}
          <Button
            type="submit"
            className="w-full font-body"
            style={{ backgroundColor: accent }}
            onClick={(e) => {
              e.preventDefault();
              // Password check happens in parent
              const input = password;
              (window as any).__pwCheck?.(input);
            }}
          >
            Enter
          </Button>
        </form>
        <p className="text-xs text-muted-foreground font-body mt-6">
          Made with <Heart className="w-3 h-3 inline text-gold" fill="currentColor" /> on Vowz
        </p>
      </motion.div>
    </div>
  );
}

// ─── Registry Section ─────────────────────────────────────────────────
function RegistrySection({ data, accent }: { data: any; accent: string }) {
  const links = (data.links || []).filter((l: any) => l.name || l.url);
  if (links.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="py-16 md:py-20 px-6"
    >
      <div className="max-w-2xl mx-auto text-center">
        <Gift className="w-6 h-6 mx-auto mb-3" style={{ color: accent }} />
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
          {data.heading || "Gift Registry"}
        </h2>
        <div className="w-14 h-0.5 mx-auto mb-4" style={{ backgroundColor: accent }} />
        {data.description && (
          <p className="text-muted-foreground font-body text-center mb-8 max-w-lg mx-auto">{data.description}</p>
        )}
        <div className="space-y-3 max-w-md mx-auto">
          {links.map((link: any, i: number) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:shadow-elegant transition-all group"
            >
              <div className="text-left">
                <p className="font-body text-sm font-medium text-foreground group-hover:underline">{link.name}</p>
                {link.valueUSD > 0 && <CurrencyDisplay amountUSD={link.valueUSD} />}
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default PublicSite;
