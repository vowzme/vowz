import { useState, useCallback, useEffect } from "react";
import { parseThemeStyle } from "@/lib/theme-schema";
import { supabase } from "@/integrations/supabase/client";

const WIZARD_STORAGE_KEY = "vowz_wizard_draft";
// Unique per-tab id so we can tell our own writes apart from another tab's.
const TAB_ID =
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
// Read from localStorage first (survives refresh, navigate-away, tab reopen),
// then fall back to sessionStorage for older in-progress drafts.
const readDraft = (): { step?: WizardStep; data?: Partial<WeddingData> } | null => {
  try {
    const raw =
      (typeof localStorage !== "undefined" && localStorage.getItem(WIZARD_STORAGE_KEY)) ||
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem(WIZARD_STORAGE_KEY));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const writeDraft = (payload: { step?: WizardStep; data?: Partial<WeddingData>; savedAt?: number }) => {
  try {
    localStorage.setItem(
      WIZARD_STORAGE_KEY,
      JSON.stringify({ ...payload, tabId: TAB_ID }),
    );
  } catch {}
};
const clearDraft = () => {
  try { localStorage.removeItem(WIZARD_STORAGE_KEY); } catch {}
  try { sessionStorage.removeItem(WIZARD_STORAGE_KEY); } catch {}
};

// Server-side wizard draft (wizard_drafts table) — an OPTIONAL cross-device
// sync layer on top of the localStorage autosave. All calls are best-effort:
// they fail silently for signed-out users or when the network is unreachable
// so the local wizard experience never depends on the server.
const fetchServerDraft = async (): Promise<
  { step?: WizardStep; data?: Partial<WeddingData>; savedAt?: number } | null
> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("wizard_drafts")
      .select("step, data, saved_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data) return null;
    return {
      step: (data as any).step as WizardStep,
      data: (data as any).data as Partial<WeddingData>,
      savedAt: new Date((data as any).saved_at).getTime(),
    };
  } catch { return null; }
};
const upsertServerDraft = async (payload: {
  step: WizardStep;
  data: WeddingData;
  savedAt: number;
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("wizard_drafts").upsert(
      {
        user_id: user.id,
        step: payload.step,
        data: payload.data as any,
        saved_at: new Date(payload.savedAt).toISOString(),
      },
      { onConflict: "user_id" },
    );
  } catch { /* best-effort */ }
};
const deleteServerDraft = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("wizard_drafts").delete().eq("user_id", user.id);
  } catch { /* best-effort */ }
};

export interface WeddingData {
  partner1: string;
  partner2: string;
  culturalBackground: string;
  howWeMet: string;
  functions: string[];
  eventDates: Record<string, { date?: string; time?: string; venue?: string }>;
  theme: string;
  suggestedColors: string[];
  displayFont?: string;
  bodyFont?: string;
  tagline: string;
  countdownLabel?: string;
  travelInfo?: {
    heading: string;
    description: string;
    hotels: { name: string; description: string; distance: string }[];
    directions: string;
  };
  welcomeMessage?: string;
  /** Optional invitation-card design slug chosen while building the site. */
  cardTemplate?: string;
}

export type WizardStep = "names" | "story" | "theme" | "events" | "preview";

const WIZARD_STEPS: WizardStep[] = ["names", "theme", "story", "events", "preview"];

