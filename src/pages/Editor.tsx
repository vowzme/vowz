import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence as LightboxAnimatePresence } from "framer-motion";
import Lightbox from "@/components/Lightbox";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Heart, Eye, EyeOff, GripVertical, Plus, Trash2, ArrowLeft,
  Type, Palette, Settings, Sparkles, Save, ExternalLink, X,
  Calendar, MapPin, ChevronDown, ChevronUp, Image, Upload, Loader2,
  MessageCircle, Send, Bot, Wand2, LayoutTemplate, Check, Search
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useWeddingSite } from "@/hooks/use-wedding-site";
import { useAuth } from "@/hooks/use-auth";
import { useGalleryPhotos, GalleryPhoto } from "@/hooks/use-gallery-photos";
import SEOHead from "@/components/SEOHead";

// ─── Types ───────────────────────────────────────────────────────────
export interface WeddingSection {
  id: string;
  type: "hero" | "story" | "events" | "gallery" | "rsvp" | "countdown" | "guestbook" | "travel" | "custom" | "polls" | "ecotips" | "video";
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
}

interface EditorState {
  siteData: WeddingSiteData;
  sections: WeddingSection[];
  activePanel: "sections" | "style" | "settings" | "ai" | "templates" | null;
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
      data: { heading: "Our Story", body: data.howWeMet },
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
  const { createSite, updateSite, loadUserSite, saving, loading } = useWeddingSite();
  const wizardData: WeddingSiteData | null = (location.state as any)?.wizardData || null;

