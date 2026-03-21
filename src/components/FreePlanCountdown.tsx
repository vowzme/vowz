import { useMemo } from "react";
import { Clock, Crown } from "lucide-react";
import { motion } from "framer-motion";
import PremiumUpgradeButton from "@/components/PremiumUpgradeButton";

interface FreePlanCountdownProps {
  siteCreatedAt: string;
  onUpgraded?: () => void;
}

const FreePlanCountdown = ({ siteCreatedAt, onUpgraded }: FreePlanCountdownProps) => {
  const { daysLeft, isExpiring } = useMemo(() => {
    const created = new Date(siteCreatedAt);
    const expiresAt = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    return { daysLeft: days, isExpiring: days <= 2 };
  }, [siteCreatedAt]);

  if (daysLeft > 7) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-4 rounded-xl border p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 ${
        isExpiring
          ? "bg-destructive/5 border-destructive/30"
          : "bg-accent/5 border-accent/30"
      }`}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className={`rounded-full p-1.5 shrink-0 ${isExpiring ? "bg-destructive/15" : "bg-accent/15"}`}>
          <Clock className={`w-4 h-4 ${isExpiring ? "text-destructive" : "text-accent"}`} />
        </div>
        <div className="min-w-0">
          <p className="font-body text-sm font-medium text-foreground">
            {daysLeft === 0
              ? "Free trial expired"
              : `${daysLeft} day${daysLeft > 1 ? "s" : ""} left on free plan`}
          </p>
          <p className="font-body text-xs text-muted-foreground">
            {daysLeft === 0
              ? "Upgrade to keep your site live and unlock all features."
              : "Upgrade to Premium for unlimited access and premium features."}
          </p>
        </div>
      </div>
      <PremiumUpgradeButton
        variant="gold"
        size="sm"
        className="shrink-0 w-full sm:w-auto"
        label="Upgrade Now"
        showIcon
        onUpgraded={onUpgraded}
      />
    </motion.div>
  );
};

export default FreePlanCountdown;
