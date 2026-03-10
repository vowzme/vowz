import vowzIcon from "@/assets/vowz-icon.png";

interface VowzLogoProps {
  iconSize?: string;
  textSize?: string;
  className?: string;
  showIcon?: boolean;
  invertIcon?: boolean;
  light?: boolean;
}

const VowzLogo = ({
  iconSize = "h-7",
  textSize = "text-xl",
  className = "",
  showIcon = true,
  invertIcon = false,
  light = false,
}: VowzLogoProps) => {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {showIcon && (
        <img
          src={vowzIcon}
          alt=""
          className={`${iconSize} object-contain ${invertIcon ? "brightness-0 invert opacity-90" : ""}`}
        />
      )}
      <span className={`font-display font-bold tracking-tight ${textSize}`}>
        <span className={light ? "text-primary-foreground" : "text-[hsl(var(--navy))]"}>V</span>
        <span className={`${light ? "text-primary-foreground" : "text-[hsl(var(--navy))]"} lowercase`}>ow</span>
        <span className={light ? "text-[hsl(var(--gold))]" : "text-[hsl(var(--gold))]"}>Z</span>
      </span>
    </span>
  );
};

export default VowzLogo;