const CULTURAL_PRESETS: Record<string, { events: string[]; colors: string[]; theme: string }> = {
  Hindu: {
    events: ["Engagement", "Mehendi", "Haldi", "Sangeet", "Wedding", "Reception"],
    colors: ["#6B1D2A", "#D4A853", "#FFF5E6"],
    theme: "traditional",
  },
  Muslim: {
    events: ["Engagement", "Mehendi", "Nikaah", "Walima", "Reception"],
    colors: ["#1B5E20", "#D4A853", "#FFF8E1"],
    theme: "traditional",
  },
  Sikh: {
    events: ["Engagement", "Mehendi", "Sangeet", "Anand Karaj", "Reception"],
    colors: ["#E65100", "#D4A853", "#FFF3E0"],
    theme: "traditional",
  },
  Christian: {
    events: ["Engagement", "Wedding Ceremony", "Reception"],
    colors: ["#1A237E", "#C9B037", "#FFFFF0"],
    theme: "traditional",
  },
  Interfaith: {
    events: ["Engagement", "Mehendi", "Wedding Ceremony", "Reception"],
    colors: ["#4A148C", "#D4A853", "#FFF5F5"],
    theme: "fusion",
  },
  Other: {
    events: ["Engagement", "Wedding Ceremony", "Reception"],
    colors: ["#37474F", "#D4A853", "#FAFAFA"],
    theme: "modern",
  },
};

const THEME_OPTIONS = [
  { value: "traditional", label: "Traditional", desc: "Classic elegance with cultural motifs" },
  { value: "modern", label: "Modern", desc: "Clean, minimal, contemporary design" },
  { value: "fusion", label: "Fusion", desc: "Blend of cultures, best of both worlds" },
  { value: "luxury", label: "Luxury", desc: "Opulent, grand, and lavish" },
  { value: "eco", label: "Eco-Friendly", desc: "Nature-inspired, earthy tones" },
  { value: "rustic", label: "Rustic", desc: "Warm, countryside, vintage charm" },
];

const COLOR_PALETTES = [
  { name: "Royal Maroon & Gold", colors: ["#6B1D2A", "#D4A853", "#FFF5E6"] },
  { name: "Emerald & Gold", colors: ["#1B5E20", "#D4A853", "#FFF8E1"] },
  { name: "Navy & Ivory", colors: ["#1A237E", "#C9B037", "#FFFFF0"] },
  { name: "Blush & Rose Gold", colors: ["#880E4F", "#E8B4B8", "#FFF5F5"] },
  { name: "Sage & Cream", colors: ["#4A6741", "#C5A880", "#F5F1EB"] },
  { name: "Purple & Lavender", colors: ["#4A148C", "#B39DDB", "#F3E5F5"] },
  { name: "Sunset Orange", colors: ["#E65100", "#FFB74D", "#FFF3E0"] },
  { name: "Slate & Silver", colors: ["#37474F", "#B0BEC5", "#FAFAFA"] },
];

export { CULTURAL_PRESETS, THEME_OPTIONS, COLOR_PALETTES };

