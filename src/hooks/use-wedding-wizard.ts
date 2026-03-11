import { useState, useCallback } from "react";

export interface WeddingData {
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
}

export type WizardStep = "names" | "story" | "theme" | "events" | "preview";

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
  const [step, setStep] = useState<WizardStep>("names");
  const [wizardData, setWizardData] = useState<WeddingData>({
    partner1: "",
    partner2: "",
    culturalBackground: "Hindu",
    howWeMet: "",
    functions: [],
    theme: "traditional",
    suggestedColors: ["#6B1D2A", "#D4A853", "#FFF5E6"],
    tagline: "",
  });
  const [isComplete, setIsComplete] = useState(false);

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
    const steps: WizardStep[] = ["names", "story", "theme", "events", "preview"];
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  }, [step]);

  const prevStep = useCallback(() => {
    const steps: WizardStep[] = ["names", "story", "theme", "events", "preview"];
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
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
  };
}
