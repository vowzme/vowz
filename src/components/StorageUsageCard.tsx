import { HardDrive, AlertTriangle, ImageIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useStorageQuota, formatBytes } from "@/hooks/use-storage-quota";
import BuyStorageAddonButton from "@/components/BuyStorageAddonButton";
import { Card } from "@/components/ui/card";

interface Props {
  compact?: boolean;
}

const StorageUsageCard = ({ compact = false }: Props) => {
  const { quota, loading, usedPct, isLow, isFull, refresh } = useStorageQuota();

  if (loading) {
    return (
      <Card className="p-4 border-border/50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HardDrive className="w-4 h-4" /> Loading storage…
        </div>
      </Card>
    );
  }

  const barColor = isFull ? "bg-destructive" : isLow ? "bg-amber-500" : "bg-primary";

  // Estimate remaining uploads: use user's actual average when we have data,
  // otherwise assume ~2 MB per photo (typical compressed WebP/JPEG).
  const DEFAULT_AVG_BYTES = 2 * 1024 * 1024;
  const avgBytes =
    quota.file_count > 0 && quota.used_bytes > 0
      ? quota.used_bytes / quota.file_count
      : DEFAULT_AVG_BYTES;
  const remainingBytes = Math.max(0, quota.total_quota_bytes - quota.used_bytes);
  const remainingUploads = Math.floor(remainingBytes / avgBytes);
  const avgLabel = formatBytes(avgBytes);

  return (
    <Card className={`p-4 border-border/50 ${isFull ? "border-destructive/40 bg-destructive/5" : isLow ? "border-amber-400/40 bg-amber-50/40 dark:bg-amber-950/10" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <HardDrive className={`w-4 h-4 ${isFull ? "text-destructive" : isLow ? "text-amber-600" : "text-primary"}`} />
          <span className="font-display text-sm font-semibold text-foreground">
            Cloud Storage
          </span>
          {quota.is_premium && (
            <span className="text-[10px] uppercase font-bold tracking-wider bg-gold/20 text-gold-foreground px-1.5 py-0.5 rounded">
              Premium
            </span>
          )}
        </div>
        <span className="font-body text-xs text-muted-foreground">
          {formatBytes(quota.used_bytes)} / {formatBytes(quota.total_quota_bytes)}
        </span>
      </div>

      <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
        <div
          className={`absolute inset-y-0 left-0 ${barColor} transition-all`}
          style={{ width: `${usedPct}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-body text-muted-foreground">
          {quota.file_count} file{quota.file_count === 1 ? "" : "s"} ·{" "}
          {quota.addon_bytes > 0 && (
            <span className="text-emerald-600 font-medium">+{formatBytes(quota.addon_bytes)} add-on</span>
          )}
          {quota.addon_bytes === 0 && <span>{usedPct}% used</span>}
        </div>
        {!compact && <BuyStorageAddonButton onPurchased={refresh} />}
      </div>

      {!isFull && (
        <div className="mt-2 flex items-center gap-1.5 text-xs font-body text-muted-foreground">
          <ImageIcon className="w-3.5 h-3.5 text-primary/70" />
          <span>
            ~<span className="font-semibold text-foreground">{remainingUploads}</span> more upload{remainingUploads === 1 ? "" : "s"}
            <span className="opacity-70"> (avg {avgLabel}/file)</span>
          </span>
        </div>
      )}

      {(isLow || isFull) && (
        <div className={`mt-3 flex items-start gap-2 p-2 rounded text-xs ${isFull ? "bg-destructive/10 text-destructive" : "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"}`}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="font-body">
            {isFull
              ? "You've reached your storage limit. Buy a +2 GB add-on to continue uploading."
              : `You've used ${usedPct}% of your storage. Consider buying a +2 GB add-on.`}
          </span>
        </div>
      )}
    </Card>
  );
};

export default StorageUsageCard;
