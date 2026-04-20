import { usePricingRegion, type PricingRegion } from "@/hooks/use-pricing-region";

const options: { value: PricingRegion; label: string; flag: string }[] = [
  { value: "IN", label: "India", flag: "🇮🇳" },
  { value: "INTL", label: "International", flag: "🌍" },
];

interface RegionSelectorProps {
  className?: string;
  showNote?: boolean;
}

const RegionSelector = ({ className = "", showNote = false }: RegionSelectorProps) => {
  const { region, setRegion, detectedRegion, isManualOverride, detecting } = usePricingRegion();

  const detectedLabel =
    detectedRegion === "IN" ? "🇮🇳 India" : detectedRegion === "INTL" ? "🌍 International" : null;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="inline-flex rounded-full border border-border/60 bg-card p-0.5 shadow-sm">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRegion(opt.value)}
            className={`px-3 py-1.5 text-xs font-body font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
              region === opt.value
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-sm">{opt.flag}</span>
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        ))}
      </div>

      {detectedLabel && !detecting && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border/40 text-[10px] font-body text-muted-foreground">
          <span>Detected: {detectedLabel}</span>
          {isManualOverride && (
            <button
              onClick={() => detectedRegion && setRegion(detectedRegion)}
              className="text-primary hover:underline font-medium"
              title="Use detected region"
            >
              Use this
            </button>
          )}
        </div>
      )}

      {showNote && (
        <p className="text-[10px] text-muted-foreground/60 font-body">
          Price shown based on your location. Change above if needed.
        </p>
      )}
    </div>
  );
};

export default RegionSelector;
