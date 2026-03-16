import { useState, useEffect } from "react";

// Hardcoded recent rates (USD base) - updated periodically
const RATES: Record<string, number> = {
  USD: 1,
  INR: 83.5,
  GBP: 0.79,
  EUR: 0.92,
  AED: 3.67,
  CAD: 1.36,
  AUD: 1.53,
  SGD: 1.34,
  MYR: 4.72,
  JPY: 149.5,
};

const SYMBOLS: Record<string, string> = {
  USD: "$", INR: "₹", GBP: "£", EUR: "€", AED: "AED ", CAD: "C$", AUD: "A$", SGD: "S$", MYR: "RM", JPY: "¥",
};

function detectCurrency(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.startsWith("Asia/Kolkata") || tz.startsWith("Asia/Calcutta")) return "INR";
    if (tz.startsWith("Europe/London")) return "GBP";
    if (tz.startsWith("Europe/")) return "EUR";
    if (tz.startsWith("Asia/Dubai")) return "AED";
    if (tz.includes("Toronto") || tz.includes("Vancouver")) return "CAD";
    if (tz.includes("Sydney") || tz.includes("Melbourne")) return "AUD";
    if (tz.includes("Singapore")) return "SGD";
    if (tz.includes("Tokyo")) return "JPY";
  } catch {}
  return "USD";
}

export function convertUSD(amountUSD: number, targetCurrency: string): string {
  const rate = RATES[targetCurrency] || 1;
  const symbol = SYMBOLS[targetCurrency] || targetCurrency + " ";
  const converted = Math.round(amountUSD * rate);
  return `${symbol}${converted.toLocaleString()}`;
}

export function CurrencyDisplay({ amountUSD }: { amountUSD: number }) {
  const [viewerCurrency] = useState(detectCurrency);

  if (!amountUSD || amountUSD <= 0) return null;

  const otherCurrencies = ["GBP", "EUR", "AED", "INR"].filter((c) => c !== viewerCurrency && c !== "USD");
  const mainConversion = viewerCurrency !== "USD" ? convertUSD(amountUSD, viewerCurrency) : null;

  return (
    <span className="text-xs text-muted-foreground font-body">
      ${amountUSD}
      {mainConversion && ` ≈ ${mainConversion}`}
      {otherCurrencies.slice(0, 2).map((c) => (
        <span key={c}> / {convertUSD(amountUSD, c)}</span>
      ))}
    </span>
  );
}

export default CurrencyDisplay;
