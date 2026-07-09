import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Heart, ArrowLeft, ArrowRight, Check, Sparkles, Users, BookOpen, Palette, Calendar, Wand2, Loader2, GripVertical, Edit3, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWeddingWizard, CULTURAL_PRESETS, THEME_OPTIONS, COLOR_PALETTES } from "@/hooks/use-wedding-wizard";
import WizardPreview from "@/components/WizardPreview";
import { useAIContentGen } from "@/hooks/use-ai-content-gen";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const stepMeta = [
  { key: "names", icon: Users, label: "Names" },
  { key: "story", icon: BookOpen, label: "Story" },
  { key: "theme", icon: Palette, label: "Theme" },
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
    nextStep, prevStep, completeWizard, isComplete,
  } = useWeddingWizard();
  const { generate, loading: aiLoading } = useAIContentGen();
  const [customEvent, setCustomEvent] = useState("");
  const [storyPrompts, setStoryPrompts] = useState({ where: "", when: "", firstImpression: "" });
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
          const evts = Array.isArray(eventsSection?.items)
            ? eventsSection.items.map((i: any) => i?.name).filter(Boolean)
            : Array.isArray(eventsSection?.events)
              ? eventsSection.events.map((i: any) => (typeof i === "string" ? i : i?.name)).filter(Boolean)
              : [];
          if (evts.length) updateField("functions", evts as string[]);
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
  const firstMissing = (["names", "story", "theme", "events"] as const).find((k) => !completion[k]);

  // Apply template preset if navigated from templates
  useEffect(() => {
    if (templateState?.templateColors) {
      updateField("suggestedColors", templateState.templateColors);
    }
    if (templateState?.templateStyle) {
      updateField("theme", templateState.templateStyle);
    }
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
      case "theme": return wizardData.suggestedColors.length >= 3;
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
                    <p className="text-muted-foreground font-body mt-2">Choose a theme and color palette</p>
                  </div>
                  <div>
                    <label className="text-sm font-body font-medium text-foreground mb-2 block">Theme</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {THEME_OPTIONS.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => updateField("theme", t.value)}
                          className={`rounded-xl border-2 px-4 py-3 text-left transition-all ${
                            wizardData.theme === t.value
                              ? "border-gold bg-gold/10"
                              : "border-border hover:border-gold/50"
                          }`}
                        >
                          <p className={`text-sm font-body font-semibold ${wizardData.theme === t.value ? "text-gold" : "text-foreground"}`}>{t.label}</p>
                          <p className="text-xs text-muted-foreground font-body mt-0.5">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-body font-medium text-foreground mb-2 block">Color Palette</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {COLOR_PALETTES.map((p) => {
                        const isSelected = JSON.stringify(wizardData.suggestedColors) === JSON.stringify(p.colors);
                        return (
                          <button
                            key={p.name}
                            onClick={() => updateField("suggestedColors", p.colors)}
                            className={`rounded-xl border-2 p-3 transition-all ${
                              isSelected ? "border-gold bg-gold/5 shadow-sm" : "border-border hover:border-gold/50"
                            }`}
                          >
                            <div className="flex gap-1 mb-2">
                              {p.colors.map((c, i) => (
                                <div key={i} className="w-6 h-6 rounded-full border border-border/50" style={{ backgroundColor: c }} />
                              ))}
                            </div>
                            <p className={`text-xs font-body ${isSelected ? "text-gold font-semibold" : "text-muted-foreground"}`}>{p.name}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
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
                        Ceremony Order <span className="text-muted-foreground font-normal">(drag to reorder)</span>
                      </label>
                      <Reorder.Group
                        axis="y"
                        values={wizardData.functions}
                        onReorder={(newOrder) => updateField("functions", newOrder)}
                        className="space-y-1.5"
                      >
                        {wizardData.functions.map((event, i) => (
                          <Reorder.Item key={event} value={event}>
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-card border border-border/50 cursor-grab active:cursor-grabbing hover:border-gold/30 transition-colors">
                              <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                              <span className="text-xs font-body text-muted-foreground w-5">{i + 1}.</span>
                              <span className="font-body text-sm text-foreground flex-1">{event}</span>
                            </div>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
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
                    {/* Mini preview hero */}
                    <div
                      className="py-12 px-6 text-center"
                      style={{ background: `linear-gradient(135deg, ${wizardData.suggestedColors[0]}, ${wizardData.suggestedColors[0]}dd)` }}
                    >
                      <Heart className="w-6 h-6 mx-auto mb-3" style={{ color: wizardData.suggestedColors[1] }} fill="currentColor" />
                      <h3 className="font-display text-3xl font-bold" style={{ color: wizardData.suggestedColors[2] }}>
                        {wizardData.partner1} & {wizardData.partner2}
                      </h3>
                      <p className="font-display text-base italic mt-2" style={{ color: wizardData.suggestedColors[1] }}>
                        {wizardData.tagline || "Two hearts, one beautiful journey"}
                      </p>
                    </div>
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
            ) : (
              <>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
