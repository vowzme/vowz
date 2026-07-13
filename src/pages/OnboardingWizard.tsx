import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Heart, ArrowLeft, ArrowRight, Check, Sparkles, Users, BookOpen, Palette, Calendar, Wand2, Loader2, GripVertical, Edit3, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useWeddingWizard, CULTURAL_PRESETS } from "@/hooks/use-wedding-wizard";
import { WEDDING_THEMES } from "@/lib/wedding-themes";
import { ThemeDemo } from "@/components/ThemeDemo";
import WizardPreview from "@/components/WizardPreview";
import { useAIContentGen } from "@/hooks/use-ai-content-gen";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeColors, DEFAULT_COLORS } from "@/hooks/use-wedding-site";

// Regex for a valid CSS hex color (3/4/6/8 digits, optional leading #).
const HEX_RE = /^#?[0-9a-fA-F]{3,8}$/;

const stepMeta = [
  { key: "names", icon: Users, label: "Names" },
  { key: "theme", icon: Palette, label: "Theme" },
  { key: "story", icon: BookOpen, label: "Story" },
  { key: "events", icon: Calendar, label: "Events" },
  { key: "preview", icon: Sparkles, label: "Preview" },
] as const;

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const locationState = location.state as { templateName?: string; templateStyle?: string; templateColors?: string[] } | null;
  const templateState = locationState?.templateName ? locationState : (() => {
    const stored = sessionStorage.getItem("pendingTemplate");
    if (stored) {
      sessionStorage.removeItem("pendingTemplate");
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  })();

  const {
    step, setStep, wizardData, updateField, applyCulturalPreset,
    nextStep, prevStep, completeWizard, isComplete, resetDraft,
    conflict, acceptRemoteDraft, dismissConflict,
  } = useWeddingWizard();
  const { generate, loading: aiLoading } = useAIContentGen();
  const [customEvent, setCustomEvent] = useState("");
  const [storyPrompts, setStoryPrompts] = useState({ where: "", when: "", firstImpression: "" });
  // Confirmation prompt when switching from an already-selected theme.
  const [pendingTheme, setPendingTheme] = useState<typeof WEDDING_THEMES[number] | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const applyTheme = (t: typeof WEDDING_THEMES[number]) => {
    updateField("theme", t.id);
    updateField("suggestedColors", [t.colors.bg, t.colors.accent, t.colors.light]);
    updateField("displayFont", t.fonts.display);
    updateField("bodyFont", t.fonts.body);
  };
  // Resume flow: when user clicks "Wedding Wizard" from the dashboard we pass
  // ?resume=1. We hydrate wizardData from their existing site and show a
  // summary screen so they can pick up where they left off.
  const wantsResume = searchParams.get("resume") === "1";
  const [resumeLoading, setResumeLoading] = useState<boolean>(wantsResume);
  const [showResumeSummary, setShowResumeSummary] = useState<boolean>(false);
  const [existingSiteId, setExistingSiteId] = useState<string | null>(null);

  useEffect(() => {
    if (!wantsResume) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (!cancelled) setResumeLoading(false); return; }
        const { data: site } = await supabase
          .from("wedding_sites")
          .select("id, partner1, partner2, tagline, how_we_met, theme, suggested_colors, cultural_background, sections")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        if (site) {
          setExistingSiteId((site as any).id);
          updateField("partner1", (site as any).partner1 || "");
          updateField("partner2", (site as any).partner2 || "");
          updateField("tagline", (site as any).tagline || "");
          updateField("howWeMet", (site as any).how_we_met || "");
          // Derive selected events from the sections jsonb (events section) if present.
          const sections = Array.isArray((site as any).sections) ? (site as any).sections : [];
          const eventsSection = sections.find((s: any) => s?.type === "events" || s?.id === "events");
          const rawEvents: any[] = Array.isArray(eventsSection?.data?.events)
            ? eventsSection.data.events
            : Array.isArray(eventsSection?.items)
              ? eventsSection.items
              : Array.isArray(eventsSection?.events)
                ? eventsSection.events
                : [];
          const evts = rawEvents
            .map((i: any) => (typeof i === "string" ? i : i?.name))
            .filter(Boolean) as string[];
          if (evts.length) updateField("functions", evts);
          const dateMap: Record<string, { date?: string; time?: string; venue?: string }> = {};
          rawEvents.forEach((i: any) => {
            if (i && typeof i === "object" && i.name && (i.date || i.time || i.venue)) {
              dateMap[i.name] = { date: i.date || "", time: i.time || "", venue: i.venue || "" };
            }
          });
          if (Object.keys(dateMap).length) updateField("eventDates", dateMap);
          if ((site as any).theme) updateField("theme", (site as any).theme);
          const cols = (site as any).suggested_colors;
          if (Array.isArray(cols) && cols.length >= 3) updateField("suggestedColors", cols as string[]);
          if ((site as any).cultural_background) updateField("culturalBackground", (site as any).cultural_background);
          setShowResumeSummary(true);
        }
      } catch {
        // fall through to normal wizard
      } finally {
        if (!cancelled) setResumeLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [wantsResume]);

  // Which fields are still missing? Drives the summary UI + jump-to-step.
  const completion = {
    names: Boolean(wizardData.partner1.trim() && wizardData.partner2.trim()),
    story: (wizardData.howWeMet || "").trim().length >= 10,
    theme: (wizardData.suggestedColors || []).length >= 3 && Boolean(wizardData.theme),
    events: (wizardData.functions || []).length > 0,
    tagline: Boolean((wizardData.tagline || "").trim()),
  } as const;
  const firstMissing = (["names", "theme", "story", "events"] as const).find((k) => !completion[k]);

  // Apply template preset if navigated from templates — but only when there
  // is no saved wizard draft. Otherwise the useWeddingWizard hook has already
  // rehydrated the user's in-progress answers from localStorage, and blindly
  // overwriting theme/colors would drop the customizations they left off on.
  useEffect(() => {
    if (!templateState) return;
    let hasSavedDraft = false;
    try {
      hasSavedDraft = Boolean(
        (typeof localStorage !== "undefined" && localStorage.getItem("vowz_wizard_draft")) ||
        (typeof sessionStorage !== "undefined" && sessionStorage.getItem("vowz_wizard_draft"))
      );
    } catch { /* storage disabled — fall through and apply the template */ }
    if (hasSavedDraft) return;
    if (templateState.templateColors) {
      updateField("suggestedColors", templateState.templateColors);
    }
    if (templateState.templateStyle) {
      updateField("theme", templateState.templateStyle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  if (isComplete) {
    return <WizardPreview data={wizardData} />;
  }

  // Resume summary screen: shown once when user opens the wizard on top of
  // an existing (possibly partial) site.
  if (showResumeSummary) {
    const rows: Array<{ key: keyof typeof completion; label: string; hint: string; step: typeof stepMeta[number]["key"] }> = [
      { key: "names",   label: "Couple names",    hint: `${wizardData.partner1 || "—"} & ${wizardData.partner2 || "—"}`, step: "names" },
      { key: "story",   label: "Your love story", hint: (wizardData.howWeMet || "").slice(0, 80) || "Not written yet", step: "story" },
      { key: "theme",   label: "Theme & colors",  hint: `${wizardData.theme || "—"} · ${(wizardData.suggestedColors || []).length} colors`, step: "theme" },
      { key: "events",  label: "Wedding events",  hint: (wizardData.functions || []).join(", ") || "None selected", step: "events" },
      { key: "tagline", label: "Tagline",         hint: wizardData.tagline || "We'll auto-generate one", step: "story" },
    ];
    const completedCount = rows.filter((r) => completion[r.key]).length;
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <SEOHead title="Continue Your Wedding Site – Vowz" description="Pick up where you left off." robots="noindex, nofollow" />
        <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} aria-label="Back to dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-foreground">Continue where you left off</p>
                <p className="text-xs text-muted-foreground font-body">{completedCount} of {rows.length} sections complete</p>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            <div className="text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Welcome back 💍</h2>
              <p className="text-muted-foreground font-body mt-2">
                Here's what you've already added. Jump into any section to update it, or open the full editor for fine-grained control.
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card divide-y divide-border/50">
              {rows.map((row) => {
                const done = completion[row.key];
                return (
                  <button
                    key={row.key}
                    onClick={() => { setStep(row.step); setShowResumeSummary(false); }}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                    aria-label={`${done ? "Edit" : "Complete"} ${row.label}`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/15 text-amber-700 dark:text-amber-300"}`}>
                      {done ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-body text-sm font-semibold text-foreground">{row.label}</p>
                      <p className="font-body text-xs text-muted-foreground truncate">{row.hint}</p>
                    </div>
                    <span className={`text-[10px] font-body uppercase tracking-wide shrink-0 ${done ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
                      {done ? "Done" : "Missing"}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="gold"
                size="lg"
                className="flex-1 h-12"
                onClick={() => {
                  if (firstMissing) setStep(firstMissing);
                  else setStep("preview");
                  setShowResumeSummary(false);
                }}
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                {firstMissing ? `Continue: ${stepMeta.find(s => s.key === firstMissing)?.label}` : "Review & Finish"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-12"
                onClick={() => navigate("/editor")}
              >
                <Edit3 className="w-4 h-4 mr-1.5" /> Edit manually
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground font-body">
              Prefer full control? The manual editor lets you customize every field — hero, story, events, gallery, travel, RSVP, and more.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (resumeLoading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gold animate-spin" aria-label="Loading your site details" />
      </div>
    );
  }

  const currentStepIdx = stepMeta.findIndex((s) => s.key === step);

  const canProceed = () => {
    switch (step) {
      case "names": return wizardData.partner1.trim() && wizardData.partner2.trim();
      case "story": return true;
      case "theme": return true;
      case "events": return wizardData.functions.length > 0;
      case "preview": return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step === "preview") {
      completeWizard();
    } else {
      nextStep();
    }
  };


  const toggleEvent = (event: string) => {
    const current = wizardData.functions;
    if (current.includes(event)) {
      updateField("functions", current.filter((e) => e !== event));
    } else {
      updateField("functions", [...current, event]);
    }
  };

  const addCustomEvent = () => {
    const val = customEvent.trim();
    if (val && !wizardData.functions.includes(val)) {
      updateField("functions", [...wizardData.functions, val]);
      setCustomEvent("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Wedding Website Wizard – Vowz" description="Create your wedding website step by step." robots="noindex, nofollow" />
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-gold" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-foreground">Create Your Wedding Site</p>
              <p className="text-xs text-muted-foreground font-body">Step {currentStepIdx + 1} of {stepMeta.length}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            aria-label="Reset wizard draft"
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-md hover:bg-muted"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset draft
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-3xl mx-auto w-full px-4 pt-4">
        <div className="flex items-center gap-1">
          {stepMeta.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === currentStepIdx;
            const isDone = i < currentStepIdx;
            return (
              <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors ${
                  isDone ? "bg-gold text-primary-foreground" : isActive ? "bg-gold/20 text-gold border-2 border-gold" : "bg-muted text-muted-foreground"
                }`}>
                  {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[10px] font-body ${isActive ? "text-gold font-semibold" : "text-muted-foreground"}`}>{s.label}</span>
                <div className={`w-full h-1 rounded-full ${isDone ? "bg-gold" : isActive ? "bg-gold/40" : "bg-muted"}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              {step === "names" && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Who's getting married? 💍</h2>
                    <p className="text-muted-foreground font-body mt-2">Let's start with the basics</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="wiz-partner1" className="text-sm font-body font-medium text-foreground mb-1 block">Partner 1</label>
                      <Input
                        id="wiz-partner1"
                        placeholder="e.g. Priya"
                        value={wizardData.partner1}
                        onChange={(e) => updateField("partner1", e.target.value)}
                        className="h-12 font-body"
                      />
                    </div>
                    <div>
                      <label htmlFor="wiz-partner2" className="text-sm font-body font-medium text-foreground mb-1 block">Partner 2</label>
                      <Input
                        id="wiz-partner2"
                        placeholder="e.g. Rahul"
                        value={wizardData.partner2}
                        onChange={(e) => updateField("partner2", e.target.value)}
                        className="h-12 font-body"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-body font-medium text-foreground mb-2 block">Cultural / Religious Background</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.keys(CULTURAL_PRESETS).map((culture) => (
                        <button
                          key={culture}
                          onClick={() => applyCulturalPreset(culture)}
                          className={`rounded-xl border-2 px-4 py-3 text-sm font-body transition-all ${
                            wizardData.culturalBackground === culture
                              ? "border-gold bg-gold/10 text-gold font-semibold"
                              : "border-border hover:border-gold/50 text-foreground"
                          }`}
                        >
                          {culture}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === "story" && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Your Love Story ✨</h2>
                    <p className="text-muted-foreground font-body mt-2">Answer a few questions and let AI craft your story, or write your own!</p>
                  </div>

                  {/* AI Story Generator */}
                  <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Wand2 className="w-4 h-4 text-accent" />
                      <span className="font-body text-sm font-semibold text-accent">AI Story Generator</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label htmlFor="wiz-where" className="text-xs font-body font-medium text-muted-foreground mb-1 block">Where did you meet?</label>
                        <Input
                          id="wiz-where"
                          placeholder="e.g. at a café in Mumbai"
                          value={storyPrompts.where}
                          onChange={(e) => setStoryPrompts({ ...storyPrompts, where: e.target.value })}
                          className="h-10 font-body text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="wiz-when" className="text-xs font-body font-medium text-muted-foreground mb-1 block">When was it?</label>
                        <Input
                          id="wiz-when"
                          placeholder="e.g. college days, 2019"
                          value={storyPrompts.when}
                          onChange={(e) => setStoryPrompts({ ...storyPrompts, when: e.target.value })}
                          className="h-10 font-body text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="wiz-first" className="text-xs font-body font-medium text-muted-foreground mb-1 block">First impression?</label>
                        <Input
                          id="wiz-first"
                          placeholder="e.g. love at first sight"
                          value={storyPrompts.firstImpression}
                          onChange={(e) => setStoryPrompts({ ...storyPrompts, firstImpression: e.target.value })}
                          className="h-10 font-body text-sm"
                        />
                      </div>
                    </div>
                    <Button
                      variant="gold"
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={aiLoading === "story" || (!storyPrompts.where && !storyPrompts.when && !storyPrompts.firstImpression)}
                      onClick={async () => {
                        const briefDetails = [
                          storyPrompts.where && `Met ${storyPrompts.where}`,
                          storyPrompts.when && `around ${storyPrompts.when}`,
                          storyPrompts.firstImpression && `First impression: ${storyPrompts.firstImpression}`,
                        ].filter(Boolean).join(". ");
                        const result = await generate({
                          type: "story",
                          context: {
                            partner1: wizardData.partner1,
                            partner2: wizardData.partner2,
                            culturalBackground: wizardData.culturalBackground,
                            howWeMet: briefDetails,
                          },
                        });
                        if (result) updateField("howWeMet", result);
                      }}
                    >
                      {aiLoading === "story" ? (
                        <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Generating...</>
                      ) : (
                        <><Wand2 className="w-4 h-4 mr-1.5" /> Generate Story with AI</>
                      )}
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
                    <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground font-body">or write your own</span></div>
                  </div>

                  <Textarea
                    aria-label="Your love story"
                    placeholder="We met at a coffee shop in Mumbai when we accidentally grabbed each other's orders. One wrong cup led to a thousand right moments together..."
                    value={wizardData.howWeMet}
                    onChange={(e) => updateField("howWeMet", e.target.value)}
                    className="min-h-[160px] font-body text-base leading-relaxed"
                  />
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="wiz-tagline" className="text-sm font-body font-medium text-foreground">Custom Tagline (optional)</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-accent hover:text-accent"
                        disabled={aiLoading === "tagline"}
                        onClick={async () => {
                          const result = await generate({
                            type: "tagline",
                            context: {
                              partner1: wizardData.partner1,
                              partner2: wizardData.partner2,
                              culturalBackground: wizardData.culturalBackground,
                              howWeMet: wizardData.howWeMet,
                              theme: wizardData.theme,
                            },
                          });
                          if (result) updateField("tagline", result);
                        }}
                      >
                        {aiLoading === "tagline" ? (
                          <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating</>
                        ) : (
                          <><Wand2 className="w-3 h-3 mr-1" /> AI Generate</>
                        )}
                      </Button>
                    </div>
                    <Input
                      id="wiz-tagline"
                      placeholder="e.g. Two hearts, one beautiful journey"
                      value={wizardData.tagline}
                      onChange={(e) => updateField("tagline", e.target.value)}
                      className="h-12 font-body"
                    />
                    <p className="text-xs text-muted-foreground font-body mt-1">Leave blank and we'll generate one for you</p>
                  </div>
                </div>
              )}

              {step === "theme" && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Pick Your Style 🎨</h2>
                    <p className="text-muted-foreground font-body mt-2">
                      Choose a theme — colors and typography are preconfigured for you.
                    </p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      Not sure yet? Skip this — you can pick or change your theme later in the editor without losing anything.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {WEDDING_THEMES.map((t) => {
                      const isSelected = wizardData.theme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            // Ask before overwriting an existing theme selection.
                            if (wizardData.theme && wizardData.theme !== t.id) {
                              setPendingTheme(t);
                            } else {
                              applyTheme(t);
                            }
                          }}
                          className={`text-left rounded-2xl border-2 transition-all overflow-hidden ${
                            isSelected ? "border-gold shadow-md" : "border-transparent hover:border-gold/40"
                          }`}
                        >
                          <ThemeDemo theme={t} compact />
                          <div className="p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`font-display font-semibold text-sm ${isSelected ? "text-gold" : "text-foreground"}`}>{t.name}</p>
                              {isSelected && <Check className="w-4 h-4 text-gold" />}
                            </div>
                            <p className="text-[11px] text-muted-foreground font-body mt-0.5 line-clamp-1">{t.tagline}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {(() => {
                    const active = WEDDING_THEMES.find((t) => t.id === wizardData.theme);
                    if (!active) return null;
                    const p1 = wizardData.partner1 || "Aarav";
                    const p2 = wizardData.partner2 || "Isha";
                    const tagline = wizardData.tagline || active.tagline;
                    return (
                      <div className="mt-8">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs uppercase tracking-widest font-body text-muted-foreground">Live preview</p>
                          <p className="text-xs font-body text-muted-foreground">{active.name}</p>
                        </div>
                        <div
                          className="rounded-2xl border shadow-sm overflow-hidden"
                          style={{ background: active.colors.bg, color: active.colors.ink }}
                        >
                          <div
                            className="px-6 py-12 md:py-16 text-center"
                            style={{
                              backgroundImage: `radial-gradient(circle at 50% 0%, ${active.colors.light}55, transparent 60%)`,
                            }}
                          >
                            <p
                              className="text-[11px] tracking-[0.3em] uppercase mb-4"
                              style={{ color: active.colors.accent, fontFamily: active.fonts.body }}
                            >
                              You're invited
                            </p>
                            <h3
                              className="text-3xl md:text-5xl font-bold leading-tight"
                              style={{ fontFamily: active.fonts.display, color: active.colors.ink }}
                            >
                              {p1} <span style={{ color: active.colors.accent }}>&</span> {p2}
                            </h3>
                            <p
                              className="mt-4 text-sm md:text-base opacity-80"
                              style={{ fontFamily: active.fonts.body }}
                            >
                              {tagline}
                            </p>
                            <div className="mt-6 inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs md:text-sm"
                              style={{
                                background: active.colors.accent,
                                color: active.colors.bg,
                                fontFamily: active.fonts.body,
                              }}
                            >
                              RSVP
                            </div>
                          </div>
                          <div className="px-6 py-4 flex items-center justify-center gap-2 border-t" style={{ borderColor: `${active.colors.accent}33` }}>
                            {[active.colors.bg, active.colors.accent, active.colors.light].map((c) => (
                              <span key={c} className="w-5 h-5 rounded-full border" style={{ background: c, borderColor: `${active.colors.ink}22` }} />
                            ))}
                            <span className="ml-2 text-[11px] font-body opacity-70">
                              {active.fonts.display.split(",")[0]} · {active.fonts.body.split(",")[0]}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {step === "events" && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Your Wedding Events 🎊</h2>
                    <p className="text-muted-foreground font-body mt-2">Select events, then drag to arrange ceremony order</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(() => {
                      const presetEvents = (CULTURAL_PRESETS[wizardData.culturalBackground] || CULTURAL_PRESETS.Other).events;
                      const customEvents = wizardData.functions.filter((e) => !presetEvents.includes(e));
                      const allEvents = [...presetEvents, ...customEvents];
                      return allEvents.map((event) => {
                        const isSelected = wizardData.functions.includes(event);
                        const isCustom = customEvents.includes(event);
                        return (
                          <button
                            key={event}
                            onClick={() => toggleEvent(event)}
                            className={`rounded-xl border-2 px-4 py-3 text-sm font-body transition-all flex items-center gap-2 ${
                              isSelected
                                ? "border-gold bg-gold/10 text-gold font-semibold"
                                : "border-border hover:border-gold/50 text-foreground"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                              isSelected ? "border-gold bg-gold" : "border-muted-foreground/40"
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            {event}
                            {isCustom && <span className="text-xs text-muted-foreground ml-auto">✕</span>}
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* Reorderable selected events */}
                  {wizardData.functions.length > 0 && (
                    <div>
                      <label className="text-sm font-body font-medium text-foreground mb-2 block">
                        Ceremony Order &amp; Schedule <span className="text-muted-foreground font-normal">(drag to reorder — date/time optional, edit later from the dashboard)</span>
                      </label>
                      <Reorder.Group
                        axis="y"
                        values={wizardData.functions}
                        onReorder={(newOrder) => updateField("functions", newOrder)}
                        className="space-y-2"
                      >
                        {wizardData.functions.map((event, i) => (
                          <Reorder.Item key={event} value={event}>
                            <div className="rounded-lg bg-card border border-border/50 hover:border-gold/30 transition-colors">
                              <div className="flex items-center gap-2 px-3 py-2.5 cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                                <span className="text-xs font-body text-muted-foreground w-5">{i + 1}.</span>
                                <span className="font-body text-sm text-foreground flex-1">{event}</span>
                                {(wizardData.eventDates?.[event]?.date || wizardData.eventDates?.[event]?.time) && (
                                  <span className="text-[10px] font-body text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                                    {wizardData.eventDates[event].date || ""}{wizardData.eventDates[event].time ? ` · ${wizardData.eventDates[event].time}` : ""}
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-3 pb-3 border-t border-border/30 pt-2.5">
                                <div>
                                  <label htmlFor={`event-date-${i}`} className="text-[10px] uppercase tracking-wide font-body text-muted-foreground mb-1 block">Date</label>
                                  <Input
                                    id={`event-date-${i}`}
                                    type="date"
                                    className="h-9 font-body text-xs"
                                    value={wizardData.eventDates?.[event]?.date || ""}
                                    onChange={(e) => updateField("eventDates", {
                                      ...(wizardData.eventDates || {}),
                                      [event]: { ...(wizardData.eventDates?.[event] || {}), date: e.target.value },
                                    })}
                                  />
                                </div>
                                <div>
                                  <label htmlFor={`event-time-${i}`} className="text-[10px] uppercase tracking-wide font-body text-muted-foreground mb-1 block">Time</label>
                                  <Input
                                    id={`event-time-${i}`}
                                    type="time"
                                    className="h-9 font-body text-xs"
                                    value={wizardData.eventDates?.[event]?.time || ""}
                                    onChange={(e) => updateField("eventDates", {
                                      ...(wizardData.eventDates || {}),
                                      [event]: { ...(wizardData.eventDates?.[event] || {}), time: e.target.value },
                                    })}
                                  />
                                </div>
                                <div>
                                  <label htmlFor={`event-venue-${i}`} className="text-[10px] uppercase tracking-wide font-body text-muted-foreground mb-1 block">Venue</label>
                                  <Input
                                    id={`event-venue-${i}`}
                                    placeholder="Optional"
                                    className="h-9 font-body text-xs"
                                    value={wizardData.eventDates?.[event]?.venue || ""}
                                    onChange={(e) => updateField("eventDates", {
                                      ...(wizardData.eventDates || {}),
                                      [event]: { ...(wizardData.eventDates?.[event] || {}), venue: e.target.value },
                                    })}
                                  />
                                </div>
                              </div>
                            </div>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                      <p className="text-xs text-muted-foreground font-body mt-2">
                        You can skip dates and times now and add or update them anytime from your dashboard editor.
                      </p>
                    </div>
                  )}

                  {/* Custom event input */}
                  <div>
                    <label htmlFor="wiz-custom-event" className="text-sm font-body font-medium text-foreground mb-1 block">Add a custom event</label>
                    <div className="flex gap-2">
                      <Input
                        id="wiz-custom-event"
                        placeholder="e.g. Cocktail Night"
                        className="h-10 font-body"
                        value={customEvent}
                        onChange={(e) => setCustomEvent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomEvent();
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10"
                        type="button"
                        onClick={addCustomEvent}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {step === "preview" && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Looking Good! 🎉</h2>
                    <p className="text-muted-foreground font-body mt-2">Review your details and create your site</p>
                  </div>
                  <div className="rounded-2xl border border-border overflow-hidden">
                    {/* Mini preview hero — palette is sanitized so empty/short/invalid
                        colors never break the render. Invalid entries surface as
                        disabled placeholder swatches below. */}
                    {(() => {
                      const raw = wizardData.suggestedColors || [];
                      const safe = sanitizeColors(raw);
                      const [bg, accent, light] = safe;
                      const paletteSlots = [0, 1, 2].map((i) => {
                        const val = raw[i];
                        const isValid = typeof val === "string" && HEX_RE.test(val.trim());
                        return { color: safe[i], isValid, isPlaceholder: !isValid };
                      });
                      return (
                        <>
                          <div
                            className="py-12 px-6 text-center"
                            style={{ background: `linear-gradient(135deg, ${bg}, ${bg}dd)` }}
                          >
                            <Heart className="w-6 h-6 mx-auto mb-3" style={{ color: accent }} fill="currentColor" />
                            <h3 className="font-display text-3xl font-bold" style={{ color: light }}>
                              {wizardData.partner1} & {wizardData.partner2}
                            </h3>
                            <p className="font-display text-base italic mt-2" style={{ color: accent }}>
                              {wizardData.tagline || "Two hearts, one beautiful journey"}
                            </p>
                          </div>
                          <div className="bg-card px-6 py-3 border-b border-border/50 flex items-center gap-3">
                            <span className="text-[11px] uppercase tracking-widest font-body text-muted-foreground">Palette</span>
                            <div className="flex items-center gap-2">
                              {paletteSlots.map((slot, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  aria-disabled={slot.isPlaceholder || undefined}
                                  disabled={slot.isPlaceholder}
                                  title={slot.isPlaceholder
                                    ? "Placeholder — pick a theme to fill this swatch"
                                    : slot.color}
                                  className={`relative w-6 h-6 rounded-full border transition-opacity ${
                                    slot.isPlaceholder
                                      ? "opacity-40 cursor-not-allowed border-dashed border-muted-foreground/50"
                                      : "border-border/60 hover:scale-110"
                                  }`}
                                  style={{ background: slot.color }}
                                >
                                  {slot.isPlaceholder && (
                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">?</span>
                                  )}
                                </button>
                              ))}
                            </div>
                            {paletteSlots.some((s) => s.isPlaceholder) && (
                              <span className="ml-auto text-[11px] font-body text-muted-foreground">
                                Using safe defaults — pick a theme to complete
                              </span>
                            )}
                          </div>
                        </>
                      );
                    })()}
                    <div className="bg-card p-6 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-body">
                        <span className="text-muted-foreground">Culture:</span>
                        <span className="text-foreground font-medium">{wizardData.culturalBackground}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-body">
                        <span className="text-muted-foreground">Theme:</span>
                        <span className="text-foreground font-medium capitalize">{wizardData.theme}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-body">
                        <span className="text-muted-foreground">Events:</span>
                        <span className="text-foreground font-medium">{wizardData.functions.join(", ")}</span>
                      </div>
                      <div className="text-sm font-body">
                        <span className="text-muted-foreground">Story:</span>
                        <p className="text-foreground mt-1">{wizardData.howWeMet}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-t border-border/50 bg-card/80 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between">
          <Button
            variant="outline"
            onClick={step === "names" ? () => navigate("/") : prevStep}
            className="h-11"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {step === "names" ? "Home" : "Back"}
          </Button>
          <Button
            variant="gold"
            onClick={handleNext}
            disabled={!canProceed()}
            className="h-11"
          >
            {step === "preview" ? (
              <>
                <Sparkles className="w-4 h-4 mr-1" /> Create My Site
              </>
            ) : step === "story" && wizardData.howWeMet.trim().length < 10 ? (
              <>
                Skip <ArrowRight className="w-4 h-4 ml-1" />
              </>
            ) : step === "theme" && !wizardData.theme ? (
              <>
                Skip for now <ArrowRight className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>

      <AlertDialog open={!!pendingTheme} onOpenChange={(o) => !o && setPendingTheme(null)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to {pendingTheme?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Only the theme colors and fonts will change. Your names, story, event details (dates, times, venues), RSVP settings, and any gallery media you've uploaded stay exactly as they are.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingTheme && (
            <div className="mt-2">
              {(() => {
                const current = WEDDING_THEMES.find((x) => x.id === wizardData.theme);
                if (!current || current.id === pendingTheme.id) return null;
                const rows: { label: string; from: string; to: string; swatchFrom?: string; swatchTo?: string; changed: boolean }[] = [
                  { label: "Primary color", from: current.colors.bg, to: pendingTheme.colors.bg, swatchFrom: current.colors.bg, swatchTo: pendingTheme.colors.bg, changed: current.colors.bg !== pendingTheme.colors.bg },
                  { label: "Accent", from: current.colors.accent, to: pendingTheme.colors.accent, swatchFrom: current.colors.accent, swatchTo: pendingTheme.colors.accent, changed: current.colors.accent !== pendingTheme.colors.accent },
                  { label: "Ink / text", from: current.colors.ink, to: pendingTheme.colors.ink, swatchFrom: current.colors.ink, swatchTo: pendingTheme.colors.ink, changed: current.colors.ink !== pendingTheme.colors.ink },
                  { label: "Display font", from: current.fonts.display, to: pendingTheme.fonts.display, changed: current.fonts.display !== pendingTheme.fonts.display },
                  { label: "Body font", from: current.fonts.body, to: pendingTheme.fonts.body, changed: current.fonts.body !== pendingTheme.fonts.body },
                  { label: "Motif", from: current.motif, to: pendingTheme.motif, changed: current.motif !== pendingTheme.motif },
                ];
                return (
                  <div className="mb-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                    <p className="text-[10px] uppercase tracking-widest font-body text-muted-foreground mb-2">
                      Tokens that will change
                    </p>
                    <ul className="space-y-1.5 text-xs font-body">
                      {rows.map((r) => (
                        <li key={r.label} className={`flex items-center gap-2 ${r.changed ? "text-foreground" : "text-muted-foreground/70"}`}>
                          <span className="w-24 shrink-0">{r.label}</span>
                          <span className="flex items-center gap-1 min-w-0 flex-1">
                            {r.swatchFrom && <span className="w-3 h-3 rounded-full border border-border/60" style={{ background: r.swatchFrom }} aria-hidden />}
                            <span className="truncate">{r.from}</span>
                          </span>
                          <span className="text-muted-foreground shrink-0">→</span>
                          <span className="flex items-center gap-1 min-w-0 flex-1">
                            {r.swatchTo && <span className="w-3 h-3 rounded-full border border-border/60" style={{ background: r.swatchTo }} aria-hidden />}
                            <span className={`truncate ${r.changed ? "font-semibold" : ""}`}>{r.to}</span>
                          </span>
                          {!r.changed && <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">same</span>}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[10px] font-body text-muted-foreground">
                      Spacing and layout scale stay the same — only these design tokens change.
                    </p>
                  </div>
                );
              })()}
              <p className="text-[10px] uppercase tracking-widest font-body text-muted-foreground mb-2">Live preview</p>
              <div
                className="rounded-xl border overflow-hidden"
                style={{ background: pendingTheme.colors.bg, color: pendingTheme.colors.ink }}
              >
                <div
                  className="px-4 py-6 text-center"
                  style={{ backgroundImage: `radial-gradient(circle at 50% 0%, ${pendingTheme.colors.light}55, transparent 60%)` }}
                >
                  <p
                    className="text-[10px] tracking-[0.3em] uppercase mb-2"
                    style={{ color: pendingTheme.colors.accent, fontFamily: pendingTheme.fonts.body }}
                  >
                    You're invited
                  </p>
                  <h3
                    className="text-2xl font-bold leading-tight"
                    style={{ fontFamily: pendingTheme.fonts.display, color: pendingTheme.colors.ink }}
                  >
                    {(wizardData.partner1 || "Aarav")}{" "}
                    <span style={{ color: pendingTheme.colors.accent }}>&</span>{" "}
                    {(wizardData.partner2 || "Isha")}
                  </h3>
                  <p className="mt-2 text-xs opacity-80" style={{ fontFamily: pendingTheme.fonts.body }}>
                    {wizardData.tagline || pendingTheme.tagline}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2 border-t" style={{ borderColor: `${pendingTheme.colors.ink}22` }}>
                  {[pendingTheme.colors.bg, pendingTheme.colors.accent, pendingTheme.colors.light, pendingTheme.colors.ink].map((c) => (
                    <span key={c} className="w-4 h-4 rounded-full border" style={{ background: c, borderColor: `${pendingTheme.colors.ink}22` }} aria-hidden />
                  ))}
                  <span className="ml-auto text-[10px] font-body opacity-70" style={{ fontFamily: pendingTheme.fonts.body }}>
                    {pendingTheme.fonts.display} · {pendingTheme.fonts.body}
                  </span>
                </div>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep current theme</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (pendingTheme) applyTheme(pendingTheme); setPendingTheme(null); }}
            >
              Switch theme
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset your wizard draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears every answer you've entered — names, story, events, theme, colors — and deletes the autosaved draft from this device. You'll have 15 seconds to undo from the toast that appears.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my draft</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // Snapshot the current autosaved draft into a backup key so an
                // Undo action from the toast can restore it, even after the
                // page reload we perform below.
                const DRAFT_KEY = "vowz_wizard_draft";
                const BACKUP_KEY = "vowz_wizard_draft_backup";
                const UNDO_WINDOW_MS = 15000;
                try {
                  const snapshot =
                    localStorage.getItem(DRAFT_KEY) ||
                    sessionStorage.getItem(DRAFT_KEY);
                  if (snapshot) {
                    localStorage.setItem(
                      BACKUP_KEY,
                      JSON.stringify({ draft: snapshot, expiresAt: Date.now() + UNDO_WINDOW_MS }),
                    );
                  }
                } catch { /* storage disabled — undo simply won't be offered */ }
                resetDraft();
                setConfirmReset(false);
                toast({
                  title: "Draft cleared",
                  description: "Your wizard was reset. You have 15 seconds to undo.",
                  duration: UNDO_WINDOW_MS,
                  action: (
                    <ToastAction
                      altText="Undo draft reset"
                      onClick={() => {
                        try {
                          const raw = localStorage.getItem(BACKUP_KEY);
                          if (!raw) return;
                          const { draft, expiresAt } = JSON.parse(raw) as {
                            draft: string;
                            expiresAt: number;
                          };
                          if (Date.now() > expiresAt) {
                            localStorage.removeItem(BACKUP_KEY);
                            return;
                          }
                          localStorage.setItem(DRAFT_KEY, draft);
                          localStorage.removeItem(BACKUP_KEY);
                        } catch { /* ignore */ }
                        navigate(0 as any);
                      }}
                    >
                      Undo
                    </ToastAction>
                  ),
                });
                // Sweep the backup after the undo window expires.
                setTimeout(() => {
                  try { localStorage.removeItem(BACKUP_KEY); } catch {}
                }, UNDO_WINDOW_MS);
                // Force a fresh mount so the wizard re-reads defaults from storage.
                navigate(0 as any);
              }}
            >
              Reset draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!conflict} onOpenChange={(o) => !o && dismissConflict()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wizard edited in another tab</AlertDialogTitle>
            <AlertDialogDescription>
              A newer autosave was just made in another tab or window. Load the latest changes here so both tabs stay consistent, or keep this tab's version and overwrite the other one on your next edit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => dismissConflict()}>Keep this tab</AlertDialogCancel>
            <AlertDialogAction onClick={() => acceptRemoteDraft()}>Load latest changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OnboardingWizard;
