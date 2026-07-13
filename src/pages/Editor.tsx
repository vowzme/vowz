import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence as LightboxAnimatePresence } from "framer-motion";
import Lightbox from "@/components/Lightbox";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Heart, Eye, EyeOff, GripVertical, Plus, Trash2, ArrowLeft,
  Type, Palette, Settings, Sparkles, Save, ExternalLink, X,
  Calendar, MapPin, ChevronDown, ChevronUp, Image, Upload, Loader2,
  MessageCircle, Send, Bot, Wand2, LayoutTemplate, Check, Search, HardDrive, Mail, Download, CalendarPlus, RotateCcw
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { buildGoogleCalendarUrl, buildOutlookCalendarUrl, downloadIcs, downloadAllEventsIcs, parseEventStart } from "@/lib/calendar-invite";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useWeddingSite } from "@/hooks/use-wedding-site";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useGalleryPhotos, GalleryPhoto } from "@/hooks/use-gallery-photos";
import { useAIContentGen } from "@/hooks/use-ai-content-gen";
import SEOHead from "@/components/SEOHead";
import { useMediaUpload } from "@/hooks/use-media-upload";
import { StorageBadge } from "@/components/StorageBadge";
import { DEFAULT_STORY, STORY_TEMPLATES } from "@/lib/default-story";
import MediaManagerPanel from "@/components/MediaManagerPanel";
import { getVideoEmbedUrl, parseVideoUrl, SUPPORTED_VIDEO_PROVIDERS, validateVideoUrl } from "@/lib/video-embed";
import { MUSIC_CATEGORIES } from "@/lib/music-library";
import { useR2Upload } from "@/hooks/use-r2-upload";
import { WEDDING_THEMES } from "@/lib/wedding-themes";
import { parseThemeStyle } from "@/lib/theme-schema";

// ─── Types ───────────────────────────────────────────────────────────
export interface WeddingSection {
  id: string;
  type: "hero" | "story" | "events" | "gallery" | "rsvp" | "countdown" | "guestbook" | "travel" | "custom" | "polls" | "ecotips" | "video" | "livestream" | "blessings" | "registry" | "couple_profiles" | "music" | "guest_album";
  title: string;
  visible: boolean;
  data: Record<string, any>;
}

export interface WeddingSiteData {
  partner1: string;
  partner2: string;
  culturalBackground: string;
  howWeMet: string;
  functions: string[];
  theme: string;
  suggestedColors: string[];
  tagline: string;
  countdownLabel?: string;
  travelInfo?: {
    heading: string;
    description: string;
    hotels: { name: string; description: string; distance: string }[];
    directions: string;
  };
  welcomeMessage?: string;
  displayFont?: string;
  bodyFont?: string;
  memoryMode?: boolean;
  sitePassword?: string;
  siteLanguage?: string;
  availableLanguages?: string[];
  translations?: Record<string, Record<string, string>>;
}

interface EditorState {
  siteData: WeddingSiteData;
  sections: WeddingSection[];
  activePanel: "sections" | "style" | "settings" | "ai" | "templates" | "media" | null;
  selectedSectionId: string | null;
  previewMode: boolean;
}

// ─── Default sections from wizard data ────────────────────────────────
function buildSections(data: WeddingSiteData): WeddingSection[] {
  return [
    {
      id: "hero",
      type: "hero",
      title: "Hero",
      visible: true,
      data: {
        heading: `${data.partner1} & ${data.partner2}`,
        subheading: "You're Invited to the Wedding of",
        tagline: data.tagline,
      },
    },
    {
      id: "countdown",
      type: "countdown",
      title: "Countdown",
      visible: true,
      data: {
        label: data.countdownLabel || "Days Until We Say 'I Do'",
        date: "",
      },
    },
    {
      id: "story",
      type: "story",
      title: "Our Story",
      visible: true,
      data: { heading: "Our Story", body: data.howWeMet?.trim() || DEFAULT_STORY },
    },
    {
      id: "events",
      type: "events",
      title: "Wedding Events",
      visible: true,
      data: {
        heading: "Wedding Events",
        events: data.functions.map((f) => ({
          name: f,
          date: "",
          time: "",
          venue: "",
          location: "",
        })),
      },
    },
    {
      id: "gallery",
      type: "gallery",
      title: "Photo Gallery",
      visible: true,
      data: { heading: "Our Moments" },
    },
    {
      id: "travel",
      type: "travel",
      title: "Travel & Stay",
      visible: true,
      data: data.travelInfo || {
        heading: "Travel & Stay",
        description: "We've arranged some lovely options for your stay.",
        hotels: [
          { name: "Hotel Placeholder", description: "Update with your hotel details", distance: "Near venue" },
        ],
        directions: "Directions and travel tips — update this with your venue details.",
      },
    },
    {
      id: "guestbook",
      type: "guestbook",
      title: "Wishes & Blessings",
      visible: true,
      data: {
        heading: "Wishes & Blessings",
        description: data.welcomeMessage || "Leave your heartfelt wishes for the couple!",
      },
    },
    {
      id: "rsvp",
      type: "rsvp",
      title: "RSVP",
      visible: true,
      data: { heading: "Join Us", body: "We'd love to have you celebrate with us!" },
    },
  ];
}

// ─── Color presets ────────────────────────────────────────────────────
const COLOR_PRESETS = [
  { name: "Traditional", colors: ["#6B1D2A", "#D4A853", "#FFF5E6"] },
  { name: "Royal", colors: ["#1A1A4E", "#C9A846", "#FAF3E0"] },
  { name: "Pastel", colors: ["#9B7EBD", "#E8C5DA", "#FFF8F0"] },
  { name: "Eco", colors: ["#2D5016", "#8DB370", "#F5F5DC"] },
  { name: "Blush", colors: ["#8B3A4A", "#E8A0BF", "#FFF0F5"] },
  { name: "Navy", colors: ["#1B2A4A", "#B8860B", "#F5F5F5"] },
];

// ─── Font presets ────────────────────────────────────────────────────
const FONT_PRESETS = [
  { name: "Classic", display: "Cormorant Garamond", body: "DM Sans" },
  { name: "Elegant", display: "Playfair Display", body: "Lato" },
  { name: "Modern", display: "Montserrat", body: "Source Sans 3" },
  { name: "Romantic", display: "Great Vibes", body: "Nunito" },
  { name: "Regal", display: "Cinzel", body: "Raleway" },
  { name: "Whimsical", display: "Dancing Script", body: "Quicksand" },
];

