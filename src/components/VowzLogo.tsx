import vowzLogoFull from "@/assets/vowz-logo-full.png";

interface VowzLogoProps {
  iconSize?: string;
  textSize?: string;
  className?: string;
  showIcon?: boolean;
  invertIcon?: boolean;
  light?: boolean;
  height?: string;
}

const VowzLogo = ({
  className = "",
  light = false,
  invertIcon = false,
  height = "h-8",
}: VowzLogoProps) => {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src={vowzLogoFull}
        alt="VowZ.me"
        className={`${height} object-contain ${light || invertIcon ? "brightness-0 invert" : ""}`}
      />
    </span>
  );
};

export default VowzLogo;
