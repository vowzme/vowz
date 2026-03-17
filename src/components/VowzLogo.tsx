import vowzLogoFull from "@/assets/vowz-logo-full.png";

interface VowzLogoProps {
  /** @deprecated use height instead */
  iconSize?: string;
  /** @deprecated no longer needed */
  textSize?: string;
  className?: string;
  /** @deprecated no longer needed */
  showIcon?: boolean;
  invertIcon?: boolean;
  light?: boolean;
  height?: string;
}

const VowzLogo = ({
  className = "",
  light = false,
  invertIcon = false,
  height,
  iconSize,
}: VowzLogoProps) => {
  // Support legacy iconSize prop as fallback for height
  const h = height || iconSize || "h-8";
  return (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src={vowzLogoFull}
        alt="VowZ.me"
        className={`${h} object-contain ${light || invertIcon ? "brightness-0 invert" : ""}`}
      />
    </span>
  );
};

export default VowzLogo;
