import { HardDrive, AlertTriangle, Image as ImageIcon, Film, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useStorageQuota, formatBytes } from "@/hooks/use-storage-quota";
import { useStorageAverages } from "@/hooks/use-storage-averages";
import BuyStorageAddonButton from "@/components/BuyStorageAddonButton";
import { Card } from "@/components/ui/card";

interface Props {
  compact?: boolean;
}

const StorageUsageCard = ({ compact = false }: Props) => {
  const { quota, loading, usedPct, isLow, isFull, refresh } = useStorageQuota();
  const { stats } = useStorageAverages();

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

  // Estimate remaining uploads per file type. Uses the user's own average per
  // category when they have data of that type; otherwise falls back to
  // sensible defaults (2 MB photo, 20 MB video, 500 KB doc).
  const remainingBytes = Math.max(0, quota.total_quota_bytes - quota.used_bytes);
  const remainingBy = {
    photos: Math.floor(remainingBytes / stats.photos.avgBytes),
    videos: Math.floor(remainingBytes / stats.videos.avgBytes),
    documents: Math.floor(remainingBytes / stats.documents.avgBytes),
  };

  const rows: Array<{
    key: keyof typeof remainingBy;
    label: string;
    Icon: typeof ImageIcon;
    color: string;
  }> = [
    { key: "photos", label: "photos", Icon: ImageIcon, color: "text-primary/70" },
    { key: "videos", label: "videos", Icon: Film, color: "text-gold" },
    { key: "documents", label: "documents", Icon: FileText, color: "text-emerald-600" },
  ];

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
        <div className="mt-2 space-y-1">
          <div className="text-[11px] uppercase tracking-wider font-body text-muted-foreground/80">
            Estimated remaining
          </div>
          <div className="grid grid-cols-3 gap-2">
            {rows.map(({ key, label, Icon, color }) => {
              const s = stats[key];
              return (
                <div
                  key={key}
                  className="flex items-center gap-1.5 text-xs font-body text-muted-foreground rounded-md bg-muted/40 px-2 py-1.5"
                  title={`Avg ${formatBytes(s.avgBytes)}/file${s.usedDefault ? " (default)" : " (your average)"}`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                  <span className="truncate">
                    <span className="font-semibold text-foreground">~{remainingBy[key]}</span>{" "}
                    <span className="opacity-80">{label}</span>
                  </span>
                </div>
              );
            })}
          </div>
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