export function useWeddingWizard() {
  const [step, setStep] = useState<WizardStep>(() => {
    const parsed = readDraft();
    return (parsed?.step as WizardStep) || "names";
  });
  const [wizardData, setWizardData] = useState<WeddingData>(() => {
    const safeDefaults: WeddingData = {
      partner1: "", partner2: "", culturalBackground: "Hindu", howWeMet: "",
      functions: [], eventDates: {}, theme: "traditional",
      suggestedColors: ["#6B1D2A", "#D4A853", "#FFF5E6"],
      displayFont: "Cormorant Garamond", bodyFont: "Inter", tagline: "",
    };
    const ensure = (d: Partial<WeddingData> | undefined | null): WeddingData => {
      const raw = d && typeof d === "object" && !Array.isArray(d) ? d : {};
      const merged = { ...safeDefaults, ...raw } as WeddingData;
      // Validate theme/palette fields with the shared schema so a malformed
      // draft (e.g. non-array colors, non-string fonts) can't crash the wizard.
      const style = parseThemeStyle(merged);
      merged.theme = style.theme;
      merged.suggestedColors = style.suggestedColors;
      merged.displayFont = style.displayFont;
      merged.bodyFont = style.bodyFont;
      // Every remaining field is rendered directly (mapped, keyed, trimmed),
      // so a draft saved by an older build — or hand-edited storage — must be
      // coerced back to its expected shape instead of crashing the wizard.
      const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
      merged.partner1 = str(merged.partner1);
      merged.partner2 = str(merged.partner2);
      merged.tagline = str(merged.tagline);
      merged.howWeMet = str(merged.howWeMet);
      merged.culturalBackground = str(merged.culturalBackground, "Hindu");
      merged.functions = Array.isArray(merged.functions)
        ? merged.functions.filter((f): f is string => typeof f === "string")
        : [];
      merged.eventDates =
        merged.eventDates && typeof merged.eventDates === "object" && !Array.isArray(merged.eventDates)
          ? Object.fromEntries(
              Object.entries(merged.eventDates).map(([k, v]) => [
                k,
                v && typeof v === "object" && !Array.isArray(v) ? v : {},
              ]),
            )
          : {};
      if (merged.travelInfo) {
        const t = merged.travelInfo as Partial<WeddingData["travelInfo"]> & Record<string, unknown>;
        merged.travelInfo =
          t && typeof t === "object" && !Array.isArray(t)
            ? {
                heading: str(t.heading, "Travel & Stay"),
                description: str(t.description),
                hotels: Array.isArray(t.hotels)
                  ? (t.hotels as unknown[]).filter(
                      (h): h is { name: string; description: string; distance: string } =>
                        !!h && typeof h === "object" && !Array.isArray(h),
                    )
                  : [],
                directions: str(t.directions),
              }
            : undefined;
      }
      if (merged.cardTemplate !== undefined && typeof merged.cardTemplate !== "string") {
        merged.cardTemplate = undefined;
      }
      return merged;
    };
    const parsed = readDraft();
    return ensure(parsed?.data ?? null);
  });
  const [isComplete, setIsComplete] = useState(false);
  // Cross-tab autosave conflict tracking. When another tab writes a newer draft
  // to localStorage under WIZARD_STORAGE_KEY, we surface a `conflict` object so
  // the UI can warn the user and let them keep the latest (remote) or theirs.
  const [conflict, setConflict] = useState<{
    remoteStep?: WizardStep;
    remoteData?: Partial<WeddingData>;
    savedAt?: number;
  } | null>(null);
  const [lastLocalSaveAt, setLastLocalSaveAt] = useState<number>(0);

  // Autosave to localStorage on every change so refresh/navigate-away preserves inputs.
  useEffect(() => {
    if (isComplete) return;
    const savedAt = Date.now();
    writeDraft({ step, data: wizardData, savedAt });
    setLastLocalSaveAt(savedAt);
  }, [step, wizardData, isComplete]);

  // Optional server-side sync. On mount we check for a newer draft stored on
  // the wizard_drafts table (signed-in users) and adopt it if it beats what we
  // hydrated from localStorage. Every subsequent local autosave is debounced
  // and mirrored to the server so a second device sees the same state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const remote = await fetchServerDraft();
      if (cancelled || !remote) return;
      const localSavedAt = (() => {
        try {
          const raw = localStorage.getItem(WIZARD_STORAGE_KEY);
          if (!raw) return 0;
          const parsed = JSON.parse(raw);
          return typeof parsed?.savedAt === "number" ? parsed.savedAt : 0;
        } catch { return 0; }
      })();
      if ((remote.savedAt ?? 0) > localSavedAt + 500) {
        if (remote.step) setStep(remote.step);
        if (remote.data) setWizardData((prev) => ({ ...prev, ...remote.data }));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced server mirror of the local draft.
  useEffect(() => {
    if (isComplete) return;
    const id = window.setTimeout(() => {
      upsertServerDraft({ step, data: wizardData, savedAt: Date.now() });
    }, 1200);
    return () => window.clearTimeout(id);
  }, [step, wizardData, isComplete]);

  // Watch for writes to the same key from other tabs. `storage` only fires in
  // tabs OTHER than the one that made the change, so any event we receive is a
  // remote edit by definition — flag it as a conflict when it's newer than our
  // last save.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== WIZARD_STORAGE_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if (!parsed || parsed.tabId === TAB_ID) return;
        const savedAt = typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now();
        if (savedAt <= lastLocalSaveAt) return;
        setConflict({ remoteStep: parsed.step, remoteData: parsed.data, savedAt });
      } catch { /* ignore malformed payloads */ }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [lastLocalSaveAt]);

  // Adopt the remote draft this tab was warned about.
  const acceptRemoteDraft = useCallback(() => {
    if (!conflict) return;
    if (conflict.remoteStep) setStep(conflict.remoteStep);
    if (conflict.remoteData) {
      setWizardData((prev) => ({ ...prev, ...conflict.remoteData }));
    }
    setLastLocalSaveAt(conflict.savedAt ?? Date.now());
    setConflict(null);
  }, [conflict]);

  // Keep this tab's version; the next autosave will overwrite the remote draft.
  const dismissConflict = useCallback(() => {
    setConflict(null);
    // Force an immediate write so other tabs see our version as the latest.
    const savedAt = Date.now();
    writeDraft({ step, data: wizardData, savedAt });
    setLastLocalSaveAt(savedAt);
  }, [step, wizardData]);

  const updateField = useCallback(<K extends keyof WeddingData>(key: K, value: WeddingData[K]) => {
    setWizardData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyCulturalPreset = useCallback((culture: string) => {
    const preset = CULTURAL_PRESETS[culture] || CULTURAL_PRESETS.Other;
    setWizardData((prev) => ({
      ...prev,
      culturalBackground: culture,
      functions: preset.events,
      suggestedColors: preset.colors,
      theme: preset.theme,
    }));
  }, []);

  const generateTagline = useCallback(() => {
    const { partner1, partner2 } = wizardData;
    const taglines = [
      `Two hearts, one beautiful journey`,
      `${partner1} & ${partner2} — forever begins here`,
      `Where love meets destiny`,
      `A celebration of love & togetherness`,
      `Two souls, one love story`,
    ];
    return taglines[Math.floor(Math.random() * taglines.length)];
  }, [wizardData]);

  const nextStep = useCallback(() => {
    const idx = WIZARD_STEPS.indexOf(step);
    if (idx < WIZARD_STEPS.length - 1) setStep(WIZARD_STEPS[idx + 1]);
  }, [step]);

  const prevStep = useCallback(() => {
    const idx = WIZARD_STEPS.indexOf(step);
    if (idx > 0) setStep(WIZARD_STEPS[idx - 1]);
  }, [step]);

  const completeWizard = useCallback(() => {
    const tagline = wizardData.tagline || generateTagline();
    setWizardData((prev) => ({
      ...prev,
      tagline,
      countdownLabel: "Days Until We Say 'I Do'",
      travelInfo: {
        heading: "Travel & Stay",
        description: "We've arranged some lovely options for your stay.",
        hotels: [
          { name: "Hotel Grand", description: "Luxury stay near the venue", distance: "2 km from venue" },
          { name: "Heritage Inn", description: "Comfortable and budget-friendly", distance: "5 km from venue" },
        ],
        directions: "Directions and travel tips — update this in the editor.",
      },
      welcomeMessage: `Welcome to ${prev.partner1} & ${prev.partner2}'s wedding celebration! We're so glad you're here.`,
    }));
    setIsComplete(true);
    clearDraft();
    // Clear the server-stored draft too — the wizard has been completed and
    // a permanent wedding_sites row now owns this state.
    deleteServerDraft();
  }, [wizardData, generateTagline]);

  return {
    step,
    setStep,
    wizardData,
    updateField,
    applyCulturalPreset,
    nextStep,
    prevStep,
    completeWizard,
    isComplete,
    generateTagline,
    resetDraft: () => { clearDraft(); deleteServerDraft(); },
    conflict,
    acceptRemoteDraft,
    dismissConflict,
  };
}