  const [dbSiteId, setDbSiteId] = useState<string | null>(siteId || null);
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
      loadUserSite().then((site) => {
        if (site) {
          setDbSiteId(site.id);
          const siteData: WeddingSiteData = {
            partner1: site.partner1,
            partner2: site.partner2,
            culturalBackground: site.cultural_background,
            howWeMet: site.how_we_met,
            functions: [],
            theme: site.theme,
            suggestedColors: (site.suggested_colors as any) || ["#6B1D2A", "#D4A853", "#FFF5E6"],
            tagline: site.tagline,
          };
          const sections = (site.sections as any as WeddingSection[]);
          setState((prev) => ({
            ...prev,
            siteData,
            sections: sections && sections.length > 0 ? sections : buildSections(siteData),
          }));
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
      }).then((site) => {
        if (site) setDbSiteId(site.id);
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
    });
    if (success) {
      toast({ title: "Site saved! ✨", description: "Your changes have been saved." });
    }
  };

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  // ─── Preview Mode ──────────────────────────────────────────────────
  if (previewMode) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <Button variant="gold" size="sm" onClick={() => updateState({ previewMode: false })}>
            <X className="w-4 h-4 mr-1" /> Exit Preview
          </Button>
        </div>
        <SitePreview sections={sections.filter((s) => s.visible)} bg={bg} accent={accent} light={light} displayFont={displayFont} bodyFont={bodyFont} />
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
                    <SettingsPanel siteData={siteData} onUpdate={(d) => updateState({ siteData: d })} />
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
                  {activePanel === "ai" && (
                    <AIAssistantPanel
                      siteData={siteData}
                      onApplyChanges={(changes) => {
                        const newData = { ...siteData, ...changes };
                        updateState({ siteData: newData });
                        // If colors changed, also rebuild sections won't be needed since they reference siteData
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
              <button
                onClick={(e) => { e.stopPropagation(); onToggleVisibility(section.id); }}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                {section.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              {(section.type === "custom" || section.type === "polls" || section.type === "ecotips") && (
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

  // 10 new templates
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

// ─── Settings Panel ───────────────────────────────────────────────────
function SettingsPanel({
  siteData,
  onUpdate,
}: {
  siteData: WeddingSiteData;
  onUpdate: (data: WeddingSiteData) => void;
}) {
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
          <label className="font-body text-sm font-medium text-foreground mb-1 block">Theme</label>
          <Input
            value={siteData.theme}
            onChange={(e) => onUpdate({ ...siteData, theme: e.target.value })}
            className="font-body"
          />
        </div>

        {/* Memory Mode */}
        <div className="border-t border-border/30 pt-4 mt-4">
          <label className="font-body text-sm font-medium text-foreground mb-2 block">Post-Wedding Mode</label>
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-background">
            <input
              type="checkbox"
              checked={siteData.memoryMode || false}
              onChange={(e) => onUpdate({ ...siteData, memoryMode: e.target.checked })}
              className="rounded mt-0.5"
            />
            <div>
              <p className="font-body text-sm text-foreground">Enable Memory Mode 📸</p>
              <p className="font-body text-xs text-muted-foreground mt-0.5">
                Keep your site live as a wedding archive. Guests can revisit memories, view photos, and relive the celebration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section Editor (right panel) ─────────────────────────────────────
function SectionEditor({
  section,
  onUpdateData,
  onUpdateTitle,
}: {
  section: WeddingSection;
  onUpdateData: (data: Record<string, any>) => void;
  onUpdateTitle: (title: string) => void;
}) {
  const { type, data } = section;

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
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Tagline</label>
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
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Content</label>
            <Textarea
              value={data.body || ""}
              onChange={(e) => onUpdateData({ body: e.target.value })}
              rows={5}
              className="font-body"
            />
          </div>
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
                <div className="flex gap-2">
                  <Input
                    placeholder="Distance from venue"
                    value={hotel.distance}
                    onChange={(e) => {
                      const hotels = [...(data.hotels || [])];
                      hotels[i] = { ...hotel, distance: e.target.value };
                      onUpdateData({ hotels });
                    }}
                    className="font-body text-sm h-8 flex-1"
                  />
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
    </div>
  );
}

// ─── Event Editor ─────────────────────────────────────────────────────
function EventEditor({
  event,
  index,
  onChange,
  onDelete,
}: {
  event: { name: string; date: string; time: string; venue: string; location?: string };
  index: number;
  onChange: (e: typeof event) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

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
          <Input
            placeholder="Venue name"
            value={event.venue}
            onChange={(e) => onChange({ ...event, venue: e.target.value })}
            className="font-body text-sm h-8"
          />
          <Input
            placeholder="Address / Location (e.g., 123 Main St, City)"
            value={event.location || ""}
            onChange={(e) => onChange({ ...event, location: e.target.value })}
            className="font-body text-sm h-8"
          />
        </div>
      )}
    </div>
  );
}

// ─── Logo Uploader ────────────────────────────────────────────────────
function LogoUploader({ logoUrl, onLogoChange }: { logoUrl: string; onLogoChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
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
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/logo-${Date.now()}.${ext}`;
      const { supabase } = await import("@/integrations/supabase/client");

      const { error: uploadError } = await supabase.storage
        .from("wedding-logos")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("wedding-logos")
        .getPublicUrl(path);

      onLogoChange(urlData.publicUrl);
      toast({ title: "Logo uploaded! ✨" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <label className="font-body text-sm font-medium text-foreground mb-1 block">
        Couple Logo <span className="text-muted-foreground font-normal">(optional)</span>
      </label>
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
  const { user } = useAuth();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
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
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/hero-${Date.now()}.${ext}`;
      const { supabase } = await import("@/integrations/supabase/client");
      const { error: uploadError } = await supabase.storage.from("wedding-photos").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("wedding-photos").getPublicUrl(path);
      onImageChange(urlData.publicUrl);
      toast({ title: "Hero image uploaded! ✨" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <label className="font-body text-sm font-medium text-foreground mb-1 block">
        Background Image <span className="text-muted-foreground font-normal">(optional)</span>
      </label>
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

// ─── Gallery Editor ───────────────────────────────────────────────────
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
              {event.location && (
                <p className="text-xs text-muted-foreground/70 mt-0.5 truncate" style={{ fontFamily: bFont }}>{event.location}</p>
              )}
              {!event.date && !event.time && <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: bFont }}>Date & time TBD</p>}
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
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: accent, fontFamily: bFont }}>
                <MapPin className="w-3 h-3" /> {hotel.distance}
              </p>
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
