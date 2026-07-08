import { AlertTriangle, HardDrive, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useStorageQuota, formatBytes } from "@/hooks/use-storage-quota";
import PremiumUpgradeButton from "@/components/PremiumUpgradeButton";
import BuyStorageAddonButton from "@/components/BuyStorageAddonButton";

// Prominent in-dashboard banner shown when the user is close to or over their
// storage quota. Complements the toast in useStorageQuota (transient) with a
// persistent, dismissible callout that surfaces upgrade paths.
const DISMISS_KEY = "vowz.storageBannerDismissed";

const StorageQuotaBanner = () => {
  const { quota, loading, usedPct, isLow, isFull, refresh } = useStorageQuota();
  const [dismissedAt, setDismissedAt] = useState<number>(0);

  useEffect(() => {
    const raw = localStorage.getItem(DISMISS_KEY);
    setDismissedAt(raw ? Number(raw) || 0 : 0);
  }, []);

  if (loading || (!isLow && !isFull)) return null;

  // Dismissal auto-expires after 24h, and re-fires immediately once the user
  // crosses into "full" territory even if they dismissed the 80% warning.
  const staleAfterMs = 24 * 60 * 60 * 1000;
  const dismissed = dismissedAt > 0 && Date.now() - dismissedAt < staleAfterMs;
  if (dismissed && !isFull) return null;

  const dismiss = () => {
    const now = Date.now();
    localStorage.setItem(DISMISS_KEY, String(now));
    setDismissedAt(now);
  };

  const remaining = Math.max(0, quota.total_quota_bytes - quota.used_bytes);

  return (
    <div
      role="alert"
      className={`mb-4 rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
        isFull
          ? "border-destructive/40 bg-destructive/5"
          : "border-amber-400/40 bg-amber-50/60 dark:bg-amber-950/20"
      }`}
    >
      <div className="flex items-start gap-3 flex-1">
        {isFull ? (
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        ) : (
          <HardDrive className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        )}
        <div className="min-w-0">
          <p
            className={`font-display text-sm font-semibold ${
              isFull ? "text-destructive" : "text-amber-800 dark:text-amber-300"
            }`}
          >
            {isFull ? "Storage full" : `Storage ${usedPct}% used`}
          </p>
          <p className="text-xs font-body text-muted-foreground mt-0.5">
            {isFull
              ? "New uploads will fail. Free up space or add more storage to keep uploading."
              : `You have ${formatBytes(remaining)} left of ${formatBytes(
                  quota.total_quota_bytes,
                )}. Upgrade now to avoid interruptions.`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <BuyStorageAddonButton onPurchased={refresh} />
        {!quota.is_premium && (
          <PremiumUpgradeButton
            variant="gold"
            size="sm"
            label="Upgrade to Premium"
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={dismiss}
          aria-label="Dismiss warning"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default StorageQuotaBanner;