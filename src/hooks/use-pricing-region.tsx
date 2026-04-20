import React, { createContext, useContext, useEffect, useState } from "react";

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

const PricingRegionContext = createContext<PricingRegionContextType>({
  region: "INTL",
  setRegion: () => {},
  detecting: true,
  pricing: PRICING.INTL,
});

export const PricingRegionProvider = ({ children }: { children: React.ReactNode }) => {
  const [region, setRegionState] = useState<PricingRegion>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "IN" || saved === "INTL" ? saved : "INTL";
  });
  const [detecting, setDetecting] = useState(() => !localStorage.getItem(STORAGE_KEY));

  const setRegion = (r: PricingRegion) => {
    setRegionState(r);
    localStorage.setItem(STORAGE_KEY, r);
  };

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) {
      setDetecting(false);
      return;
    }
    // IP geolocation is the source of truth. Locale is unreliable
    // (e.g. an Indian abroad still has en-IN; a tourist in India has en-US).
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    fetch("https://ipapi.co/json/", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const country = String(data?.country_code || data?.country || "").toUpperCase();
        setRegion(country === "IN" ? "IN" : "INTL");
      })
      .catch(() => {
        // Fallback only if IP lookup fails: check for explicit -IN locale tag.
        const langs = [navigator.language, ...(navigator.languages || [])]
          .filter(Boolean)
          .map((l) => l.toLowerCase());
        const isIN = langs.some((l) => l === "en-in" || l.endsWith("-in") || l === "hi-in");
        setRegion(isIN ? "IN" : "INTL");
      })
      .finally(() => {
        clearTimeout(timeout);
        setDetecting(false);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return (
    <PricingRegionContext.Provider value={{ region, setRegion, detecting, pricing: PRICING[region] }}>
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
