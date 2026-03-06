import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Heart, Eye, EyeOff, GripVertical, Plus, Trash2, ArrowLeft,
  Type, Palette, Settings, Sparkles, Save, ExternalLink, X,
  Calendar, MapPin, ChevronDown, ChevronUp, Image, Upload, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useWeddingSite } from "@/hooks/use-wedding-site";
import { useAuth } from "@/hooks/use-auth";
import { useGalleryPhotos, GalleryPhoto } from "@/hooks/use-gallery-photos";

// ─── Types ───────────────────────────────────────────────────────────
export interface WeddingSection {
  id: string;
  type: "hero" | "story" | "events" | "gallery" | "rsvp" | "custom";
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
}

interface EditorState {
  siteData: WeddingSiteData;
  sections: WeddingSection[];
  activePanel: "sections" | "style" | "settings" | null;
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

  const addSection = useCallback(() => {
    const newSection: WeddingSection = {
      id: `custom-${Date.now()}`,
      type: "custom",
      title: "New Section",
      visible: true,
      data: { heading: "New Section", body: "Add your content here..." },
    };
    setState((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
      selectedSectionId: newSection.id,
    }));
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
        <SitePreview sections={sections.filter((s) => s.visible)} bg={bg} accent={accent} light={light} />
      </div>
    );
  }

  // ─── Editor Layout ─────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top toolbar */}
      <header className="h-14 border-b border-border/50 bg-card/90 backdrop-blur-sm flex items-center px-4 gap-3 shrink-0 z-20">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Heart className="w-5 h-5 text-gold" fill="currentColor" />
        <span className="font-display text-lg font-semibold text-foreground">
          {siteData.partner1} & {siteData.partner2}
        </span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => updateState({ previewMode: true })}>
          <Eye className="w-4 h-4 mr-1" /> Preview
        </Button>
        <Button variant="gold" size="sm" onClick={handleSave}>
          <Save className="w-4 h-4 mr-1" /> Save
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - panel switcher */}
        <div className="w-14 border-r border-border/50 bg-card/50 flex flex-col items-center py-3 gap-1 shrink-0">
          {([
            { id: "sections" as const, icon: Type, label: "Sections" },
            { id: "style" as const, icon: Palette, label: "Style" },
            { id: "settings" as const, icon: Settings, label: "Settings" },
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

        {/* Left panel content */}
        <AnimatePresence>
          {activePanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r border-border/50 bg-card/80 overflow-hidden shrink-0"
            >
              <div className="w-80 h-full overflow-y-auto p-4">
                {activePanel === "sections" && (
                  <SectionsPanel
                    sections={sections}
                    selectedSectionId={selectedSectionId}
                    onSelect={(id) => updateState({ selectedSectionId: id })}
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
                  />
                )}
                {activePanel === "settings" && (
                  <SettingsPanel siteData={siteData} onUpdate={(d) => updateState({ siteData: d })} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center canvas */}
        <div className="flex-1 overflow-y-auto bg-muted/50">
          <div className="max-w-4xl mx-auto py-8 px-6">
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
                onClick={() => updateState({ selectedSectionId: section.id, activePanel: "sections" })}
              >
                {/* Section label */}
                <div className="absolute -top-3 left-4 z-10 bg-card border border-border/50 rounded-md px-2 py-0.5 text-xs font-body text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {section.title}
                </div>
                <SectionRenderer section={section} bg={bg} accent={accent} light={light} />
              </div>
            ))}
          </div>
        </div>

        {/* Right panel - section editor */}
        <AnimatePresence>
          {selectedSection && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-border/50 bg-card/80 overflow-hidden shrink-0"
            >
              <div className="w-[340px] h-full overflow-y-auto p-4">
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
          )}
        </AnimatePresence>
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
  onAdd: () => void;
}) {
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
              {section.type === "custom" && (
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

      <Button variant="outline" size="sm" className="w-full mt-4 font-body" onClick={onAdd}>
        <Plus className="w-4 h-4 mr-1" /> Add Section
      </Button>
    </div>
  );
}

// ─── Style Panel ──────────────────────────────────────────────────────
function StylePanel({
  colors,
  onColorChange,
}: {
  colors: string[];
  onColorChange: (colors: string[]) => void;
}) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-1">Style</h3>
      <p className="text-xs text-muted-foreground font-body mb-4">Customize your site's look</p>

      <div className="space-y-4">
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
        <div>
          <label className="font-body text-sm font-medium text-foreground mb-1 block">Heading</label>
          <Input
            value={data.heading || ""}
            onChange={(e) => onUpdateData({ heading: e.target.value })}
            className="font-body"
          />
          <div className="mt-4 border-2 border-dashed border-border rounded-xl p-8 text-center">
            <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-body">Photo uploads coming soon</p>
          </div>
        </div>
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
  event: { name: string; date: string; time: string; venue: string };
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
            placeholder="Venue"
            value={event.venue}
            onChange={(e) => onChange({ ...event, venue: e.target.value })}
            className="font-body text-sm h-8"
          />
        </div>
      )}
    </div>
  );
}

