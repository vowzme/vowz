import React, { createContext, useContext, useEffect, useState } from "react";

export type PricingRegion = "IN" | "INTL";

interface PricingConfig {
  symbol: string;
  premiumPrice: number;
  premiumOriginal: number;
  freePrice: string;
  label: string;
}

interface PricingRegionContextType {
  region: PricingRegion;
  setRegion: (r: PricingRegion) => void;
  detecting: boolean;
  pricing: PricingConfig;
}

const PRICING: Record<PricingRegion, PricingConfig> = {
  IN: { symbol: "₹", premiumPrice: 599, premiumOriginal: 999, freePrice: "₹0", label: "India 🇮🇳" },
  INTL: { symbol: "$", premiumPrice: 15, premiumOriginal: 25, freePrice: "$0", label: "International 🌍" },
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

    // Try navigator language first
    const lang = navigator.language || "";
    if (lang.toLowerCase().includes("in") || lang.toLowerCase() === "hi") {
      setRegion("IN");
      setDetecting(false);
      return;
    }

    // Try IP-based geolocation
    const controller = new AbortController();
    fetch("https://ipapi.co/json/", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data?.country_code === "IN") {
          setRegion("IN");
        } else {
          setRegion("INTL");
        }
      })
      .catch(() => {
        setRegion("INTL");
      })
      .finally(() => setDetecting(false));

    return () => controller.abort();
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
