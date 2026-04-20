import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PricingRegion = "IN" | "INTL";

interface PricingConfig {
  symbol: string;
  premiumPrice: number;
  premiumOriginal: number;
  freePrice: string;
  label: string;
  storageAddonPrice: number;
  storageAddonLabel: string;
}

interface PricingRegionContextType {
  region: PricingRegion;
  setRegion: (r: PricingRegion) => void;
  detecting: boolean;
  pricing: PricingConfig;
  detectedRegion: PricingRegion | null;
  isManualOverride: boolean;
}

const PRICING: Record<PricingRegion, PricingConfig> = {
  IN: {
    symbol: "₹",
    premiumPrice: 999,
    premiumOriginal: 1499,
    freePrice: "₹0",
    label: "India 🇮🇳",
    storageAddonPrice: 499,
    storageAddonLabel: "₹499",
  },
  INTL: {
    symbol: "$",
    premiumPrice: 20,
    premiumOriginal: 25,
    freePrice: "$0",
    label: "International 🌍",
    storageAddonPrice: 5,
    storageAddonLabel: "$5",
  },
};

const STORAGE_KEY = "vowz_pricing_region";
const DETECTED_KEY = "vowz_pricing_region_detected";

const PricingRegionContext = createContext<PricingRegionContextType>({
  region: "INTL",
  setRegion: () => {},
  detecting: true,
  pricing: PRICING.INTL,
  detectedRegion: null,
  isManualOverride: false,
});

export const PricingRegionProvider = ({ children }: { children: React.ReactNode }) => {
  const [region, setRegionState] = useState<PricingRegion>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "IN" || saved === "INTL" ? saved : "INTL";
  });
  const [detecting, setDetecting] = useState(() => !localStorage.getItem(DETECTED_KEY));
  const [detectedRegion, setDetectedRegion] = useState<PricingRegion | null>(() => {
    const d = localStorage.getItem(DETECTED_KEY);
    return d === "IN" || d === "INTL" ? d : null;
  });

  const setRegion = (r: PricingRegion) => {
    setRegionState(r);
    localStorage.setItem(STORAGE_KEY, r);
  };

  const recordDetected = (r: PricingRegion) => {
    setDetectedRegion(r);
    localStorage.setItem(DETECTED_KEY, r);
    if (!localStorage.getItem(STORAGE_KEY)) setRegion(r);
  };

  useEffect(() => {
    if (localStorage.getItem(DETECTED_KEY)) {
      setDetecting(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const detectFromLocale = (): PricingRegion => {
      const langs = [navigator.language, ...(navigator.languages || [])]
        .filter(Boolean)
        .map((l) => l.toLowerCase());
      const isIN = langs.some((l) => l === "en-in" || l.endsWith("-in") || l === "hi-in");
      return isIN ? "IN" : "INTL";
    };

    const run = async () => {
      // 1) Server-side header-based detection (Cloudflare / Supabase edge geo headers)
      try {
        const { data, error } = await supabase.functions.invoke("detect-region");
        if (!error && data?.region === "IN") {
          recordDetected("IN");
          return;
        }
        if (!error && data?.region === "INTL") {
          recordDetected("INTL");
          return;
        }
        // data.region === null => no header available, fall through
      } catch {
        // ignore — try next
      }

      // 2) Public IP geolocation
      try {
        const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
        const data = await res.json();
        const country = String(data?.country_code || data?.country || "").toUpperCase();
        recordDetected(country === "IN" ? "IN" : "INTL");
        return;
      } catch {
        // ignore — try next
      }

      // 3) Locale fallback
      recordDetected(detectFromLocale());
    };

    run().finally(() => {
      clearTimeout(timeout);
      setDetecting(false);
    });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const isManualOverride = detectedRegion !== null && detectedRegion !== region;

  return (
    <PricingRegionContext.Provider
      value={{ region, setRegion, detecting, pricing: PRICING[region], detectedRegion, isManualOverride }}
    >
      {children}
    </PricingRegionContext.Provider>
  );
};

export const usePricingRegion = () => useContext(PricingRegionContext);

export const formatPrice = (pricing: PricingConfig, type: "premium" | "original" | "free") => {
  if (type === "free") return pricing.freePrice;
  if (type === "original") return `${pricing.symbol}${pricing.premiumOriginal}`;
  return `${pricing.symbol}${pricing.premiumPrice}`;
};