// ─── Section Renderer (canvas) ────────────────────────────────────────
function SectionRenderer({
  section,
  bg,
  accent,
  light,
}: {
  section: WeddingSection;
  bg: string;
  accent: string;
  light: string;
}) {
  const { type, data } = section;

  if (type === "hero") {
    return (
      <div
        className="relative py-20 px-6 text-center rounded-xl overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${bg}, ${bg}dd)` }}
      >
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            {[...Array(6)].map((_, i) => (
              <circle key={i} cx="200" cy="200" r={50 + i * 30} fill="none" stroke={light} strokeWidth="0.5" />
            ))}
          </svg>
        </div>
        <div className="relative z-10">
          <Heart className="w-7 h-7 mx-auto mb-3" style={{ color: accent }} fill="currentColor" />
          <p className="font-body text-xs tracking-widest uppercase mb-2" style={{ color: `${light}99` }}>
            {data.subheading}
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-2" style={{ color: light }}>
            {data.heading}
          </h1>
          <p className="font-display text-lg italic" style={{ color: accent }}>
            {data.tagline}
          </p>
        </div>
      </div>
    );
  }

  if (type === "story" || type === "custom") {
    return (
      <div className="bg-card rounded-xl px-8 py-10">
        <h2 className="font-display text-2xl font-bold text-foreground text-center mb-2">{data.heading}</h2>
        <div className="w-10 h-0.5 mx-auto mb-5" style={{ backgroundColor: accent }} />
        <p className="text-muted-foreground font-body text-center max-w-xl mx-auto leading-relaxed whitespace-pre-wrap">
          {data.body}
        </p>
      </div>
    );
  }

  if (type === "events") {
    return (
      <div className="bg-background rounded-xl px-8 py-10 border border-border/30">
        <h2 className="font-display text-2xl font-bold text-foreground text-center mb-2">{data.heading}</h2>
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
              <p className="font-display text-sm font-semibold text-foreground">{event.name}</p>
              {event.date && <p className="text-xs text-muted-foreground font-body mt-0.5">{event.date}</p>}
              {event.time && <p className="text-xs text-muted-foreground font-body">{event.time}</p>}
              {event.venue && (
                <p className="text-xs text-muted-foreground font-body flex items-center justify-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {event.venue}
                </p>
              )}
              {!event.date && !event.time && <p className="text-xs text-muted-foreground font-body mt-0.5">Date & time TBD</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "gallery") {
    return (
      <div className="bg-card rounded-xl px-8 py-10">
        <h2 className="font-display text-2xl font-bold text-foreground text-center mb-2">{data.heading}</h2>
        <div className="w-10 h-0.5 mx-auto mb-6" style={{ backgroundColor: accent }} />
        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted flex items-center justify-center">
              <Image className="w-6 h-6 text-muted-foreground/40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "rsvp") {
    return (
      <div className="rounded-xl px-8 py-10 text-center" style={{ background: `linear-gradient(135deg, ${bg}15, ${accent}10)` }}>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">{data.heading}</h2>
        <div className="w-10 h-0.5 mx-auto mb-4" style={{ backgroundColor: accent }} />
        <p className="text-muted-foreground font-body mb-6 max-w-md mx-auto">{data.body}</p>
        <div className="max-w-sm mx-auto space-y-3">
          <Input placeholder="Your Name" className="font-body" disabled />
          <Input placeholder="Email Address" className="font-body" disabled />
          <Button variant="gold" className="w-full font-body" disabled>
            RSVP Now
          </Button>
        </div>
        <p className="text-xs text-muted-foreground font-body mt-3">RSVP form preview — functional when published</p>
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
}: {
  sections: WeddingSection[];
  bg: string;
  accent: string;
  light: string;
}) {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {sections.map((section) => (
        <div key={section.id} className="mb-0">
          <SectionRenderer section={section} bg={bg} accent={accent} light={light} />
        </div>
      ))}
    </div>
  );
}

export default Editor;