function loadGoogleFont(fontFamily: string) {
  const id = `gfont-${fontFamily.replace(/\s/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

// ─── Fallback data for direct navigation ──────────────────────────────
const FALLBACK_DATA: WeddingSiteData = {
  partner1: "Partner 1",
  partner2: "Partner 2",
  culturalBackground: "Hindu",
  howWeMet: "Our beautiful love story...",
  functions: ["Engagement", "Mehendi", "Sangeet", "Wedding", "Reception"],
  theme: "traditional",
  suggestedColors: ["#6B1D2A", "#D4A853", "#FFF5E6"],
  tagline: "Together Forever",
};

// ─── Editor Component ─────────────────────────────────────────────────
const Editor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { siteId } = useParams();
  const { user } = useAuth();
  const { createSite, updateSite, loadUserSite, loadSiteById, saving, loading } = useWeddingSite();
  const wizardData: WeddingSiteData | null = (location.state as any)?.wizardData || null;

  const [dbSiteId, setDbSiteId] = useState<string | null>(siteId || null);
  // Snapshot of the last-saved styling fields. Used by the theme picker's
  // "Restore last saved" button to discard unsaved theme/color/font changes
  // without touching sections or other content.
  const savedStyleRef = useRef<{
    theme: string;
    suggestedColors: string[];
    displayFont?: string;
    bodyFont?: string;
  } | null>(null);
  const [state, setState] = useState<EditorState>({
    siteData: wizardData || FALLBACK_DATA,
    sections: buildSections(wizardData || FALLBACK_DATA),
    activePanel: "sections",
    selectedSectionId: null,
    previewMode: false,
  });

  // Load existing site from DB if no wizard data passed
  useEffect(() => {
    if (!wizardData && user) {
      const loader = siteId ? loadSiteById(siteId) : loadUserSite();
      loader.then((site: any) => {
        if (site) {
          setDbSiteId(site.id);
          // Validate + coerce theme/palette fields before feeding React state.
          const safeStyle = parseThemeStyle({
            theme: site.theme,
            suggested_colors: site.suggested_colors,
            display_font: (site as any).display_font,
            body_font: (site as any).body_font,
          });
          const siteData: WeddingSiteData = {
            partner1: site.partner1,
            partner2: site.partner2,
            culturalBackground: site.cultural_background,
            howWeMet: site.how_we_met,
            functions: [],
            theme: safeStyle.theme,
            suggestedColors: safeStyle.suggestedColors,
            tagline: site.tagline,
            displayFont: safeStyle.displayFont,
            bodyFont: safeStyle.bodyFont,
            siteLanguage: (site as any).site_language || "en",
            sitePassword: "",
            availableLanguages: Object.keys((site as any).translations || {}).length > 0
              ? ["en", ...Object.keys((site as any).translations || {})]
              : ["en"],
            translations: (site as any).translations || {},
          };
          // Fallback: if the site row has no theme yet, hydrate from the user's saved profile preferences.
          if (!site.theme) {
            (supabase as any)
              .from("profiles")
              .select("preferred_theme, preferred_colors, preferred_display_font, preferred_body_font")
              .eq("id", user.id)
              .maybeSingle()
              .then(({ data: prof }: any) => {
                if (!prof) return;
                const style = parseThemeStyle(prof);
                setState((prev) => ({
                  ...prev,
                  siteData: {
                    ...prev.siteData,
                    theme: style.theme,
                    suggestedColors: style.suggestedColors,
                    displayFont: style.displayFont,
                    bodyFont: style.bodyFont,
                  },
                }));
              });
          }
          const rawSections = (site.sections as any[]) || [];
          // Normalize old-format sections ({type:"event"}) to proper format
          const isOldFormat = rawSections.length > 0 && rawSections[0]?.type === "event";
          const sections = isOldFormat ? buildSections(siteData) : (rawSections as any as WeddingSection[]);
          savedStyleRef.current = {
            theme: siteData.theme,
            suggestedColors: siteData.suggestedColors,
            displayFont: siteData.displayFont,
            bodyFont: siteData.bodyFont,
          };
          setState((prev) => ({
            ...prev,
            siteData,
            sections: sections && sections.length > 0 ? sections : buildSections(siteData),
          }));
          // Indicate whether a password is set (the value itself is never returned to the client).
          (supabase as any)
            .rpc("site_has_password", { _site_id: site.id })
            .then(({ data }: any) => {
              if (data === true) {
                setState((prev) => ({
                  ...prev,
                  siteData: { ...prev.siteData, hasPassword: true },
                } as any));
              }
            });
        }
      });
    }
  }, [user, wizardData]);

  // Auto-create site in DB when coming from wizard
  useEffect(() => {
    if (wizardData && user && !dbSiteId) {
      const sections = buildSections(wizardData);
      createSite({
        partner1: wizardData.partner1,
        partner2: wizardData.partner2,
        culturalBackground: wizardData.culturalBackground,
        howWeMet: wizardData.howWeMet,
        theme: wizardData.theme,
        tagline: wizardData.tagline,
        suggestedColors: wizardData.suggestedColors,
        sections,
        displayFont: (wizardData as any).displayFont,
        bodyFont: (wizardData as any).bodyFont,
      }).then((site) => {
        if (site) {
          setDbSiteId(site.id);
          savedStyleRef.current = {
            theme: wizardData.theme,
            suggestedColors: wizardData.suggestedColors,
            displayFont: (wizardData as any).displayFont,
            bodyFont: (wizardData as any).bodyFont,
          };
        }
      });
    }
  }, [wizardData, user, dbSiteId]);

  const { siteData, sections, activePanel, selectedSectionId, previewMode } = state;
  const [bg, accent, light] = siteData.suggestedColors.length >= 3
    ? siteData.suggestedColors
    : ["#6B1D2A", "#D4A853", "#FFF5E6"];
  const displayFont = siteData.displayFont || "Cormorant Garamond";
  const bodyFont = siteData.bodyFont || "DM Sans";

  // Load Google Fonts dynamically
  useEffect(() => {
    loadGoogleFont(displayFont);
    loadGoogleFont(bodyFont);
  }, [displayFont, bodyFont]);

  const updateState = useCallback((patch: Partial<EditorState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateSection = useCallback((id: string, patch: Partial<WeddingSection>) => {
    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  const updateSectionData = useCallback((id: string, dataPatch: Record<string, any>) => {
    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === id ? { ...s, data: { ...s.data, ...dataPatch } } : s
      ),
    }));
  }, []);

  const deleteSection = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id),
      selectedSectionId: prev.selectedSectionId === id ? null : prev.selectedSectionId,
    }));
  }, []);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const addSection = useCallback((sectionType?: string) => {
    const typeMap: Record<string, { type: WeddingSection["type"]; title: string; data: Record<string, any> }> = {
      custom: { type: "custom", title: "New Section", data: { heading: "New Section", body: "Add your content here..." } },
      polls: { type: "polls", title: "Guest Polls", data: { heading: "Have Your Say! 🗳️", polls: [{ question: "Vote for your favourite Sangeet song!", options: ["Gallan Goodiyaan", "London Thumakda", "Nachde Ne Saare"] }] } },
      ecotips: { type: "ecotips", title: "Eco Wedding", data: { heading: "Our Green Wedding 🌿", description: "We're committed to celebrating responsibly.", tips: ["Digital invites — saving 200+ paper cards", "Locally sourced flowers & décor", "Carpooling encouraged — share rides with fellow guests", "Plant a sapling as your blessing to us"], showDigitalInviteTracker: true } },
      video: { type: "video", title: "Videos", data: { heading: "Our Moments 🎬", videos: [{ url: "", caption: "Pre-wedding video" }] } },
      livestream: { type: "livestream", title: "Live Stream", data: { heading: "Watch Live 📡", description: "Join us virtually from anywhere in the world!", embedUrl: "" } },
      blessings: { type: "blessings", title: "Guest Blessings", data: { heading: "Guest Blessings 💕", description: "Share your heartfelt blessings and wishes for the couple!" } },
      guest_album: { type: "guest_album", title: "Guest Album", data: { heading: "Guest Album 📸", description: "Share your favourite photos from the celebration. Every guest can post and react." } },
      registry: { type: "registry", title: "Gift Registry", data: { heading: "Gift Registry 🎁", description: "Your presence is our greatest gift, but if you wish to bless us further:", links: [{ name: "", url: "", valueUSD: 0 }] } },
      couple_profiles: { type: "couple_profiles", title: "Couple Profiles", data: { heading: "Meet the Couple 💑", partner1Name: "", partner1Bio: "", partner1Photo: "", partner2Name: "", partner2Bio: "", partner2Photo: "" } },
      music: { type: "music", title: "Background Music", data: { enabled: true, category: "romantic", trackUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", trackName: "First Dance", autoplay: true, loop: true, volume: 0.4 } },
    };
    const config = typeMap[sectionType || "custom"] || typeMap.custom;
    const newSection: WeddingSection = {
      id: `${config.type}-${Date.now()}`,
      type: config.type,
      title: config.title,
      visible: true,
      data: config.data,
    };
    setState((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
      selectedSectionId: newSection.id,
    }));
    setShowAddMenu(false);
  }, []);

  const handleSave = async () => {
    if (!dbSiteId) {
      toast({ title: "No site to save", variant: "destructive" });
      return;
    }
    const success = await updateSite(dbSiteId, {
      partner1: siteData.partner1,
      partner2: siteData.partner2,
      cultural_background: siteData.culturalBackground,
      how_we_met: siteData.howWeMet,
      theme: siteData.theme,
      tagline: siteData.tagline,
      suggested_colors: siteData.suggestedColors,
      sections: sections as any,
      site_language: siteData.siteLanguage || "en",
      translations: siteData.translations || {},
      display_font: siteData.displayFont,
      body_font: siteData.bodyFont,
    });
    // Persist password to owner-only table.
    // The current password value is never loaded back to the client, so we only
    // act when the user explicitly typed a new value or asked to clear it.
    try {
      const pw = (siteData.sitePassword || "").trim();
      const clearPw = (siteData as any).clearPassword === true;
      if (pw) {
        await (supabase as any)
          .from("wedding_site_passwords")
          .upsert({ wedding_site_id: dbSiteId, password: pw }, { onConflict: "wedding_site_id" });
      } else if (clearPw) {
        await (supabase as any)
          .from("wedding_site_passwords")
          .delete()
          .eq("wedding_site_id", dbSiteId);
      }
    } catch (e) {
      console.error("Failed to save site password", e);
    }
    if (success) {
      toast({ title: "Site saved! ✨", description: "Your changes have been saved." });
      savedStyleRef.current = {
        theme: siteData.theme,
        suggestedColors: siteData.suggestedColors,
        displayFont: siteData.displayFont,
        bodyFont: siteData.bodyFont,
      };
    }
  };

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  // ─── Preview Mode ──────────────────────────────────────────────────
  if (previewMode) {
    const dev = (state as any).previewDevice || "desktop";
    const setDev = (d: "mobile" | "tablet" | "desktop") =>
      setState((prev) => ({ ...(prev as any), previewDevice: d } as any));
    const frame =
      dev === "mobile"
        ? { w: 390, h: 780, label: "iPhone" }
        : dev === "tablet"
        ? { w: 820, h: 1100, label: "iPad" }
        : null;
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="fixed top-4 right-4 z-50 flex gap-2 items-center">
          <div className="flex gap-1 rounded-lg bg-background border border-border/60 p-1 shadow-sm">
            {[
              { id: "mobile", label: "Phone" },
              { id: "tablet", label: "Tablet" },
              { id: "desktop", label: "Desktop" },
            ].map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setDev(o.id as any)}
                aria-pressed={dev === o.id}
                className={`px-3 py-1.5 text-xs font-body rounded-md transition-colors ${
                  dev === o.id ? "bg-gold text-white" : "text-foreground hover:bg-muted"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <Button variant="gold" size="sm" onClick={() => updateState({ previewMode: false })}>
            <X className="w-4 h-4 mr-1" /> Exit Preview
          </Button>
        </div>
        {frame ? (
          <div className="min-h-screen flex items-start justify-center py-10">
            <div
              className="bg-background rounded-[2rem] border-[10px] border-foreground/80 shadow-2xl overflow-hidden"
              style={{ width: frame.w, height: frame.h }}
              aria-label={`${frame.label} preview`}
            >
              <div className="w-full h-full overflow-y-auto">
                <SitePreview sections={sections.filter((s) => s.visible)} bg={bg} accent={accent} light={light} displayFont={displayFont} bodyFont={bodyFont} />
              </div>
            </div>
          </div>
        ) : (
          <SitePreview sections={sections.filter((s) => s.visible)} bg={bg} accent={accent} light={light} displayFont={displayFont} bodyFont={bodyFont} />
        )}
      </div>
    );
  }

  // ─── Editor Layout ─────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <SEOHead title="Editor – Vowz" description="Edit your wedding website." robots="noindex, nofollow" />
      {/* Top toolbar */}
      <header className="h-14 border-b border-border/50 bg-card/90 backdrop-blur-sm flex items-center px-3 sm:px-4 gap-2 sm:gap-3 shrink-0 z-20">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Heart className="w-5 h-5 text-gold hidden sm:block" fill="currentColor" />
        <span className="font-display text-base sm:text-lg font-semibold text-foreground truncate">
          {siteData.partner1} & {siteData.partner2}
        </span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => updateState({ previewMode: true })}>
          <Eye className="w-4 h-4 mr-1" /> Preview
        </Button>
        {dbSiteId && (
          <Button variant="outline" size="sm" className="hidden md:flex" onClick={() => navigate(`/invitation-card/${dbSiteId}`)}>
            <Mail className="w-4 h-4 mr-1" /> Card
          </Button>
        )}
        <Button variant="outline" size="icon" className="sm:hidden w-9 h-9" onClick={() => updateState({ previewMode: true })}>
          <Eye className="w-4 h-4" />
        </Button>
        <Button variant="gold" size="sm" className="hidden sm:flex" onClick={handleSave}>
          <Save className="w-4 h-4 mr-1" /> Save
        </Button>
        <Button variant="gold" size="icon" className="sm:hidden w-9 h-9" onClick={handleSave}>
          <Save className="w-4 h-4" />
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left sidebar - panel switcher (hidden on mobile, shown as bottom bar) */}
        <div className="hidden md:flex w-14 border-r border-border/50 bg-card/50 flex-col items-center py-3 gap-1 shrink-0">
          {([
            { id: "sections" as const, icon: Type, label: "Sections" },
            { id: "templates" as const, icon: LayoutTemplate, label: "Templates" },
            { id: "style" as const, icon: Palette, label: "Style" },
            { id: "media" as const, icon: HardDrive, label: "Media" },
            { id: "settings" as const, icon: Settings, label: "Settings" },
            { id: "ai" as const, icon: Wand2, label: "AI Assistant" },
          ]).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => updateState({ activePanel: activePanel === id ? null : id })}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                activePanel === id
                  ? "bg-gold/20 text-gold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title={label}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        {/* Left panel content — desktop sidebar, mobile overlay */}
        <AnimatePresence>
          {activePanel && (
            <>
              {/* Mobile backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="md:hidden fixed inset-0 bg-black/40 z-30"
                onClick={() => updateState({ activePanel: null })}
              />
              <motion.div
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed md:relative left-0 top-14 bottom-0 md:top-0 w-[85vw] max-w-[320px] md:w-80 border-r border-border/50 bg-card z-40 md:z-auto overflow-hidden shrink-0"
              >
                <div className="w-full h-full overflow-y-auto p-4">
                  <div className="flex items-center justify-between mb-3 md:hidden">
                    <h3 className="font-display text-lg font-semibold text-foreground capitalize">{activePanel}</h3>
                    <button onClick={() => updateState({ activePanel: null })} className="text-muted-foreground hover:text-foreground">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {activePanel === "sections" && (
                    <SectionsPanel
                      sections={sections}
                      selectedSectionId={selectedSectionId}
                      onSelect={(id) => updateState({ selectedSectionId: id, activePanel: null })}
                      onReorder={(newSections) => updateState({ sections: newSections })}
                      onToggleVisibility={(id) => {
                        const s = sections.find((sec) => sec.id === id);
                        if (s) updateSection(id, { visible: !s.visible });
                      }}
                      onDelete={deleteSection}
                      onAdd={addSection}
                    />
                  )}
                  {activePanel === "style" && (
                    <StylePanel
                      colors={siteData.suggestedColors}
                      onColorChange={(colors) =>
                        updateState({ siteData: { ...siteData, suggestedColors: colors } })
                      }
                      displayFont={displayFont}
                      bodyFont={bodyFont}
                      onFontChange={(display, body) =>
                        updateState({ siteData: { ...siteData, displayFont: display, bodyFont: body } })
                      }
                    />
                  )}
                  {activePanel === "settings" && (
                    <SettingsPanel
                      siteData={siteData}
                      onUpdate={(d) => updateState({ siteData: d })}
                      onRestoreLastSavedStyle={() => {
                        const snap = savedStyleRef.current;
                        if (!snap) {
                          toast({ title: "Nothing to restore yet", description: "Save the site once to create a restore point." });
                          return;
                        }
                        updateState({ siteData: { ...siteData, ...snap } });
                        toast({ title: "Styling restored", description: "Reverted theme, colors, and fonts to the last saved version." });
                      }}
                    />
                  )}
                  {activePanel === "templates" && (
                    <TemplateSwitcherPanel
                      currentColors={siteData.suggestedColors}
                      siteData={siteData}
                      onApply={(templateTheme) => {
                        const newData = { ...siteData, ...templateTheme };
                        updateState({ siteData: newData });
                        toast({ title: "Template applied! ✨" });
                      }}
                    />
                  )}
                  {activePanel === "media" && (
                    <MediaManagerPanel sections={sections} siteData={siteData as any} />
                  )}
                  {activePanel === "ai" && (
                    <AIAssistantPanel
                      siteData={siteData}
                      onApplyChanges={(changes) => {
                        const newData = { ...siteData, ...changes };
                        updateState({ siteData: newData });
                        toast({ title: "AI changes applied! ✨" });
                      }}
                    />
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Center canvas */}
        <div className="flex-1 overflow-y-auto bg-muted/50">
          <div className="max-w-4xl mx-auto py-4 sm:py-8 px-3 sm:px-6">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`relative group mb-4 rounded-xl transition-all ${
                  !section.visible ? "opacity-40" : ""
                } ${
                  selectedSectionId === section.id
                    ? "ring-2 ring-gold ring-offset-2 ring-offset-background"
                    : "hover:ring-1 hover:ring-border"
                }`}
                onClick={() => updateState({ selectedSectionId: section.id })}
              >
                {/* Section label */}
                <div className="absolute -top-3 left-4 z-10 bg-card border border-border/50 rounded-md px-2 py-0.5 text-xs font-body text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {section.title}
                </div>
                <SectionRenderer section={section} bg={bg} accent={accent} light={light} displayFont={displayFont} bodyFont={bodyFont} onUpdateData={(dataPatch) => updateSectionData(section.id, dataPatch)} />
              </div>
            ))}
          </div>
        </div>

        {/* Right panel - section editor — desktop sidebar, mobile bottom sheet */}
        <AnimatePresence>
          {selectedSection && (
            <>
              {/* Mobile backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="md:hidden fixed inset-0 bg-black/40 z-30"
                onClick={() => updateState({ selectedSectionId: null })}
              />
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ duration: 0.25, type: "tween" }}
                className="fixed md:relative bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto
                  max-h-[75vh] md:max-h-none md:h-full
                  w-full md:w-[340px]
                  border-t md:border-t-0 md:border-l border-border/50 bg-card z-40 md:z-auto
                  rounded-t-2xl md:rounded-none overflow-hidden shrink-0"
              >
                <div className="w-full md:w-[340px] h-full overflow-y-auto p-4">
                  {/* Mobile drag handle */}
                  <div className="md:hidden w-10 h-1 rounded-full bg-border mx-auto mb-3" />
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      Edit: {selectedSection.title}
                    </h3>
                    <button
                      onClick={() => updateState({ selectedSectionId: null })}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <SectionEditor
                    section={selectedSection}
                    siteData={siteData}
                    onUpdateData={(data) => updateSectionData(selectedSection.id, data)}
                    onUpdateTitle={(title) => updateSection(selectedSection.id, { title })}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile bottom toolbar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border/50 bg-card/95 backdrop-blur-sm z-20 flex items-center justify-around py-2 px-4">
          {([
            { id: "sections" as const, icon: Type, label: "Sections" },
            { id: "style" as const, icon: Palette, label: "Style" },
            { id: "settings" as const, icon: Settings, label: "Settings" },
          ]).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => updateState({ activePanel: activePanel === id ? null : id, selectedSectionId: null })}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                activePanel === id
                  ? "text-gold"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-body">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Sections Panel (with drag-and-drop reorder) ──────────────────────
function SectionsPanel({
  sections,
  selectedSectionId,
  onSelect,
  onReorder,
  onToggleVisibility,
  onDelete,
  onAdd,
}: {
  sections: WeddingSection[];
  selectedSectionId: string | null;
  onSelect: (id: string) => void;
  onReorder: (sections: WeddingSection[]) => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (type?: string) => void;
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-1">Sections</h3>
      <p className="text-xs text-muted-foreground font-body mb-4">Drag to reorder, click to edit</p>

      <Reorder.Group axis="y" values={sections} onReorder={onReorder} className="space-y-2">
        {sections.map((section) => (
          <Reorder.Item key={section.id} value={section}>
            <div
              className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors ${
                selectedSectionId === section.id
                  ? "bg-gold/10 border border-gold/30"
                  : "bg-background/50 border border-border/30 hover:border-border"
              }`}
              onClick={() => onSelect(section.id)}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab shrink-0" />
              <span className="font-body text-sm flex-1 text-foreground truncate">{section.title}</span>
              <Switch
                checked={section.visible}
                onCheckedChange={() => onToggleVisibility(section.id)}
                onClick={(e) => e.stopPropagation()}
                className="scale-75"
              />
              {(section.type === "custom" || section.type === "polls" || section.type === "ecotips" || section.type === "video" || section.type === "livestream" || section.type === "blessings" || section.type === "guest_album" || section.type === "registry" || section.type === "couple_profiles" || section.type === "music") && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(section.id); }}
                  className="text-muted-foreground hover:text-destructive p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <div className="relative mt-4">
        <Button variant="outline" size="sm" className="w-full font-body" onClick={() => setShowAddMenu(!showAddMenu)}>
          <Plus className="w-4 h-4 mr-1" /> Add Section
        </Button>
        {showAddMenu && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-lg shadow-lg z-10 overflow-hidden">
            {[
              { id: "custom", label: "📝 Custom Section", desc: "Text content" },
              { id: "polls", label: "🗳️ Guest Polls", desc: "Fun voting" },
              { id: "ecotips", label: "🌿 Eco Tips", desc: "Sustainability" },
              { id: "video", label: "🎬 Video Embed", desc: "YouTube/Vimeo" },
              { id: "livestream", label: "📡 Live Stream", desc: "Virtual attendance" },
              { id: "blessings", label: "💕 Blessings Wall", desc: "Guest messages" },
              { id: "guest_album", label: "📸 Guest Album", desc: "Crowdsourced photos & reactions" },
              { id: "registry", label: "🎁 Gift Registry", desc: "Registry links" },
              { id: "couple_profiles", label: "💑 Couple Profiles", desc: "Bride & Groom" },
              { id: "music", label: "🎵 Background Music", desc: "Wedding soundtrack" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onAdd(item.id)}
                className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center justify-between"
              >
                <span className="font-body text-sm text-foreground">{item.label}</span>
                <span className="font-body text-xs text-muted-foreground">{item.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Template Switcher Panel ──────────────────────────────────────────
const TEMPLATE_CATEGORIES = ["All", "Traditional", "Regional", "Modern", "Destination", "Minimal"] as const;
type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];

const TEMPLATE_THEMES: { name: string; style: string; category: TemplateCategory; colors: string[]; displayFont: string; bodyFont: string }[] = [
  { name: "Royal Maroon", style: "Traditional", category: "Traditional", colors: ["#6B1D2A", "#D4A853", "#FFF5E6"], displayFont: "Cormorant Garamond", bodyFont: "DM Sans" },
  { name: "Golden Nikah", style: "Islamic Elegance", category: "Traditional", colors: ["#1A5E3B", "#D4A853", "#FFF5E6"], displayFont: "Cinzel", bodyFont: "Raleway" },
  { name: "Bengali Monsoon", style: "Regional Classic", category: "Traditional", colors: ["#8B0000", "#FFD700", "#FFFACD"], displayFont: "Cormorant Garamond", bodyFont: "DM Sans" },
  { name: "Marigold Fields", style: "Festive Traditional", category: "Traditional", colors: ["#B7410E", "#FFB300", "#FFFDE7"], displayFont: "Cormorant Garamond", bodyFont: "Nunito" },
  { name: "Mughal Romance", style: "Indo-Persian", category: "Traditional", colors: ["#1F3A5F", "#C19A6B", "#FAF0E6"], displayFont: "Cinzel", bodyFont: "Nunito" },

  { name: "Punjabi Fiesta", style: "Regional Vibrant", category: "Regional", colors: ["#FF6B35", "#FFC947", "#FFF8E7"], displayFont: "Montserrat", bodyFont: "Nunito" },
  { name: "Mysore Silk", style: "South Indian Royal", category: "Regional", colors: ["#4B0082", "#DAA520", "#FFF8DC"], displayFont: "Cinzel", bodyFont: "DM Sans" },
  { name: "Kashmiri Snow", style: "Winter Elegance", category: "Regional", colors: ["#2C3E50", "#C0C0C0", "#F8F9FA"], displayFont: "Playfair Display", bodyFont: "Raleway" },
  { name: "Rajasthani Sunset", style: "Desert Royal", category: "Regional", colors: ["#C0392B", "#F39C12", "#FEF9E7"], displayFont: "Great Vibes", bodyFont: "Lato" },
  { name: "Kerala Backwaters", style: "Tropical South", category: "Regional", colors: ["#0B5345", "#76D7C4", "#FDFEFE"], displayFont: "Cormorant Garamond", bodyFont: "Quicksand" },

  { name: "Ivory Blush", style: "Modern Minimal", category: "Modern", colors: ["#4A3728", "#C9A96E", "#FFF8F0"], displayFont: "Playfair Display", bodyFont: "Lato" },
  { name: "Midnight Garden", style: "Moody Luxe", category: "Modern", colors: ["#1A1A2E", "#C9A846", "#E8E8E8"], displayFont: "Playfair Display", bodyFont: "DM Sans" },
  { name: "Velvet Noir", style: "Modern Glam", category: "Modern", colors: ["#1A1A1A", "#B8860B", "#F5F5F5"], displayFont: "Cinzel", bodyFont: "Lato" },
  { name: "Sapphire Night", style: "Luxe Evening", category: "Modern", colors: ["#0D1B2A", "#4FC3F7", "#E8F4FD"], displayFont: "Montserrat", bodyFont: "Raleway" },
  { name: "Lotus Pink", style: "Contemporary Chic", category: "Modern", colors: ["#AD1457", "#F48FB1", "#FFF0F5"], displayFont: "Dancing Script", bodyFont: "Lato" },
  { name: "Rose Petal", style: "Romantic Soft", category: "Modern", colors: ["#922B3E", "#F5B7B1", "#FFF0F0"], displayFont: "Great Vibes", bodyFont: "Quicksand" },

  { name: "Ocean Breeze", style: "Destination Beach", category: "Destination", colors: ["#0C4A6E", "#38BDF8", "#F0FDFA"], displayFont: "Montserrat", bodyFont: "Source Sans 3" },
  { name: "Terracotta Sun", style: "Bohemian Desert", category: "Destination", colors: ["#A0522D", "#E8A87C", "#FFF5E1"], displayFont: "Great Vibes", bodyFont: "Raleway" },
  { name: "Goan Sunlight", style: "Beach Casual", category: "Destination", colors: ["#E67E22", "#3498DB", "#FFF5EE"], displayFont: "Dancing Script", bodyFont: "Source Sans 3" },

  { name: "Emerald Garden", style: "Eco / Nature", category: "Minimal", colors: ["#1B4332", "#8DB370", "#F5F5DC"], displayFont: "Cormorant Garamond", bodyFont: "Quicksand" },
  { name: "Lavender Dream", style: "Fusion / Pastel", category: "Minimal", colors: ["#5B3A6B", "#C8A2D0", "#F8F0FF"], displayFont: "Great Vibes", bodyFont: "Nunito" },
  { name: "Cherry Blossom", style: "Minimal Fusion", category: "Minimal", colors: ["#8B2252", "#FFB7C5", "#FFF5F7"], displayFont: "Dancing Script", bodyFont: "Quicksand" },
  { name: "Teak & Brass", style: "Heritage Minimal", category: "Minimal", colors: ["#5D4037", "#CD853F", "#FAF3E8"], displayFont: "Playfair Display", bodyFont: "DM Sans" },
  { name: "Ivory & Sage", style: "Garden Minimal", category: "Minimal", colors: ["#556B2F", "#9DC183", "#FAFAF0"], displayFont: "Playfair Display", bodyFont: "Quicksand" },

  // 10 new international templates
  { name: "Minimalist White & Gold", style: "Scandinavian Clean", category: "Minimal", colors: ["#FAFAFA", "#D4AF37", "#2C2C2C"], displayFont: "Montserrat", bodyFont: "DM Sans" },
  { name: "Boho Desert Romance", style: "Bohemian Desert", category: "Destination", colors: ["#C4A882", "#E8D5C0", "#5C4033"], displayFont: "Great Vibes", bodyFont: "Raleway" },
  { name: "Modern Geometric", style: "Geometric Bold", category: "Modern", colors: ["#1A1A1A", "#FFFFFF", "#FF6B35"], displayFont: "Montserrat", bodyFont: "Source Sans 3" },
  { name: "Vintage Romance", style: "Victorian Soft", category: "Minimal", colors: ["#D4B896", "#F5E6D3", "#6B4C3B"], displayFont: "Playfair Display", bodyFont: "Lato" },
  { name: "Tropical Paradise", style: "Island Tropical", category: "Destination", colors: ["#1B8A5A", "#F4D35E", "#FAFDF6"], displayFont: "Dancing Script", bodyFont: "Quicksand" },
  { name: "Classic Black Tie", style: "Formal Elegance", category: "Modern", colors: ["#0A1628", "#D4AF37", "#FAF8F0"], displayFont: "Cinzel", bodyFont: "Raleway" },
  { name: "Rustic Barn Wedding", style: "Country Rustic", category: "Destination", colors: ["#8B6914", "#E8D5B7", "#3E2723"], displayFont: "Cormorant Garamond", bodyFont: "Nunito" },
  { name: "Urban Loft", style: "Industrial Modern", category: "Modern", colors: ["#2D2D2D", "#C0C0C0", "#F0EDEB"], displayFont: "Montserrat", bodyFont: "DM Sans" },
  { name: "Garden Ceremony", style: "Botanical Romance", category: "Minimal", colors: ["#4A7C59", "#F5E1DA", "#2F4538"], displayFont: "Playfair Display", bodyFont: "Quicksand" },
  { name: "Destination Sunset", style: "Mediterranean Glow", category: "Destination", colors: ["#FF6B3D", "#FFD93D", "#1A1A2E"], displayFont: "Great Vibes", bodyFont: "Lato" },

  // Previous Indian templates
  { name: "Marigold Fields", style: "Festive Traditional", category: "Traditional", colors: ["#B7410E", "#FFB300", "#FFFDE7"], displayFont: "Cormorant Garamond", bodyFont: "Nunito" },
  { name: "Mughal Romance", style: "Indo-Persian", category: "Traditional", colors: ["#1F3A5F", "#C19A6B", "#FAF0E6"], displayFont: "Cinzel", bodyFont: "Nunito" },
  { name: "Mysore Silk", style: "South Indian Royal", category: "Regional", colors: ["#4B0082", "#DAA520", "#FFF8DC"], displayFont: "Cinzel", bodyFont: "DM Sans" },
  { name: "Kashmiri Snow", style: "Winter Elegance", category: "Regional", colors: ["#2C3E50", "#C0C0C0", "#F8F9FA"], displayFont: "Playfair Display", bodyFont: "Raleway" },
  { name: "Rajasthani Sunset", style: "Desert Royal", category: "Regional", colors: ["#C0392B", "#F39C12", "#FEF9E7"], displayFont: "Great Vibes", bodyFont: "Lato" },
  { name: "Ivory Blush", style: "Modern Minimal", category: "Modern", colors: ["#4A3728", "#C9A96E", "#FFF8F0"], displayFont: "Playfair Display", bodyFont: "Lato" },
  { name: "Sapphire Night", style: "Luxe Evening", category: "Modern", colors: ["#0D1B2A", "#4FC3F7", "#E8F4FD"], displayFont: "Montserrat", bodyFont: "Raleway" },
  { name: "Lotus Pink", style: "Contemporary Chic", category: "Modern", colors: ["#AD1457", "#F48FB1", "#FFF0F5"], displayFont: "Dancing Script", bodyFont: "Lato" },
  { name: "Goan Sunlight", style: "Beach Casual", category: "Destination", colors: ["#E67E22", "#3498DB", "#FFF5EE"], displayFont: "Dancing Script", bodyFont: "Source Sans 3" },
  { name: "Rose Petal", style: "Romantic Soft", category: "Modern", colors: ["#922B3E", "#F5B7B1", "#FFF0F0"], displayFont: "Great Vibes", bodyFont: "Quicksand" },
];

function TemplateSwitcherPanel({
  currentColors,
  siteData,
  onApply,
}: {
  currentColors: string[];
  siteData: WeddingSiteData;
  onApply: (theme: Partial<WeddingSiteData>) => void;
}) {
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const isActive = (t: typeof TEMPLATE_THEMES[0]) =>
    JSON.stringify(currentColors) === JSON.stringify(t.colors) &&
    (siteData.displayFont || "Cormorant Garamond") === t.displayFont;

  const filteredThemes = TEMPLATE_THEMES.filter((t) => {
    const matchesCategory = activeCategory === "All" || t.category === activeCategory;
    const matchesSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.style.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-1">Templates</h3>
      <p className="text-xs text-muted-foreground font-body mb-3">Switch your site's look instantly — your content stays</p>

      {/* Search input */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPreviewIdx(null); }}
          className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border/50 bg-background text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Search templates"
        />
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {TEMPLATE_CATEGORIES.map((cat) => {
          const count = cat === "All" ? TEMPLATE_THEMES.length : TEMPLATE_THEMES.filter((t) => t.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setPreviewIdx(null); }}
              className={`px-2.5 py-1 rounded-full text-xs font-body font-medium transition-all ${
                activeCategory === cat
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {filteredThemes.map((t, i) => {
          const globalIdx = TEMPLATE_THEMES.indexOf(t);
          const active = isActive(t);
          return (
            <div key={t.name}>
              <button
                onClick={() => setPreviewIdx(previewIdx === globalIdx ? null : globalIdx)}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  active ? "border-gold bg-gold/10" : "border-border/50 hover:border-border"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex gap-1">
                    {t.colors.map((c, ci) => (
                      <div key={ci} className="w-4 h-4 rounded-full border border-border/30" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-foreground font-display flex-1">{t.name}</span>
                  {active && <Check className="w-4 h-4 text-gold" />}
                </div>
                <p className="text-xs text-muted-foreground font-body">{t.style} • {t.displayFont}</p>
              </button>

              {/* Expanded preview */}
              <AnimatePresence>
                {previewIdx === globalIdx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 rounded-lg overflow-hidden border border-border/30">
                      {/* Mini hero preview with user's content */}
                      <div
                        className="px-4 py-6 text-center"
                        style={{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[0]}dd)` }}
                      >
                        <Heart className="w-5 h-5 mx-auto mb-1" style={{ color: t.colors[1] }} fill="currentColor" />
                        <p className="text-lg font-bold" style={{ color: t.colors[2], fontFamily: `'${t.displayFont}', serif` }}>
                          {siteData.partner1} & {siteData.partner2}
                        </p>
                        <p className="text-xs italic mt-0.5" style={{ color: t.colors[1], fontFamily: `'${t.displayFont}', serif` }}>
                          {siteData.tagline}
                        </p>
                      </div>
                      <div className="p-3 bg-card">
                        <p className="text-xs text-muted-foreground text-center line-clamp-2" style={{ fontFamily: `'${t.bodyFont}', sans-serif` }}>
                          {siteData.howWeMet}
                        </p>
                        <Button
                          variant="gold"
                          size="sm"
                          className="w-full mt-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadGoogleFont(t.displayFont);
                            loadGoogleFont(t.bodyFont);
                            onApply({
                              suggestedColors: t.colors,
                              displayFont: t.displayFont,
                              bodyFont: t.bodyFont,
                            });
                          }}
                          disabled={active}
                        >
                          {active ? "Currently Active" : "Apply This Template"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AI Assistant Panel ───────────────────────────────────────────────
type AIChatMessage = { role: "user" | "assistant"; content: string };

function AIAssistantPanel({
  siteData,
  onApplyChanges,
}: {
  siteData: WeddingSiteData;
  onApplyChanges: (changes: Partial<WeddingSiteData>) => void;
}) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const parseAndApplyActions = (text: string) => {
    const actionMatch = text.match(/```action\s*([\s\S]*?)\s*```/);
    if (!actionMatch) return;
    try {
      const action = JSON.parse(actionMatch[1]);
      if (action.data) {
        const changes: Partial<WeddingSiteData> = {};
        if (action.data.suggestedColors) changes.suggestedColors = action.data.suggestedColors;
        if (action.data.displayFont) changes.displayFont = action.data.displayFont;
        if (action.data.bodyFont) changes.bodyFont = action.data.bodyFont;
        if (action.data.theme) changes.theme = action.data.theme;
        if (action.data.tagline) changes.tagline = action.data.tagline;
        if (action.type === "update_content" && action.data.field && action.data.value) {
          (changes as any)[action.data.field] = action.data.value;
        }
        if (Object.keys(changes).length > 0) onApplyChanges(changes);
      }
    } catch { /* not valid json */ }
  };

  const streamResponse = async (allMessages: AIChatMessage[]) => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/editor-ai`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages, siteContext: siteData }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || `Error ${resp.status}`);
    }
    if (!resp.body) throw new Error("No response stream");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
              }
              return [...prev, { role: "assistant", content: assistantSoFar }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    return assistantSoFar;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: AIChatMessage = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    try {
      const assistantText = await streamResponse(allMessages);
      parseAndApplyActions(assistantText);
      // Clean action blocks from displayed message
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1 && m.role === "assistant"
            ? { ...m, content: m.content.replace(/```action[\s\S]*?```/g, "").trim() }
            : m
        )
      );
    } catch (e) {
      console.error("AI error:", e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, something went wrong: ${e instanceof Error ? e.message : "Unknown error"}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { label: "🎨 Suggest a theme", prompt: `Suggest a complete theme (colors, fonts, tagline) that perfectly suits ${siteData.partner1} & ${siteData.partner2}'s ${siteData.culturalBackground} wedding. Apply it directly.` },
    { label: "✍️ Rewrite our story", prompt: "Rewrite our love story to be more romantic and engaging. Apply it." },
    { label: "💐 New tagline", prompt: "Generate a beautiful new tagline for our wedding website and apply it." },
    { label: "🎊 Wedding tips", prompt: `What are the key traditions and customs we should include for a ${siteData.culturalBackground} wedding?` },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-gold" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">AI Assistant</h3>
          <p className="text-xs text-muted-foreground font-body">Ask anything about your wedding site</p>
        </div>
      </div>

      {/* Quick prompts */}
      {messages.length === 0 && (
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {quickPrompts.map((qp) => (
            <button
              key={qp.label}
              onClick={() => {
                setInput(qp.prompt);
                setTimeout(() => {
                  setInput("");
                  const userMsg: AIChatMessage = { role: "user", content: qp.prompt };
                  const allMessages = [userMsg];
                  setMessages(allMessages);
                  setIsLoading(true);
                  streamResponse(allMessages)
                    .then((text) => {
                      parseAndApplyActions(text);
                      setMessages((prev) =>
                        prev.map((m, i) =>
                          i === prev.length - 1 && m.role === "assistant"
                            ? { ...m, content: m.content.replace(/```action[\s\S]*?```/g, "").trim() }
                            : m
                        )
                      );
                    })
                    .catch(console.error)
                    .finally(() => setIsLoading(false));
                }, 0);
              }}
              className="text-xs font-body text-left p-2 rounded-lg border border-border/50 hover:border-gold/50 hover:bg-gold/5 transition-colors text-muted-foreground hover:text-foreground"
            >
              {qp.label}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 font-body text-xs leading-relaxed">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="font-body text-xs leading-relaxed">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl rounded-bl-sm px-3 py-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-1.5">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask AI anything..."
          className="h-9 text-xs font-body flex-1"
          disabled={isLoading}
        />
        <Button
          variant="gold"
          size="icon"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="h-9 w-9 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Style Panel ──────────────────────────────────────────────────────
function StylePanel({
  colors,
  onColorChange,
  displayFont,
  bodyFont,
  onFontChange,
}: {
  colors: string[];
  onColorChange: (colors: string[]) => void;
  displayFont: string;
  bodyFont: string;
  onFontChange: (display: string, body: string) => void;
}) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-1">Style</h3>
      <p className="text-xs text-muted-foreground font-body mb-4">Customize your site's look</p>

      <div className="space-y-6">
        {/* Color Palette */}
        <div>
          <label className="font-body text-sm font-medium text-foreground mb-2 block">Color Palette</label>
          <div className="grid grid-cols-3 gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onColorChange(preset.colors)}
                className={`p-2 rounded-lg border transition-colors ${
                  JSON.stringify(colors) === JSON.stringify(preset.colors)
                    ? "border-gold bg-gold/10"
                    : "border-border/50 hover:border-border"
                }`}
              >
                <div className="flex gap-1 mb-1.5">
                  {preset.colors.map((c, i) => (
                    <div key={i} className="w-5 h-5 rounded-full border border-border/30" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <p className="text-xs font-body text-muted-foreground">{preset.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Colors */}
        <div>
          <label className="font-body text-sm font-medium text-foreground mb-2 block">Custom Colors</label>
          <div className="space-y-2">
            {["Background", "Accent", "Light"].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <input
                  type="color"
                  value={colors[i] || "#000000"}
                  onChange={(e) => {
                    const newColors = [...colors];
                    newColors[i] = e.target.value;
                    onColorChange(newColors);
                  }}
                  className="w-8 h-8 rounded border border-border/50 cursor-pointer"
                  aria-label={`${label} color`}
                />
                <span className="font-body text-sm text-muted-foreground">{label}</span>
                <span className="font-body text-xs text-muted-foreground/60 ml-auto">{colors[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Font Picker */}
        <div>
          <label className="font-body text-sm font-medium text-foreground mb-2 block">Typography</label>
          <div className="space-y-2">
            {FONT_PRESETS.map((preset) => {
              const isActive = displayFont === preset.display && bodyFont === preset.body;
              return (
                <button
                  key={preset.name}
                  onClick={() => {
                    loadGoogleFont(preset.display);
                    loadGoogleFont(preset.body);
                    onFontChange(preset.display, preset.body);
                  }}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    isActive ? "border-gold bg-gold/10" : "border-border/50 hover:border-border"
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground mb-0.5" style={{ fontFamily: `'${preset.display}', serif` }}>
                    {preset.name}
                  </p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: `'${preset.body}', sans-serif` }}>
                    {preset.display} + {preset.body}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const LANG_OPTIONS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "Hindi (हिन्दी)", flag: "🇮🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "ta", label: "Tamil (தமிழ்)", flag: "🇮🇳" },
  { code: "te", label: "Telugu (తెలుగు)", flag: "🇮🇳" },
  { code: "ml", label: "Malayalam (മലയാളം)", flag: "🇮🇳" },
  { code: "bn", label: "Bengali (বাংলা)", flag: "🇮🇳" },
  { code: "mr", label: "Marathi (मराठी)", flag: "🇮🇳" },
  { code: "gu", label: "Gujarati (ગુજરાતી)", flag: "🇮🇳" },
  { code: "kn", label: "Kannada (ಕನ್ನಡ)", flag: "🇮🇳" },
  { code: "pa", label: "Punjabi (ਪੰਜਾਬੀ)", flag: "🇮🇳" },
  { code: "ur", label: "Urdu (اردو)", flag: "🇵🇰" },
];

const TRANSLATABLE_KEYS = [
  { key: "tagline", label: "Tagline" },
  { key: "hero_subheading", label: "Hero Subtitle" },
  { key: "story_heading", label: "Our Story Heading" },
  { key: "story_body", label: "Our Story Text" },
  { key: "events_heading", label: "Events Heading" },
  { key: "gallery_heading", label: "Gallery Heading" },
  { key: "rsvp_heading", label: "RSVP Heading" },
  { key: "rsvp_description", label: "RSVP Description" },
  { key: "guestbook_heading", label: "Guestbook Heading" },
  { key: "travel_heading", label: "Travel Info Heading" },
  { key: "countdown_label", label: "Countdown Label" },
  { key: "blessings_heading", label: "Blessings Heading" },
  { key: "registry_heading", label: "Registry Heading" },
  { key: "livestream_heading", label: "Livestream Heading" },
];

function TranslationLanguageBlock({
  langCode,
  langLabel,
  langFlag,
  translations,
  sections,
  onUpdateTranslations,
  onRemoveLanguage,
}: {
  langCode: string;
  langLabel: string;
  langFlag: string;
  translations: Record<string, string>;
  sections: any;
  onUpdateTranslations: (updated: Record<string, string>) => void;
  onRemoveLanguage: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border/50 rounded-lg mb-3 overflow-hidden">
      <div className="flex items-center gap-2 p-2.5 bg-muted/30 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <span className="text-sm">{langFlag}</span>
        <span className="font-body text-sm font-medium text-foreground flex-1">{langLabel}</span>
        <span className="text-[10px] font-body text-muted-foreground">
          {Object.values(translations).filter(Boolean).length}/{TRANSLATABLE_KEYS.length} translated
        </span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </div>
      {expanded && (
        <div className="p-3 space-y-3 border-t border-border/30">
          {TRANSLATABLE_KEYS.map(({ key, label }) => (
            <div key={key}>
              <label className="font-body text-xs text-muted-foreground mb-1 block">{label}</label>
              <Input
                placeholder={`${label} in ${langLabel}…`}
                value={translations[key] || ""}
                onChange={(e) => onUpdateTranslations({ ...translations, [key]: e.target.value })}
                className="font-body text-sm h-8"
              />
            </div>
          ))}
          <div className="pt-2 border-t border-border/30">
            <Button
              variant="ghost"
              size="sm"
              className="font-body text-xs text-destructive hover:text-destructive w-full"
              onClick={onRemoveLanguage}
            >
              <Trash2 className="w-3 h-3 mr-1" /> Remove {langLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────
function SettingsPanel({
  siteData,
  onUpdate,
  onRestoreLastSavedStyle,
}: {
  siteData: WeddingSiteData;
  onUpdate: (data: WeddingSiteData) => void;
  onRestoreLastSavedStyle?: () => void;
}) {
  // Apply a theme/style change with a toast-level Undo. Snapshots only the
  // style fields — content (names, story, events, gallery) is never touched.
  const applyThemeWithUndo = (
    patch: Partial<WeddingSiteData>,
    label: string,
  ) => {
    const prev = {
      theme: siteData.theme,
      suggestedColors: siteData.suggestedColors,
      displayFont: (siteData as any).displayFont,
      bodyFont: (siteData as any).bodyFont,
    };
    onUpdate({ ...siteData, ...patch } as WeddingSiteData);
    toast({
      title: `Applied ${label}`,
      description: "Only theme, colors and fonts changed. Tap Undo to revert.",
      action: (
        <button
          type="button"
          onClick={() => onUpdate({ ...siteData, ...prev } as WeddingSiteData)}
          className="inline-flex items-center gap-1 rounded-md border border-gold/50 bg-gold/10 hover:bg-gold/20 text-gold px-2.5 py-1 text-xs font-body"
        >
          Undo
        </button>
      ) as any,
    });
  };
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-1">Settings</h3>
      <p className="text-xs text-muted-foreground font-body mb-4">General site information</p>

      <div className="space-y-4">
        <div>
          <label className="font-body text-sm font-medium text-foreground mb-1 block">Partner 1</label>
          <Input
            value={siteData.partner1}
            onChange={(e) => onUpdate({ ...siteData, partner1: e.target.value })}
            className="font-body"
          />
        </div>
        <div>
          <label className="font-body text-sm font-medium text-foreground mb-1 block">Partner 2</label>
          <Input
            value={siteData.partner2}
            onChange={(e) => onUpdate({ ...siteData, partner2: e.target.value })}
            className="font-body"
          />
        </div>
        <div>
          <label className="font-body text-sm font-medium text-foreground mb-1 block">Cultural Background</label>
          <Input
            value={siteData.culturalBackground}
            onChange={(e) => onUpdate({ ...siteData, culturalBackground: e.target.value })}
            className="font-body"
          />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <label className="font-body text-sm font-medium text-foreground">Theme</label>
            {onRestoreLastSavedStyle && (
              <button
                type="button"
                onClick={onRestoreLastSavedStyle}
                className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background hover:bg-muted/40 text-foreground px-2 py-1 text-[11px] font-body"
                title="Discard unsaved theme, color, and font changes. Content stays as is."
              >
                <RotateCcw className="w-3 h-3" /> Restore last saved
              </button>
            )}
          </div>
          <p className="font-body text-xs text-muted-foreground mb-2">
            Switch themes anytime — only colors and typography change, your names, story, events, and gallery stay intact.
          </p>
          <div className="mb-3 rounded-lg border border-gold/30 bg-gold/5 p-2.5 text-[11px] font-body leading-relaxed">
            <p className="font-semibold text-foreground mb-1">What a theme change updates</p>
            <div className="grid grid-cols-2 gap-2">
              <ul className="space-y-0.5 text-foreground/80">
                <li className="flex items-start gap-1"><Check className="w-3 h-3 mt-0.5 text-gold shrink-0" /> Colors & palette</li>
                <li className="flex items-start gap-1"><Check className="w-3 h-3 mt-0.5 text-gold shrink-0" /> Display & body fonts</li>
                <li className="flex items-start gap-1"><Check className="w-3 h-3 mt-0.5 text-gold shrink-0" /> Background motif</li>
              </ul>
              <ul className="space-y-0.5 text-muted-foreground">
                <li className="flex items-start gap-1"><X className="w-3 h-3 mt-0.5 shrink-0" /> Names, story, tagline</li>
                <li className="flex items-start gap-1"><X className="w-3 h-3 mt-0.5 shrink-0" /> Events, dates, venues</li>
                <li className="flex items-start gap-1"><X className="w-3 h-3 mt-0.5 shrink-0" /> Gallery, RSVP, guestbook</li>
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => applyThemeWithUndo(
                { theme: "", displayFont: undefined, bodyFont: undefined } as any,
                "no theme",
              )}
              className={`rounded-lg border-2 px-3 py-2 text-left transition-all ${
                !siteData.theme ? "border-gold bg-gold/10" : "border-border hover:border-gold/40"
              }`}
            >
              <p className="font-body text-xs font-semibold text-foreground">No theme</p>
              <p className="font-body text-[10px] text-muted-foreground">Use my own styling</p>
            </button>
            {WEDDING_THEMES.map((t) => {
              const active = siteData.theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyThemeWithUndo(
                    {
                      theme: t.id,
                      suggestedColors: [t.colors.bg, t.colors.accent, t.colors.light],
                      displayFont: t.fonts.display,
                      bodyFont: t.fonts.body,
                    } as any,
                    t.name,
                  )}
                  className={`rounded-lg border-2 px-3 py-2 text-left transition-all ${
                    active ? "border-gold bg-gold/10" : "border-border hover:border-gold/40"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-3 h-3 rounded-full border" style={{ background: t.colors.bg }} />
                    <span className="w-3 h-3 rounded-full border" style={{ background: t.colors.accent }} />
                    <span className="w-3 h-3 rounded-full border" style={{ background: t.colors.light }} />
                    {active && <Check className="w-3 h-3 text-gold ml-auto" />}
                  </div>
                  <p className="font-body text-xs font-semibold text-foreground truncate">{t.name}</p>
                  <p className="font-body text-[10px] text-muted-foreground truncate">{t.tradition}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured Image for Social Sharing */}
        <div className="border-t border-border/30 pt-4 mt-4">
          <label className="font-body text-sm font-medium text-foreground mb-2 block">
            Featured Image for Sharing 📱 <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <p className="font-body text-xs text-muted-foreground mb-2">
            This image appears as a preview card when your wedding site is shared on WhatsApp, Facebook, X, or any social media. Upload a beautiful couple photo or wedding card design (1200×630px recommended).
          </p>
          <FeaturedImageUploader
            imageUrl={(siteData as any).featuredImageUrl || ""}
            onImageChange={(url) => onUpdate({ ...siteData, featuredImageUrl: url } as any)}
          />
        </div>


        <div className="border-t border-border/30 pt-4 mt-4">
          <label className="font-body text-sm font-medium text-foreground mb-2 block">Post-Wedding Mode</label>
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-background">
            <input
              type="checkbox"
              checked={siteData.memoryMode || false}
              onChange={(e) => onUpdate({ ...siteData, memoryMode: e.target.checked })}
              className="rounded mt-0.5"
              aria-label="Enable Memory Mode"
            />
            <div>
              <p className="font-body text-sm text-foreground">Enable Memory Mode 📸</p>
              <p className="font-body text-xs text-muted-foreground mt-0.5">
                Keep your site live as a wedding archive. Guests can revisit memories, view photos, and relive the celebration.
              </p>
            </div>
          </div>
        </div>

        {/* Password Protection */}
        <div className="border-t border-border/30 pt-4 mt-4">
          <label className="font-body text-sm font-medium text-foreground mb-2 block">Password Protection 🔒</label>
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-background">
              <input
                type="checkbox"
                checked={!!siteData.sitePassword}
                onChange={(e) => {
                  if (e.target.checked) {
                    // Generate a random default so no two sites share a guessable password.
                    const random = (typeof crypto !== "undefined" && "randomUUID" in crypto
                      ? crypto.randomUUID().replace(/-/g, "")
                      : Math.random().toString(36).slice(2)
                    ).slice(0, 10);
                    onUpdate({ ...siteData, sitePassword: random });
                  } else {
                    onUpdate({ ...siteData, sitePassword: "" });
                  }
                }}
                className="rounded mt-0.5"
                aria-label="Require password to view site"
              />
              <div className="flex-1">
                <p className="font-body text-sm text-foreground">Require password to view site</p>
                <p className="font-body text-xs text-muted-foreground mt-0.5">
                  Guests will need to enter a password before they can see your wedding site.
                </p>
              </div>
            </div>
            {siteData.sitePassword && (
              <Input
                value={siteData.sitePassword}
                onChange={(e) => onUpdate({ ...siteData, sitePassword: e.target.value })}
                placeholder="Enter site password"
                className="font-body"
              />
            )}
          </div>
        </div>

        {/* Multilingual */}
        <div className="border-t border-border/30 pt-4 mt-4">
          <label className="font-body text-sm font-medium text-foreground mb-2 block">Site Language 🌐</label>
          <select
            value={siteData.siteLanguage || "en"}
            onChange={(e) => onUpdate({ ...siteData, siteLanguage: e.target.value })}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-body text-sm text-foreground"
            aria-label="Site language"
          >
            {LANG_OPTIONS.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <p className="font-body text-xs text-muted-foreground mt-1.5">
            Primary language for your site content.
          </p>
        </div>

        {/* Translation Editor */}
        <div className="border-t border-border/30 pt-4 mt-4">
          <label className="font-body text-sm font-medium text-foreground mb-2 block">Translations ✨</label>
          <p className="font-body text-xs text-muted-foreground mb-3">
            Add translated versions of your content so guests can view your site in their language.
          </p>

          {/* Add language */}
          <div className="flex gap-2 mb-3">
            <select
              id="add-lang-select"
              className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 font-body text-xs text-foreground"
              defaultValue=""
              aria-label="Add a translation language"
            >
              <option value="" disabled>Add a language…</option>
              {LANG_OPTIONS.filter((l) => l.code !== "en" && !(siteData.availableLanguages || []).includes(l.code)).map((l) => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              className="font-body text-xs shrink-0"
              onClick={() => {
                const sel = document.getElementById("add-lang-select") as HTMLSelectElement;
                if (sel.value) {
                  const langs = [...(siteData.availableLanguages || ["en"]), sel.value];
                  const translations = { ...(siteData.translations || {}), [sel.value]: {} };
                  onUpdate({ ...siteData, availableLanguages: langs, translations });
                  sel.value = "";
                }
              }}
            >
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>

          {/* Translation sections per language */}
          {(siteData.availableLanguages || ["en"]).filter((l) => l !== "en").map((langCode) => {
            const langLabel = LANG_OPTIONS.find((l) => l.code === langCode)?.label || langCode;
            const langFlag = LANG_OPTIONS.find((l) => l.code === langCode)?.flag || "🌐";
            const langTranslations = siteData.translations?.[langCode] || {};

            return (
              <TranslationLanguageBlock
                key={langCode}
                langCode={langCode}
                langLabel={langLabel}
                langFlag={langFlag}
                translations={langTranslations}
                sections={siteData}
                onUpdateTranslations={(updated) => {
                  onUpdate({
                    ...siteData,
                    translations: { ...(siteData.translations || {}), [langCode]: updated },
                  });
                }}
                onRemoveLanguage={() => {
                  const langs = (siteData.availableLanguages || []).filter((l) => l !== langCode);
                  const translations = { ...(siteData.translations || {}) };
                  delete translations[langCode];
                  onUpdate({ ...siteData, availableLanguages: langs, translations });
                }}
              />
            );
          })}

          {(siteData.availableLanguages || ["en"]).length <= 1 && (
            <div className="text-center py-4 border border-dashed border-border/50 rounded-lg">
              <p className="font-body text-xs text-muted-foreground">No additional languages added yet.</p>
              <p className="font-body text-[10px] text-muted-foreground mt-1">Add a language above to start translating your content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section Editor (right panel) ─────────────────────────────────────
function SectionEditor({
  section,
  siteData,
  onUpdateData,
  onUpdateTitle,
}: {
  section: WeddingSection;
  siteData: WeddingSiteData;
  onUpdateData: (data: Record<string, any>) => void;
  onUpdateTitle: (title: string) => void;
}) {
  const { type, data } = section;
  const { generate, loading: aiLoading } = useAIContentGen();
  const { uploadToR2 } = useR2Upload();
  const [musicUploading, setMusicUploading] = useState(false);
  const musicFileRef = useRef<HTMLInputElement | null>(null);

  const handleMusicUpload = async (file: File) => {
    if (!file) return;
    // 15 MB soft cap for background tracks
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an audio file under 15 MB.", variant: "destructive" as any });
      return;
    }
    setMusicUploading(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
      const result = await uploadToR2(file, `music/${Date.now()}-${safe}`);
      if (!result?.url) throw new Error("Upload failed");
      const cleanName = file.name.replace(/\.[^.]+$/, "");
      onUpdateData({ trackUrl: result.url, trackName: cleanName || "My Track", category: "custom" });
      toast({ title: "Track uploaded 🎵", description: cleanName });
    } catch (err: any) {
      toast({ title: "Couldn't upload track", description: err?.message || "Please try again.", variant: "destructive" as any });
    } finally {
      setMusicUploading(false);
      if (musicFileRef.current) musicFileRef.current.value = "";
    }
  };

  const aiContext = {
    partner1: siteData.partner1,
    partner2: siteData.partner2,
    culturalBackground: siteData.culturalBackground,
    howWeMet: siteData.howWeMet,
    theme: siteData.theme,
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="font-body text-sm font-medium text-foreground mb-1 block">Section Name</label>
        <Input value={section.title} onChange={(e) => onUpdateTitle(e.target.value)} className="font-body" />
      </div>

      {(type === "hero") && (
        <>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Subtitle</label>
            <Input
              value={data.subheading || ""}
              onChange={(e) => onUpdateData({ subheading: e.target.value })}
              className="font-body"
            />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Names</label>
            <Input
              value={data.heading || ""}
              onChange={(e) => onUpdateData({ heading: e.target.value })}
              className="font-body"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-body text-sm font-medium text-foreground">Tagline</label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-accent hover:text-accent px-2"
                disabled={aiLoading === "tagline"}
                onClick={async () => {
                  const result = await generate({ type: "tagline", context: aiContext });
                  if (result) onUpdateData({ tagline: result });
                }}
              >
                {aiLoading === "tagline" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Wand2 className="w-3 h-3 mr-1" /> AI</>}
              </Button>
            </div>
            <Input
              value={data.tagline || ""}
              onChange={(e) => onUpdateData({ tagline: e.target.value })}
              className="font-body"
            />
          </div>
          <LogoUploader
            logoUrl={data.logoUrl || ""}
            onLogoChange={(url) => onUpdateData({ logoUrl: url })}
          />
          <HeroImageUploader
            imageUrl={data.heroImageUrl || ""}
            onImageChange={(url) => onUpdateData({ heroImageUrl: url })}
          />
        </>
      )}

      {(type === "story" || type === "custom") && (
        <>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Heading</label>
            <Input
              value={data.heading || ""}
              onChange={(e) => onUpdateData({ heading: e.target.value })}
              className="font-body"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-body text-sm font-medium text-foreground">Content</label>
              {type === "story" && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-accent hover:text-accent px-2"
                    disabled={aiLoading === "story"}
                    onClick={async () => {
                      const result = await generate({ type: "story", context: aiContext });
                      if (result) onUpdateData({ body: result });
                    }}
                  >
                    {aiLoading === "story" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Wand2 className="w-3 h-3 mr-1" /> AI Rewrite</>}
                  </Button>
                  {data.body && data.body.length > 80 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-amber-600 hover:text-amber-700 px-2"
                      disabled={aiLoading === "story_short"}
                      onClick={async () => {
                        const result = await generate({
                          type: "story_short" as any,
                          context: { ...aiContext, currentStory: data.body },
                        });
                        if (result) onUpdateData({ body: result });
                      }}
                    >
                      {aiLoading === "story_short" ? <Loader2 className="w-3 h-3 animate-spin" /> : "✂️ Shorter"}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
                    onClick={() => {
                      if (data.body && data.body.trim() && data.body.trim() !== DEFAULT_STORY.trim()) {
                        if (!confirm("Reset your story to the default passage? Your current text will be replaced.")) return;
                      }
                      onUpdateData({ body: DEFAULT_STORY });
                      toast({ title: "Story reset", description: "Default passage restored." });
                    }}
                    title="Reset to the universal default story"
                  >
                    ↺ Reset
                  </Button>
                </div>
              )}
            </div>
            <Textarea
              value={data.body || ""}
              onChange={(e) => onUpdateData({ body: e.target.value })}
              rows={5}
              className="font-body"
            />
            {type === "story" && (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-body mr-1">Quick templates:</span>
                  {STORY_TEMPLATES.map((tpl) => (
                    <Button
                      key={tpl.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs px-2 font-body"
                      onClick={() => onUpdateData({ body: tpl.body })}
                      title={`Use the ${tpl.label} template`}
                    >
                      <span className="mr-1">{tpl.emoji}</span>{tpl.label}
                    </Button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground font-body mt-1.5">
                  💡 Pick a template above, let AI rewrite it, or make it your own.
                </p>
              </>
            )}
          </div>
        </>
      )}

      {type === "couple_profiles" && (
        <>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Section Heading</label>
            <Input value={data.heading || ""} onChange={(e) => onUpdateData({ heading: e.target.value })} className="font-body" />
          </div>
          <div className="space-y-4 mt-2">
            <div className="border border-border/50 rounded-lg p-3 space-y-2">
              <p className="font-body text-sm font-medium text-foreground">Partner 1 (Bride)</p>
              <Input placeholder="Name" value={data.partner1Name || ""} onChange={(e) => onUpdateData({ partner1Name: e.target.value })} className="font-body text-sm" />
              <Textarea placeholder="Short bio (2-3 sentences)" value={data.partner1Bio || ""} onChange={(e) => onUpdateData({ partner1Bio: e.target.value })} rows={2} className="font-body text-sm" />
              <CouplePhotoUploader
                label="Partner 1 Photo"
                currentUrl={data.partner1Photo || ""}
                onPhotoChange={(url) => onUpdateData({ partner1Photo: url })}
              />
            </div>
            <div className="border border-border/50 rounded-lg p-3 space-y-2">
              <p className="font-body text-sm font-medium text-foreground">Partner 2 (Groom)</p>
              <Input placeholder="Name" value={data.partner2Name || ""} onChange={(e) => onUpdateData({ partner2Name: e.target.value })} className="font-body text-sm" />
              <Textarea placeholder="Short bio (2-3 sentences)" value={data.partner2Bio || ""} onChange={(e) => onUpdateData({ partner2Bio: e.target.value })} rows={2} className="font-body text-sm" />
              <CouplePhotoUploader
                label="Partner 2 Photo"
                currentUrl={data.partner2Photo || ""}
                onPhotoChange={(url) => onUpdateData({ partner2Photo: url })}
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground font-body mt-1">
            💡 Add personal profiles for your guests to learn more about you both — optional and easy to skip.
          </p>
        </>
      )}

      {type === "events" && (
        <>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Section Heading</label>
            <Input
              value={data.heading || ""}
              onChange={(e) => onUpdateData({ heading: e.target.value })}
              className="font-body"
            />
          </div>
          <div className="space-y-3">
            <label className="font-body text-sm font-medium text-foreground block">Events</label>
            {(data.events || []).map((event: any, i: number) => (
              <EventEditor
                key={i}
                event={event}
                index={i}
                onChange={(updated) => {
                  const events = [...data.events];
                  events[i] = updated;
                  onUpdateData({ events });
                }}
                onDelete={() => {
                  const events = data.events.filter((_: any, j: number) => j !== i);
                  onUpdateData({ events });
                }}
                onGenerateDescription={async (eventName: string) => {
                  const result = await generate({
                    type: "event_description",
                    context: { ...aiContext, eventName },
                  });
                  if (result) {
                    const events = [...data.events];
                    events[i] = { ...events[i], description: result };
                    onUpdateData({ events });
                  }
                }}
                aiLoading={aiLoading}
              />
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full font-body"
              onClick={() =>
                onUpdateData({
                  events: [...(data.events || []), { name: "New Event", date: "", time: "", venue: "" }],
                })
              }
            >
              <Plus className="w-3 h-3 mr-1" /> Add Event
            </Button>
            {(() => {
              const hasDated = (data.events || []).some((e: any) => !!parseEventStart(e?.date, e?.time));
              if (!hasDated) return null;
              return (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full font-body text-xs"
                  onClick={() => downloadAllEventsIcs(data.events || [], data.heading)}
                >
                  <Download className="w-3 h-3 mr-1" /> Download all events (.ics)
                </Button>
              );
            })()}
          </div>
        </>
      )}

      {type === "gallery" && (
        <GalleryEditor
          photos={(data.photos as GalleryPhoto[]) || []}
          heading={data.heading || ""}
          onUpdateHeading={(heading) => onUpdateData({ heading })}
          onUpdatePhotos={(photos) => onUpdateData({ photos })}
        />
      )}

      {type === "rsvp" && (
        <>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Heading</label>
            <Input
              value={data.heading || ""}
              onChange={(e) => onUpdateData({ heading: e.target.value })}
              className="font-body"
            />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Message</label>
            <Textarea
              value={data.body || ""}
              onChange={(e) => onUpdateData({ body: e.target.value })}
              rows={3}
              className="font-body"
            />
          </div>
          <div className="rounded-lg border border-border/50 p-3 space-y-2">
            <p className="font-body text-xs font-semibold text-foreground uppercase tracking-wide">Guest polling fields</p>
            {[
              { key: "show_meal", label: "Meal preference (veg / non-veg / vegan)" },
              { key: "show_dietary_tags", label: "Dietary tags (gluten-free, jain, halal, nut-free…)" },
              { key: "show_events", label: "Per-event attendance (haldi, mehendi, wedding…)" },
              { key: "show_dietary_notes", label: "Dietary notes / allergies (free text)" },
              { key: "show_custom_polls", label: "Link to custom polls the couple defines" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 font-body text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={data[key] !== false}
                  onChange={(e) => onUpdateData({ [key]: e.target.checked })}
                  className="accent-gold"
                />
                {label}
              </label>
            ))}
          </div>
          <div className="rounded-lg border border-border/50 p-3 space-y-2">
            <p className="font-body text-xs font-semibold text-foreground uppercase tracking-wide">WhatsApp sharing</p>
            <label className="flex items-center gap-2 font-body text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={data.show_whatsapp_share !== false}
                onChange={(e) => onUpdateData({ show_whatsapp_share: e.target.checked })}
                className="accent-gold"
              />
              Show "Share on WhatsApp" after a guest RSVPs
            </label>
            <label className="font-body text-xs text-muted-foreground block mt-2">Custom WhatsApp invite message (optional)</label>
            <Textarea
              value={data.whatsapp_invite_message || ""}
              onChange={(e) => onUpdateData({ whatsapp_invite_message: e.target.value })}
              rows={2}
              placeholder="You're invited to our wedding — please RSVP:"
              className="font-body"
            />
          </div>
        </>
      )}

      {type === "countdown" && (
        <>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Label</label>
            <Input
              value={data.label || ""}
              onChange={(e) => onUpdateData({ label: e.target.value })}
              className="font-body"
            />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Wedding Date</label>
            <Input
              type="date"
              value={data.date || ""}
              onChange={(e) => onUpdateData({ date: e.target.value })}
              className="font-body"
            />
          </div>
        </>
      )}

      {type === "guestbook" && (
        <>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Heading</label>
            <Input
              value={data.heading || ""}
              onChange={(e) => onUpdateData({ heading: e.target.value })}
              className="font-body"
            />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Description</label>
            <Textarea
              value={data.description || ""}
              onChange={(e) => onUpdateData({ description: e.target.value })}
              rows={3}
              className="font-body"
            />
          </div>
        </>
      )}

      {type === "travel" && (
        <>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Heading</label>
            <Input
              value={data.heading || ""}
              onChange={(e) => onUpdateData({ heading: e.target.value })}
              className="font-body"
            />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Description</label>
            <Textarea
              value={data.description || ""}
              onChange={(e) => onUpdateData({ description: e.target.value })}
              rows={2}
              className="font-body"
            />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Directions / Tips</label>
            <Textarea
              value={data.directions || ""}
              onChange={(e) => onUpdateData({ directions: e.target.value })}
              rows={3}
              className="font-body"
            />
          </div>
          <div className="space-y-3">
            <label className="font-body text-sm font-medium text-foreground block">Hotels / Accommodations</label>
            {(data.hotels || []).map((hotel: any, i: number) => (
              <div key={i} className="border border-border/50 rounded-lg p-3 space-y-2">
                <Input
                  placeholder="Hotel name"
                  value={hotel.name}
                  onChange={(e) => {
                    const hotels = [...(data.hotels || [])];
                    hotels[i] = { ...hotel, name: e.target.value };
                    onUpdateData({ hotels });
                  }}
                  className="font-body text-sm h-8"
                />
                <Input
                  placeholder="Brief description"
                  value={hotel.description}
                  onChange={(e) => {
                    const hotels = [...(data.hotels || [])];
                    hotels[i] = { ...hotel, description: e.target.value };
                    onUpdateData({ hotels });
                  }}
                  className="font-body text-sm h-8"
                />
                <Input
                  placeholder="Distance from venue"
                  value={hotel.distance}
                  onChange={(e) => {
                    const hotels = [...(data.hotels || [])];
                    hotels[i] = { ...hotel, distance: e.target.value };
                    onUpdateData({ hotels });
                  }}
                  className="font-body text-sm h-8"
                />
                <Input
                  placeholder="Hotel address"
                  value={hotel.address || ""}
                  onChange={(e) => {
                    const hotels = [...(data.hotels || [])];
                    hotels[i] = { ...hotel, address: e.target.value };
                    onUpdateData({ hotels });
                  }}
                  className="font-body text-sm h-8"
                />
                <Input
                  placeholder="Google Maps link (paste URL)"
                  value={hotel.locationLink || ""}
                  onChange={(e) => {
                    const hotels = [...(data.hotels || [])];
                    hotels[i] = { ...hotel, locationLink: e.target.value };
                    onUpdateData({ hotels });
                  }}
                  className="font-body text-sm h-8"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const hotels = (data.hotels || []).filter((_: any, j: number) => j !== i);
                      onUpdateData({ hotels });
                    }}
                    className="text-muted-foreground hover:text-destructive p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full font-body"
              onClick={() =>
                onUpdateData({
                  hotels: [...(data.hotels || []), { name: "", description: "", distance: "" }],
                })
              }
            >
              <Plus className="w-3 h-3 mr-1" /> Add Hotel
            </Button>
          </div>
        </>
      )}

      {type === "polls" && (
        <>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Section Heading</label>
            <Input
              value={data.heading || ""}
              onChange={(e) => onUpdateData({ heading: e.target.value })}
              className="font-body"
            />
          </div>
          <div className="space-y-3">
            <label className="font-body text-sm font-medium text-foreground block">Polls</label>
            {(data.polls || []).map((poll: any, i: number) => (
              <div key={i} className="border border-border/50 rounded-lg p-3 space-y-2">
                <Input
                  placeholder="Poll question (e.g. Vote for Sangeet songs!)"
                  value={poll.question || ""}
                  onChange={(e) => {
                    const polls = [...(data.polls || [])];
                    polls[i] = { ...poll, question: e.target.value };
                    onUpdateData({ polls });
                  }}
                  className="font-body text-sm h-8"
                />
                {(poll.options || []).map((opt: string, j: number) => (
                  <div key={j} className="flex gap-1">
                    <Input
                      placeholder={`Option ${j + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const polls = [...(data.polls || [])];
                        const options = [...(polls[i].options || [])];
                        options[j] = e.target.value;
                        polls[i] = { ...polls[i], options };
                        onUpdateData({ polls });
                      }}
                      className="font-body text-xs h-7 flex-1"
                    />
                    <button
                      onClick={() => {
                        const polls = [...(data.polls || [])];
                        polls[i] = { ...polls[i], options: polls[i].options.filter((_: any, k: number) => k !== j) };
                        onUpdateData({ polls });
                      }}
                      className="text-muted-foreground hover:text-destructive p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 flex-1 font-body"
                    onClick={() => {
                      const polls = [...(data.polls || [])];
                      polls[i] = { ...polls[i], options: [...(polls[i].options || []), ""] };
                      onUpdateData({ polls });
                    }}
                  >
                    + Option
                  </Button>
                  <button
                    onClick={() => {
                      onUpdateData({ polls: (data.polls || []).filter((_: any, j: number) => j !== i) });
                    }}
                    className="text-muted-foreground hover:text-destructive p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full font-body"
              onClick={() =>
                onUpdateData({
                  polls: [...(data.polls || []), { question: "", options: ["Option 1", "Option 2"] }],
                })
              }
            >
              <Plus className="w-3 h-3 mr-1" /> Add Poll
            </Button>
          </div>
        </>
      )}

      {type === "ecotips" && (
        <>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Section Heading</label>
            <Input
              value={data.heading || ""}
              onChange={(e) => onUpdateData({ heading: e.target.value })}
              className="font-body"
            />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Description</label>
            <Textarea
              value={data.description || ""}
              onChange={(e) => onUpdateData({ description: e.target.value })}
              rows={2}
              className="font-body"
            />
          </div>
          <div className="space-y-2">
            <label className="font-body text-sm font-medium text-foreground block">Eco Tips</label>
            {(data.tips || []).map((tip: string, i: number) => (
              <div key={i} className="flex gap-1">
                <Input
                  value={tip}
                  onChange={(e) => {
                    const tips = [...(data.tips || [])];
                    tips[i] = e.target.value;
                    onUpdateData({ tips });
                  }}
                  className="font-body text-xs h-7 flex-1"
                />
                <button
                  onClick={() => onUpdateData({ tips: (data.tips || []).filter((_: any, j: number) => j !== i) })}
                  className="text-muted-foreground hover:text-destructive p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full font-body"
              onClick={() => onUpdateData({ tips: [...(data.tips || []), ""] })}
            >
              <Plus className="w-3 h-3 mr-1" /> Add Tip
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.showDigitalInviteTracker || false}
              onChange={(e) => onUpdateData({ showDigitalInviteTracker: e.target.checked })}
              className="rounded"
            />
            <label className="font-body text-sm text-foreground">Show digital invite tracker</label>
          </div>
        </>
      )}

      {type === "video" && (
        <>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Section Heading</label>
            <Input
              value={data.heading || ""}
              onChange={(e) => onUpdateData({ heading: e.target.value })}
              className="font-body"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-body text-xs font-medium text-foreground mb-1 block">Style</label>
              <select
                value={data.style || "gallery"}
                onChange={(e) => onUpdateData({ style: e.target.value })}
                className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs font-body"
              >
                <option value="gallery">Gallery (all videos)</option>
                <option value="invitation">Video invitation (hero)</option>
              </select>
            </div>
            <div>
              <label className="font-body text-xs font-medium text-foreground mb-1 block">Frame</label>
              <select
                value={data.frame || "gold"}
                onChange={(e) => onUpdateData({ frame: e.target.value })}
                disabled={data.style !== "invitation"}
                className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs font-body disabled:opacity-50"
              >
                <option value="none">None</option>
                <option value="gold">Gold gradient</option>
                <option value="floral">Dashed floral</option>
                <option value="minimal">Minimal border</option>
              </select>
            </div>
          </div>
          {data.style === "invitation" && (
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Overlay title (e.g. Priya & Arjun)"
                value={data.overlayTitle || ""}
                onChange={(e) => onUpdateData({ overlayTitle: e.target.value })}
                className="font-body text-sm h-8"
              />
              <Input
                placeholder="Overlay date (e.g. 12 · 02 · 2026)"
                value={data.overlayDate || ""}
                onChange={(e) => onUpdateData({ overlayDate: e.target.value })}
                className="font-body text-sm h-8"
              />
            </div>
          )}
          {data.style === "invitation" && (
            <p className="text-[11px] text-muted-foreground font-body bg-muted/40 rounded-md p-2 leading-relaxed">
              Invitation mode uses the first video below as the hero. Guests can watch, share on WhatsApp, or copy the invitation link from the public site.
            </p>
          )}
          {data.style === "invitation" && (
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 rounded-md border border-border/60 px-2.5 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.autoplay !== false}
                  onChange={(e) => onUpdateData({ autoplay: e.target.checked })}
                />
                <span className="font-body text-xs">Autoplay <span className="text-muted-foreground">(muted on mobile)</span></span>
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border/60 px-2.5 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.loop !== false}
                  onChange={(e) => onUpdateData({ loop: e.target.checked })}
                />
                <span className="font-body text-xs">Loop playback</span>
              </label>
            </div>
          )}
          <div className="space-y-3">
            <label className="font-body text-sm font-medium text-foreground block">Videos</label>
            <div className="text-[11px] text-muted-foreground font-body bg-muted/50 rounded-lg p-2.5 leading-relaxed">
              Upload your video to any of these platforms, then paste the link here:
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {SUPPORTED_VIDEO_PROVIDERS.map((p) => (
                  <a
                    key={p.id}
                    href={p.uploadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 rounded-full bg-background border border-border/60 text-[10px] hover:border-primary/60 hover:text-primary transition-colors"
                  >
                    {p.label} ↗
                  </a>
                ))}
              </div>
            </div>
            {(data.videos || []).map((video: any, i: number) => (
              <div key={i} className="border border-border/50 rounded-lg p-3 space-y-2">
                <Input
                  placeholder="Paste video URL (YouTube, Vimeo, Instagram, TikTok, Facebook…)"
                  value={video.url || ""}
                  onChange={(e) => {
                    const videos = [...(data.videos || [])];
                    videos[i] = { ...video, url: e.target.value };
                    onUpdateData({ videos });
                  }}
                  className="font-body text-sm h-8"
                />
                {video.url && (
                  (() => {
                    const v = validateVideoUrl(video.url) as { ok: boolean; label?: string; error?: string; hint?: string };
                    if (v.ok) {
                      return <p className="text-[10px] text-green-600 font-body">✓ Detected: {v.label}</p>;
                    }
                    return (
                      <div className="text-[10px] font-body">
                        <p className="text-destructive">{v.error}</p>
                        {v.hint && <p className="text-muted-foreground mt-0.5">{v.hint}</p>}
                      </div>
                    );
                  })()
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Caption (optional)"
                    value={video.caption || ""}
                    onChange={(e) => {
                      const videos = [...(data.videos || [])];
                      videos[i] = { ...video, caption: e.target.value };
                      onUpdateData({ videos });
                    }}
                    className="font-body text-sm h-8 flex-1"
                  />
                  <button
                    onClick={() => onUpdateData({ videos: (data.videos || []).filter((_: any, j: number) => j !== i) })}
                    className="text-muted-foreground hover:text-destructive p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full font-body"
              onClick={() => onUpdateData({ videos: [...(data.videos || []), { url: "", caption: "" }] })}
            >
              <Plus className="w-3 h-3 mr-1" /> Add Video
            </Button>
          </div>
        </>
      )}

      {type === "livestream" && (
        <>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Section Heading</label>
            <Input value={data.heading || ""} onChange={(e) => onUpdateData({ heading: e.target.value })} className="font-body" />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Description</label>
            <Textarea value={data.description || ""} onChange={(e) => onUpdateData({ description: e.target.value })} rows={2} className="font-body" />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Stream URL</label>
            <Input
              placeholder="YouTube Live URL (e.g. https://youtube.com/live/abc123)"
              value={data.embedUrl || ""}
              onChange={(e) => onUpdateData({ embedUrl: e.target.value })}
              className="font-body text-sm"
            />
            <p className="text-[10px] text-muted-foreground font-body mt-1">
              Best with <a href="https://studio.youtube.com" target="_blank" rel="noopener noreferrer" className="underline text-primary">YouTube Live</a> — also supports Vimeo, Facebook Live, Twitch. For Zoom/Google Meet, paste the join link (opens in a new tab).
            </p>
            {data.embedUrl && (
              (() => {
                const p = parseVideoUrl(data.embedUrl);
                return p ? (
                  <p className="text-[10px] text-green-600 font-body mt-1">✓ Live player will embed via {p.label}</p>
                ) : (
                  <p className="text-[10px] text-amber-600 font-body mt-1">Link will open in a new tab (no inline player)</p>
                );
              })()
            )}
          </div>
        </>
      )}

      {type === "blessings" && (
        <>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Heading</label>
            <Input value={data.heading || ""} onChange={(e) => onUpdateData({ heading: e.target.value })} className="font-body" />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Description</label>
            <Textarea value={data.description || ""} onChange={(e) => onUpdateData({ description: e.target.value })} rows={2} className="font-body" />
          </div>
          <p className="text-xs text-muted-foreground font-body p-2 bg-muted rounded-lg">
            💡 Guest blessings require moderation. Approve or reject messages from your Dashboard → Blessings tab.
          </p>
        </>
      )}

      {type === "guest_album" && (
        <>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Heading</label>
            <Input value={data.heading || ""} onChange={(e) => onUpdateData({ heading: e.target.value })} className="font-body" />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Description</label>
            <Textarea value={data.description || ""} onChange={(e) => onUpdateData({ description: e.target.value })} rows={2} className="font-body" />
          </div>
          <p className="text-xs text-muted-foreground font-body p-2 bg-muted rounded-lg">
            📸 Guests can upload photos and react with emojis. Toggle this section off above to disable the album. You can delete individual posts from your Dashboard.
          </p>
        </>
      )}

      {type === "registry" && (
        <>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Heading</label>
            <Input value={data.heading || ""} onChange={(e) => onUpdateData({ heading: e.target.value })} className="font-body" />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Description</label>
            <Textarea value={data.description || ""} onChange={(e) => onUpdateData({ description: e.target.value })} rows={2} className="font-body" />
          </div>
          <div className="space-y-3">
            <label className="font-body text-sm font-medium text-foreground block">Registry Links</label>
            {(data.links || []).map((link: any, i: number) => (
              <div key={i} className="border border-border/50 rounded-lg p-3 space-y-2">
                <Input placeholder="Registry name (e.g., Amazon, Zola)" value={link.name || ""} onChange={(e) => { const links = [...(data.links || [])]; links[i] = { ...link, name: e.target.value }; onUpdateData({ links }); }} className="font-body text-sm h-8" />
                <Input placeholder="Registry URL" value={link.url || ""} onChange={(e) => { const links = [...(data.links || [])]; links[i] = { ...link, url: e.target.value }; onUpdateData({ links }); }} className="font-body text-sm h-8" />
                <div className="flex gap-2 items-center">
                  <Input placeholder="Approx value (USD)" type="number" min={0} value={link.valueUSD || ""} onChange={(e) => { const links = [...(data.links || [])]; links[i] = { ...link, valueUSD: parseInt(e.target.value) || 0 }; onUpdateData({ links }); }} className="font-body text-sm h-8 w-32" />
                  <button onClick={() => onUpdateData({ links: (data.links || []).filter((_: any, j: number) => j !== i) })} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full font-body" onClick={() => onUpdateData({ links: [...(data.links || []), { name: "", url: "", valueUSD: 0 }] })}>
              <Plus className="w-3 h-3 mr-1" /> Add Registry Link
            </Button>
          </div>
        </>
      )}

      {type === "music" && (
        <>
          <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
            <div>
              <p className="font-body text-sm font-medium text-foreground">Enable background music</p>
              <p className="font-body text-[11px] text-muted-foreground">Plays a soft soundtrack when guests visit your site.</p>
            </div>
            <Switch
              checked={data.enabled !== false}
              onCheckedChange={(v) => onUpdateData({ enabled: v })}
            />
          </div>

          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {MUSIC_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    const first = cat.tracks[0];
                    onUpdateData({ category: cat.id, trackUrl: first.url, trackName: first.name });
                  }}
                  className={`text-left rounded-lg border p-2 transition-colors ${
                    data.category === cat.id ? "border-gold bg-gold/10" : "border-border/50 hover:bg-muted"
                  }`}
                >
                  <p className="font-body text-sm font-medium text-foreground">
                    {cat.emoji} {cat.label}
                  </p>
                  <p className="font-body text-[10px] text-muted-foreground line-clamp-1">{cat.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Track</label>
            <div className="space-y-1">
              {(MUSIC_CATEGORIES.find((c) => c.id === data.category)?.tracks || MUSIC_CATEGORIES[0].tracks).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onUpdateData({ trackUrl: t.url, trackName: t.name })}
                  className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-left transition-colors ${
                    data.trackUrl === t.url ? "border-gold bg-gold/10" : "border-border/50 hover:bg-muted"
                  }`}
                >
                  <span className="font-body text-sm text-foreground">🎵 {t.name}</span>
                  <audio
                    src={t.url}
                    controls
                    preload="none"
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 max-w-[140px]"
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Or paste a custom track URL</label>
            <Input
              placeholder="https://…/song.mp3"
              value={data.trackUrl || ""}
              onChange={(e) => onUpdateData({ trackUrl: e.target.value, trackName: data.trackName || "Custom Track" })}
              className="font-body text-sm"
            />
            <p className="text-[10px] text-muted-foreground font-body mt-1">
              Direct link to an .mp3, .ogg or .m4a file. Make sure you have the rights to use it.
            </p>
          </div>

          <div className="rounded-lg border border-dashed border-border/60 p-3 space-y-2">
            <label className="font-body text-sm font-medium text-foreground block">Upload your own track</label>
            <input
              ref={musicFileRef}
              type="file"
              accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,.mp3,.m4a,.ogg,.wav"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleMusicUpload(f);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={musicUploading}
              onClick={() => musicFileRef.current?.click()}
              className="w-full"
            >
              {musicUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Upload audio (MP3, M4A, OGG, WAV)</>
              )}
            </Button>
            <p className="text-[10px] text-muted-foreground font-body">Up to 15 MB. Stored securely in your gallery storage.</p>
          </div>

          {data.trackUrl && (
            <div className="rounded-lg border border-gold/40 bg-gold/5 p-3">
              <p className="font-body text-xs text-muted-foreground mb-1">Now playing on your site</p>
              <p className="font-body text-sm font-medium text-foreground truncate mb-2">🎵 {data.trackName || "Untitled track"}</p>
              <audio src={data.trackUrl} controls preload="none" className="w-full h-8" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-2">
              <span className="font-body text-xs text-foreground">Autoplay</span>
              <Switch checked={data.autoplay !== false} onCheckedChange={(v) => onUpdateData({ autoplay: v })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-2">
              <span className="font-body text-xs text-foreground">Loop</span>
              <Switch checked={data.loop !== false} onCheckedChange={(v) => onUpdateData({ loop: v })} />
            </div>
          </div>

          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">
              Volume: {Math.round((data.volume ?? 0.4) * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={data.volume ?? 0.4}
              onChange={(e) => onUpdateData({ volume: parseFloat(e.target.value) })}
              className="w-full accent-gold"
            />
          </div>

          <p className="text-[11px] text-muted-foreground font-body p-2 bg-muted rounded-lg">
            💡 Most browsers block autoplay with sound. Guests will see a small "Tap for music" prompt on the bottom-left until they interact.
          </p>
        </>
      )}
    </div>
  );
}

// ─── Event Editor ─────────────────────────────────────────────────────
function EventEditor({
  event,
  index,
  onChange,
  onDelete,
  onGenerateDescription,
  aiLoading,
}: {
  event: { name: string; date: string; time: string; venue: string; location?: string; address?: string; locationLink?: string; timezone?: string; description?: string };
  index: number;
  onChange: (e: typeof event) => void;
  onDelete: () => void;
  onGenerateDescription?: (eventName: string) => Promise<void>;
  aiLoading?: string | null;
}) {
  const [open, setOpen] = useState(false);

  // Detect user's timezone for default
  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-2 bg-background/50">
        <Calendar className="w-3.5 h-3.5 text-gold shrink-0" />
        <Input
          value={event.name}
          onChange={(e) => onChange({ ...event, name: e.target.value })}
          className="font-body text-sm h-7 border-0 bg-transparent p-0 focus-visible:ring-0"
        />
        <button onClick={() => setOpen(!open)} className="text-muted-foreground hover:text-foreground p-1">
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive p-1">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {open && (
        <div className="p-2 space-y-2 border-t border-border/30">
          <Input
            placeholder="Date (e.g., March 25, 2026)"
            value={event.date}
            onChange={(e) => onChange({ ...event, date: e.target.value })}
            className="font-body text-sm h-8"
          />
          <Input
            placeholder="Time (e.g., 6:00 PM)"
            value={event.time}
            onChange={(e) => onChange({ ...event, time: e.target.value })}
            className="font-body text-sm h-8"
          />
          <select
            value={event.timezone || userTz}
            onChange={(e) => onChange({ ...event, timezone: e.target.value })}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 font-body text-xs text-foreground"
          >
            {["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto",
              "Europe/London", "Europe/Paris", "Europe/Berlin",
              "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo", "Asia/Shanghai",
              "Australia/Sydney", "Pacific/Auckland", "UTC"
            ].map((tz) => (
              <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
            ))}
          </select>
          <Input
            placeholder="Venue name"
            value={event.venue}
            onChange={(e) => onChange({ ...event, venue: e.target.value })}
            className="font-body text-sm h-8"
          />
          <Input
            placeholder="Venue address (e.g., 123 Main St, City)"
            value={event.address || ""}
            onChange={(e) => onChange({ ...event, address: e.target.value })}
            className="font-body text-sm h-8"
          />
          <Input
            placeholder="Google Maps link (paste URL)"
            value={event.locationLink || ""}
            onChange={(e) => onChange({ ...event, locationLink: e.target.value })}
            className="font-body text-sm h-8"
          />
          {/* Event description with AI */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-body text-xs text-muted-foreground">Description</label>
              {onGenerateDescription && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px] text-accent hover:text-accent px-1.5"
                  disabled={aiLoading === "event_description"}
                  onClick={() => onGenerateDescription(event.name)}
                >
                  {aiLoading === "event_description" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Wand2 className="w-2.5 h-2.5 mr-0.5" /> AI</>}
                </Button>
              )}
            </div>
            <Textarea
              placeholder="Brief description of this ceremony..."
              value={event.description || ""}
              onChange={(e) => onChange({ ...event, description: e.target.value })}
              rows={2}
              className="font-body text-sm"
            />
          </div>
          {(() => {
            const gcal = buildGoogleCalendarUrl(event);
            const outlook = buildOutlookCalendarUrl(event);
            if (!gcal) {
              return (
                <p className="font-body text-[11px] text-muted-foreground">
                  Add a parseable date (e.g. <span className="font-mono">2026-03-25</span>) to generate calendar invites.
                </p>
              );
            }
            return (
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/30">
                <a
                  href={gcal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-body px-2 py-1 rounded-full border border-border/50 text-foreground hover:bg-muted transition-colors"
                >
                  <CalendarPlus className="w-3 h-3" /> Google
                </a>
                {outlook && (
                  <a
                    href={outlook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-body px-2 py-1 rounded-full border border-border/50 text-foreground hover:bg-muted transition-colors"
                  >
                    <CalendarPlus className="w-3 h-3" /> Outlook
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => downloadIcs(event)}
                  className="inline-flex items-center gap-1 text-[11px] font-body px-2 py-1 rounded-full border border-border/50 text-foreground hover:bg-muted transition-colors"
                >
                  <Download className="w-3 h-3" /> .ics
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Logo Uploader ────────────────────────────────────────────────────
function LogoUploader({ logoUrl, onLogoChange }: { logoUrl: string; onLogoChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const { upload } = useMediaUpload();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Logo must be under 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const url = await upload(file, "logo");
      if (url) {
        onLogoChange(url);
        toast({ title: "Logo uploaded! ✨" });
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="font-body text-sm font-medium text-foreground">
          Couple Logo <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <StorageBadge />
      </div>
      {logoUrl ? (
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg border border-border/50 overflow-hidden bg-muted flex items-center justify-center">
            <img src={logoUrl} alt="Wedding logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-body text-gold hover:text-gold/80 cursor-pointer transition-colors">
              {uploading ? "Uploading..." : "Change"}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
            </label>
            <button
              onClick={() => onLogoChange("")}
              className="text-xs font-body text-destructive hover:text-destructive/80 text-left transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-border hover:border-gold/50 rounded-xl p-4 text-center transition-colors cursor-pointer"
          onClick={() => document.getElementById("logo-upload")?.click()}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-gold mx-auto animate-spin mb-1" />
          ) : (
            <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
          )}
          <p className="text-xs text-muted-foreground font-body">
            {uploading ? "Uploading..." : "Upload your wedding logo or monogram"}
          </p>
          <p className="text-[10px] text-muted-foreground/60 font-body mt-0.5">PNG with transparency works best</p>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </div>
      )}
    </div>
  );
}

// ─── Hero Image Uploader ──────────────────────────────────────────────
function HeroImageUploader({ imageUrl, onImageChange }: { imageUrl: string; onImageChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const { upload } = useMediaUpload();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Image must be under 10MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const url = await upload(file, "hero");
      if (url) {
        onImageChange(url);
        toast({ title: "Hero image uploaded! ✨" });
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="font-body text-sm font-medium text-foreground">
          Background Image <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <StorageBadge />
      </div>
      {imageUrl ? (
        <div className="space-y-2">
          <div className="w-full h-24 rounded-lg border border-border/50 overflow-hidden bg-muted">
            <img src={imageUrl} alt="Hero background" className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2">
            <label className="text-xs font-body text-gold hover:text-gold/80 cursor-pointer transition-colors">
              {uploading ? "Uploading..." : "Change"}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
            </label>
            <button
              onClick={() => onImageChange("")}
              className="text-xs font-body text-destructive hover:text-destructive/80 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-border hover:border-gold/50 rounded-xl p-4 text-center transition-colors cursor-pointer"
          onClick={() => document.getElementById("hero-bg-upload")?.click()}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-gold mx-auto animate-spin mb-1" />
          ) : (
            <Image className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
          )}
          <p className="text-xs text-muted-foreground font-body">{uploading ? "Uploading..." : "Upload a hero background image"}</p>
          <p className="text-[10px] text-muted-foreground/60 font-body mt-0.5">Landscape photos work best • Max 10MB</p>
          <input id="hero-bg-upload" type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
        </div>
      )}
    </div>
  );
}

// ─── Featured Image Uploader (for OG/social sharing) ──────────────────
function FeaturedImageUploader({ imageUrl, onImageChange }: { imageUrl: string; onImageChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const { upload } = useMediaUpload();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Image must be under 10MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const url = await upload(file, "featured");
      if (url) {
        onImageChange(url);
        toast({ title: "Featured image uploaded! 🎉" });
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-body text-sm font-medium text-foreground">Featured Image</span>
        <StorageBadge />
      </div>
      {imageUrl ? (
        <div className="space-y-2">
          <div className="w-full h-28 rounded-lg border border-border/50 overflow-hidden bg-muted">
            <img src={imageUrl} alt="Featured image for social sharing" className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2">
            <label className="text-xs font-body text-gold hover:text-gold/80 cursor-pointer transition-colors">
              {uploading ? "Uploading..." : "Change"}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
            </label>
            <button
              onClick={() => onImageChange("")}
              className="text-xs font-body text-destructive hover:text-destructive/80 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-border hover:border-gold/50 rounded-xl p-4 text-center transition-colors cursor-pointer"
          onClick={() => document.getElementById("featured-img-upload")?.click()}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-gold mx-auto animate-spin mb-1" />
          ) : (
            <Image className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
          )}
          <p className="text-xs text-muted-foreground font-body">{uploading ? "Uploading..." : "Upload a featured image"}</p>
          <p className="text-[10px] text-muted-foreground/60 font-body mt-0.5">1200×630px recommended • Max 10MB</p>
          <input id="featured-img-upload" type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
        </div>
      )}
    </div>
  );
}


function CouplePhotoUploader({ label, currentUrl, onPhotoChange }: { label: string; currentUrl: string; onPhotoChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const { upload } = useMediaUpload();
  const inputId = `couple-photo-${label.replace(/\s/g, "-").toLowerCase()}`;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Photo must be under 10MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const url = await upload(file, "couple");
      if (url) {
        onPhotoChange(url);
        toast({ title: "Photo uploaded! 📸" });
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="font-body text-xs text-muted-foreground">{label}</label>
        <StorageBadge />
      </div>
      {currentUrl ? (
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full border border-border/50 overflow-hidden bg-muted">
            <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-body text-accent hover:text-accent/80 cursor-pointer transition-colors">
              {uploading ? "Uploading..." : "Change"}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
            </label>
            <button onClick={() => onPhotoChange("")} className="text-xs font-body text-destructive hover:text-destructive/80 text-left transition-colors">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-border hover:border-accent/50 rounded-xl p-3 text-center transition-colors cursor-pointer"
          onClick={() => document.getElementById(inputId)?.click()}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 text-accent mx-auto animate-spin mb-1" />
          ) : (
            <Upload className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
          )}
          <p className="text-[10px] text-muted-foreground font-body">{uploading ? "Uploading..." : "Upload photo"}</p>
          <input id={inputId} type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
        </div>
      )}
    </div>
  );
}


function GalleryEditor({
  photos,
  heading,
  onUpdateHeading,
  onUpdatePhotos,
}: {
  photos: GalleryPhoto[];
  heading: string;
  onUpdateHeading: (heading: string) => void;
  onUpdatePhotos: (photos: GalleryPhoto[]) => void;
}) {
  const { uploadPhotos, deletePhoto, uploading } = useGalleryPhotos();
  const fileInputRef = useState<HTMLInputElement | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const uploaded = await uploadPhotos(files);
    if (uploaded.length > 0) {
      onUpdatePhotos([...photos, ...uploaded]);
    }
    e.target.value = "";
  };

  const handleDelete = async (photo: GalleryPhoto) => {
    const success = await deletePhoto(photo.id);
    if (success) {
      onUpdatePhotos(photos.filter((p) => p.id !== photo.id));
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    const uploaded = await uploadPhotos(files);
    if (uploaded.length > 0) {
      onUpdatePhotos([...photos, ...uploaded]);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <label className="font-body text-sm font-medium text-foreground mb-1 block">Heading</label>
        <Input
          value={heading}
          onChange={(e) => onUpdateHeading(e.target.value)}
          className="font-body"
        />
      </div>

      {/* Uploaded photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
              <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
              <button
                onClick={() => handleDelete(photo)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-border hover:border-gold/50 rounded-xl p-6 text-center transition-colors cursor-pointer"
        onClick={() => document.getElementById("gallery-upload")?.click()}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 text-gold mx-auto animate-spin mb-2" />
        ) : (
          <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        )}
        <p className="text-sm text-muted-foreground font-body">
          {uploading ? "Uploading..." : "Click or drag photos here"}
        </p>
        <p className="text-xs text-muted-foreground/60 font-body mt-1">JPG, PNG, WebP • Max 10MB each</p>
        <input
          id="gallery-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}

// ─── Gallery Renderer (with lightbox) ─────────────────────────────────
function GalleryRendererComponent({ data, accent }: { data: Record<string, any>; accent: string }) {
  const photos: GalleryPhoto[] = data.photos || [];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  return (
    <div className="bg-card rounded-xl px-8 py-10">
      <h2 className="font-display text-2xl font-bold text-foreground text-center mb-2">{data.heading}</h2>
      <div className="w-10 h-0.5 mx-auto mb-6" style={{ backgroundColor: accent }} />
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
            >
              <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted flex items-center justify-center">
              <Image className="w-6 h-6 text-muted-foreground/40" />
            </div>
          ))}
        </div>
      )}
      <LightboxAnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={photos}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </LightboxAnimatePresence>
    </div>
  );
}

function InlineEditable({
  value,
  onChange,
  tag: Tag = "span",
  className,
  style,
}: {
  value: string;
  onChange: (val: string) => void;
  tag?: "h1" | "h2" | "p" | "span" | "div";
  className?: string;
  style?: React.CSSProperties;
}) {
  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const newVal = e.currentTarget.textContent || "";
    if (newVal !== value) onChange(newVal);
  };
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      className={`outline-none focus:ring-1 focus:ring-gold/50 focus:rounded px-0.5 cursor-text ${className || ""}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  );
}

// Video embed parsing lives in @/lib/video-embed

function SectionRenderer({
  section,
  bg,
  accent,
  light,
  displayFont = "Cormorant Garamond",
  bodyFont = "DM Sans",
  onUpdateData,
}: {
  section: WeddingSection;
  bg: string;
  accent: string;
  light: string;
  displayFont?: string;
  bodyFont?: string;
  onUpdateData?: (data: Record<string, any>) => void;
}) {
  const { type, data } = section;
  const dFont = `'${displayFont}', serif`;
  const bFont = `'${bodyFont}', sans-serif`;
  const update = onUpdateData || (() => {});

  if (type === "hero") {
    const heroStyle: React.CSSProperties = data.heroImageUrl
      ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(${data.heroImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
      : { background: `linear-gradient(135deg, ${bg}, ${bg}dd)` };

    return (
      <div className="relative py-20 px-6 text-center rounded-xl overflow-hidden" style={heroStyle}>
        {!data.heroImageUrl && (
          <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 400 400" className="w-full h-full">
              {[...Array(6)].map((_, i) => (
                <circle key={i} cx="200" cy="200" r={50 + i * 30} fill="none" stroke={light} strokeWidth="0.5" />
              ))}
            </svg>
          </div>
        )}
        <div className="relative z-10">
          {data.logoUrl && (
            <img src={data.logoUrl} alt="Wedding logo" className="w-20 h-20 mx-auto mb-4 object-contain rounded-lg" />
          )}
          <Heart className="w-7 h-7 mx-auto mb-3" style={{ color: accent }} fill="currentColor" />
          <InlineEditable
            tag="p"
            value={data.subheading || ""}
            onChange={(v) => update({ subheading: v })}
            className="text-xs tracking-widest uppercase mb-2"
            style={{ color: data.heroImageUrl ? `${light}cc` : `${light}99`, fontFamily: bFont }}
          />
          <InlineEditable
            tag="h1"
            value={data.heading || ""}
            onChange={(v) => update({ heading: v })}
            className="text-4xl md:text-5xl font-bold mb-2"
            style={{ color: light, fontFamily: dFont }}
          />
          <InlineEditable
            tag="p"
            value={data.tagline || ""}
            onChange={(v) => update({ tagline: v })}
            className="text-lg italic"
            style={{ color: accent, fontFamily: dFont }}
          />
        </div>
      </div>
    );
  }

  if (type === "story" || type === "custom") {
    return (
      <div className="bg-card rounded-xl px-8 py-10">
        <InlineEditable
          tag="h2"
          value={data.heading || ""}
          onChange={(v) => update({ heading: v })}
          className="text-2xl font-bold text-foreground text-center mb-2"
          style={{ fontFamily: dFont }}
        />
        <div className="w-10 h-0.5 mx-auto mb-5" style={{ backgroundColor: accent }} />
        <InlineEditable
          tag="p"
          value={data.body || ""}
          onChange={(v) => update({ body: v })}
          className="text-muted-foreground text-center max-w-xl mx-auto leading-relaxed"
          style={{ fontFamily: bFont }}
        />
      </div>
    );
  }

  if (type === "events") {
    return (
      <div className="bg-background rounded-xl px-8 py-10 border border-border/30">
        <InlineEditable
          tag="h2"
          value={data.heading || ""}
          onChange={(v) => update({ heading: v })}
          className="text-2xl font-bold text-foreground text-center mb-2"
          style={{ fontFamily: dFont }}
        />
        <div className="w-10 h-0.5 mx-auto mb-6" style={{ backgroundColor: accent }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl mx-auto">
          {(data.events || []).map((event: any, i: number) => (
            <div
              key={i}
              className="border border-border/50 rounded-lg p-3 text-center bg-card hover:shadow-card transition-shadow"
            >
              <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
                <Calendar className="w-4 h-4" style={{ color: accent }} />
              </div>
              <p className="text-sm font-semibold text-foreground" style={{ fontFamily: dFont }}>{event.name}</p>
              {event.date && <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: bFont }}>{event.date}</p>}
              {event.time && <p className="text-xs text-muted-foreground" style={{ fontFamily: bFont }}>{event.time}</p>}
              {event.venue && (
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5" style={{ fontFamily: bFont }}>
                  <MapPin className="w-3 h-3" /> {event.venue}
                </p>
              )}
              {event.address && (
                <p className="text-xs text-muted-foreground/70 mt-0.5 truncate" style={{ fontFamily: bFont }}>{event.address}</p>
              )}
              {event.locationLink && (
                <a
                  href={event.locationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs mt-1 inline-flex items-center gap-1 underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity"
                  style={{ color: accent, fontFamily: bFont }}
                >
                  <MapPin className="w-3 h-3" /> View on Map
                </a>
              )}
              {!event.date && !event.time && <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: bFont }}>Date & time TBD</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "couple_profiles") {
    return (
      <div className="bg-card rounded-xl px-8 py-10">
        <InlineEditable
          tag="h2"
          value={data.heading || "Meet the Couple"}
          onChange={(v) => update({ heading: v })}
          className="text-2xl font-bold text-foreground text-center mb-2"
          style={{ fontFamily: dFont }}
        />
        <div className="w-10 h-0.5 mx-auto mb-6" style={{ backgroundColor: accent }} />
        <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
          {[
            { name: data.partner1Name || "Partner 1", photo: data.partner1Photo, bio: data.partner1Bio },
            { name: data.partner2Name || "Partner 2", photo: data.partner2Photo, bio: data.partner2Bio },
          ].map((p, i) => (
            <div key={i} className="text-center">
              <div className="w-24 h-24 rounded-full mx-auto mb-3 overflow-hidden border-2" style={{ borderColor: accent }}>
                {p.photo ? (
                  <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Heart className="w-8 h-8" style={{ color: `${accent}40` }} />
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground" style={{ fontFamily: dFont }}>{p.name}</p>
              {p.bio && <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: bFont }}>{p.bio}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "gallery") {
    return <GalleryRendererComponent data={data} accent={accent} />;
  }

  if (type === "countdown") {
    const targetDate = data.date ? new Date(data.date) : null;
    const daysLeft = targetDate ? Math.max(0, Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
    return (
      <div className="rounded-xl px-8 py-10 text-center" style={{ background: `linear-gradient(135deg, ${bg}15, ${accent}10)` }}>
        <InlineEditable
          tag="h2"
          value={data.label || ""}
          onChange={(v) => update({ label: v })}
          className="text-xl font-semibold text-foreground mb-4"
          style={{ fontFamily: dFont }}
        />
        <div className="flex justify-center gap-4">
          {daysLeft !== null ? (
            <div className="text-center">
              <div className="text-4xl font-bold" style={{ color: accent, fontFamily: dFont }}>{daysLeft}</div>
              <div className="text-xs text-muted-foreground mt-1" style={{ fontFamily: bFont }}>Days</div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm" style={{ fontFamily: bFont }}>Set your wedding date to start the countdown</p>
          )}
        </div>
      </div>
    );
  }

  if (type === "guestbook") {
    return (
      <div className="bg-card rounded-xl px-8 py-10 text-center">
        <InlineEditable
          tag="h2"
          value={data.heading || ""}
          onChange={(v) => update({ heading: v })}
          className="text-2xl font-bold text-foreground mb-2"
          style={{ fontFamily: dFont }}
        />
        <div className="w-10 h-0.5 mx-auto mb-4" style={{ backgroundColor: accent }} />
        <InlineEditable
          tag="p"
          value={data.description || ""}
          onChange={(v) => update({ description: v })}
          className="text-muted-foreground mb-6 max-w-md mx-auto"
          style={{ fontFamily: bFont }}
        />
        <div className="max-w-sm mx-auto space-y-3">
          <Input placeholder="Your Name" disabled style={{ fontFamily: bFont }} />
          <Textarea placeholder="Your wishes for the couple..." disabled rows={3} style={{ fontFamily: bFont }} />
          <Button variant="gold" className="w-full" disabled style={{ fontFamily: bFont }}>Send Wishes</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3" style={{ fontFamily: bFont }}>Guestbook preview — functional when published</p>
      </div>
    );
  }

  if (type === "travel") {
    return (
      <div className="bg-background rounded-xl px-8 py-10 border border-border/30">
        <InlineEditable
          tag="h2"
          value={data.heading || ""}
          onChange={(v) => update({ heading: v })}
          className="text-2xl font-bold text-foreground text-center mb-2"
          style={{ fontFamily: dFont }}
        />
        <div className="w-10 h-0.5 mx-auto mb-4" style={{ backgroundColor: accent }} />
        <InlineEditable
          tag="p"
          value={data.description || ""}
          onChange={(v) => update({ description: v })}
          className="text-muted-foreground text-center max-w-xl mx-auto mb-6"
          style={{ fontFamily: bFont }}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-6">
          {(data.hotels || []).map((hotel: any, i: number) => (
            <div key={i} className="border border-border/50 rounded-lg p-4 bg-card">
              <p className="text-sm font-semibold text-foreground" style={{ fontFamily: dFont }}>{hotel.name}</p>
              <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: bFont }}>{hotel.description}</p>
              {hotel.address && (
                <p className="text-xs text-muted-foreground/70 mt-0.5" style={{ fontFamily: bFont }}>{hotel.address}</p>
              )}
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: accent, fontFamily: bFont }}>
                <MapPin className="w-3 h-3" /> {hotel.distance}
              </p>
              {hotel.locationLink && (
                <a
                  href={hotel.locationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs mt-1 inline-flex items-center gap-1 underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity"
                  style={{ color: accent, fontFamily: bFont }}
                >
                  <MapPin className="w-3 h-3" /> View on Map
                </a>
              )}
            </div>
          ))}
        </div>
        {data.directions && (
          <div className="bg-card rounded-lg p-4 max-w-xl mx-auto">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap" style={{ fontFamily: bFont }}>{data.directions}</p>
          </div>
        )}
      </div>
    );
  }

  if (type === "rsvp") {
    return (
      <div className="rounded-xl px-8 py-10 text-center" style={{ background: `linear-gradient(135deg, ${bg}15, ${accent}10)` }}>
        <InlineEditable
          tag="h2"
          value={data.heading || ""}
          onChange={(v) => update({ heading: v })}
          className="text-2xl font-bold text-foreground mb-2"
          style={{ fontFamily: dFont }}
        />
        <div className="w-10 h-0.5 mx-auto mb-4" style={{ backgroundColor: accent }} />
        <InlineEditable
          tag="p"
          value={data.body || ""}
          onChange={(v) => update({ body: v })}
          className="text-muted-foreground mb-6 max-w-md mx-auto"
          style={{ fontFamily: bFont }}
        />
        <div className="max-w-sm mx-auto space-y-3">
          <Input placeholder="Your Name" disabled style={{ fontFamily: bFont }} />
          <Input placeholder="Email Address" disabled style={{ fontFamily: bFont }} />
          <Button variant="gold" className="w-full" disabled style={{ fontFamily: bFont }}>
            RSVP Now
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3" style={{ fontFamily: bFont }}>RSVP form preview — functional when published</p>
      </div>
    );
  }

  if (type === "polls") {
    return (
      <div className="bg-card rounded-xl px-8 py-10">
        <InlineEditable
          tag="h2"
          value={data.heading || ""}
          onChange={(v) => update({ heading: v })}
          className="text-2xl font-bold text-foreground text-center mb-2"
          style={{ fontFamily: dFont }}
        />
        <div className="w-10 h-0.5 mx-auto mb-6" style={{ backgroundColor: accent }} />
        <div className="max-w-md mx-auto space-y-4">
          {(data.polls || []).map((poll: any, i: number) => (
            <div key={i} className="border border-border/50 rounded-lg p-4">
              <p className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: dFont }}>{poll.question}</p>
              <div className="space-y-2">
                {(poll.options || []).map((opt: string, j: number) => (
                  <div key={j} className="flex items-center gap-2 p-2 rounded-lg border border-border/30 bg-background">
                    <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: accent }} />
                    <span className="text-sm text-foreground" style={{ fontFamily: bFont }}>{opt}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: bFont }}>Voting available when published</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "ecotips") {
    return (
      <div className="rounded-xl px-8 py-10" style={{ background: `linear-gradient(135deg, #2D501610, #8DB37015)` }}>
        <InlineEditable
          tag="h2"
          value={data.heading || ""}
          onChange={(v) => update({ heading: v })}
          className="text-2xl font-bold text-foreground text-center mb-2"
          style={{ fontFamily: dFont }}
        />
        <div className="w-10 h-0.5 mx-auto mb-4" style={{ backgroundColor: accent }} />
        <InlineEditable
          tag="p"
          value={data.description || ""}
          onChange={(v) => update({ description: v })}
          className="text-muted-foreground text-center max-w-md mx-auto mb-6"
          style={{ fontFamily: bFont }}
        />
        <div className="max-w-md mx-auto space-y-2">
          {(data.tips || []).map((tip: string, i: number) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border/30">
              <span className="text-base">🌱</span>
              <span className="text-sm text-foreground" style={{ fontFamily: bFont }}>{tip}</span>
            </div>
          ))}
        </div>
        {data.showDigitalInviteTracker && (
          <div className="mt-6 text-center p-4 rounded-lg bg-card border border-border/30 max-w-sm mx-auto">
            <p className="text-xs text-muted-foreground" style={{ fontFamily: bFont }}>🌍 Digital invites sent — saving trees, one card at a time!</p>
          </div>
        )}
      </div>
    );
  }

  if (type === "video") {
    const videos = data.videos || [];
    return (
      <div className="bg-card rounded-xl px-8 py-10">
        <InlineEditable
          tag="h2"
          value={data.heading || ""}
          onChange={(v) => update({ heading: v })}
          className="text-2xl font-bold text-foreground text-center mb-2"
          style={{ fontFamily: dFont }}
        />
        <div className="w-10 h-0.5 mx-auto mb-6" style={{ backgroundColor: accent }} />
        <div className="max-w-2xl mx-auto space-y-6">
          {videos.map((video: any, i: number) => {
            const embedUrl = getVideoEmbedUrl(video.url);
            return (
              <div key={i}>
                {embedUrl ? (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      title={video.caption || `Video ${i + 1}`}
                    />
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: bFont }}>Paste a YouTube, Vimeo, Instagram, TikTok or Facebook URL</p>
                  </div>
                )}
                {video.caption && (
                  <p className="text-center text-sm text-muted-foreground mt-2" style={{ fontFamily: bFont }}>{video.caption}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === "livestream") {
    return (
      <div className="bg-background rounded-xl px-8 py-10 border border-border/30 text-center">
        <InlineEditable tag="h2" value={data.heading || ""} onChange={(v) => update({ heading: v })} className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: dFont }} />
        <div className="w-10 h-0.5 mx-auto mb-4" style={{ backgroundColor: accent }} />
        <InlineEditable tag="p" value={data.description || ""} onChange={(v) => update({ description: v })} className="text-muted-foreground mb-4 max-w-md mx-auto" style={{ fontFamily: bFont }} />
        {data.embedUrl ? (
          <div className="aspect-video rounded-lg bg-muted flex items-center justify-center border border-border/50">
            <p className="text-sm text-muted-foreground" style={{ fontFamily: bFont }}>📡 Live stream preview — visible when published</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground" style={{ fontFamily: bFont }}>Add a stream URL in the editor panel</p>
        )}
      </div>
    );
  }

  if (type === "blessings") {
    return (
      <div className="bg-card rounded-xl px-8 py-10 text-center">
        <InlineEditable tag="h2" value={data.heading || ""} onChange={(v) => update({ heading: v })} className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: dFont }} />
        <div className="w-10 h-0.5 mx-auto mb-4" style={{ backgroundColor: accent }} />
        <InlineEditable tag="p" value={data.description || ""} onChange={(v) => update({ description: v })} className="text-muted-foreground mb-6 max-w-md mx-auto" style={{ fontFamily: bFont }} />
        <div className="max-w-sm mx-auto space-y-3">
          <Input placeholder="Your Name" disabled style={{ fontFamily: bFont }} />
          <Textarea placeholder="Your blessing for the couple..." disabled rows={3} style={{ fontFamily: bFont }} />
          <Button variant="gold" className="w-full" disabled style={{ fontFamily: bFont }}>Send Blessing</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3" style={{ fontFamily: bFont }}>Blessings wall preview — functional when published</p>
      </div>
    );
  }

  if (type === "registry") {
    return (
      <div className="bg-background rounded-xl px-8 py-10 border border-border/30 text-center">
        <InlineEditable tag="h2" value={data.heading || ""} onChange={(v) => update({ heading: v })} className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: dFont }} />
        <div className="w-10 h-0.5 mx-auto mb-4" style={{ backgroundColor: accent }} />
        <InlineEditable tag="p" value={data.description || ""} onChange={(v) => update({ description: v })} className="text-muted-foreground mb-6 max-w-md mx-auto" style={{ fontFamily: bFont }} />
        <div className="max-w-md mx-auto space-y-3">
          {(data.links || []).filter((l: any) => l.name || l.url).map((link: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
              <span className="text-sm font-medium text-foreground" style={{ fontFamily: bFont }}>{link.name || "Registry"}</span>
              {link.valueUSD > 0 && <span className="text-xs text-muted-foreground" style={{ fontFamily: bFont }}>~${link.valueUSD}</span>}
            </div>
          ))}
          {(!data.links || data.links.length === 0) && <p className="text-sm text-muted-foreground" style={{ fontFamily: bFont }}>Add registry links in the editor panel</p>}
        </div>
      </div>
    );
  }

  return null;
}

// ─── Full Site Preview ────────────────────────────────────────────────
function SitePreview({
  sections,
  bg,
  accent,
  light,
  displayFont,
  bodyFont,
}: {
  sections: WeddingSection[];
  bg: string;
  accent: string;
  light: string;
  displayFont: string;
  bodyFont: string;
}) {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {sections.map((section) => (
        <div key={section.id} className="mb-0">
          <SectionRenderer section={section} bg={bg} accent={accent} light={light} displayFont={displayFont} bodyFont={bodyFont} />
        </div>
      ))}
    </div>
  );
}

export default Editor;
