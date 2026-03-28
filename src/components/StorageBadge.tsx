import { HardDrive, Cloud } from "lucide-react";
import { useMediaUpload } from "@/hooks/use-media-upload";

/**
 * Tiny badge showing whether uploads go to Google Drive or platform storage.
 */
export function StorageBadge() {
  const { isDriveLinked } = useMediaUpload();

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
        isDriveLinked
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      }`}
      title={isDriveLinked ? "Files saved to your Google Drive" : "Files saved to platform storage"}
    >
      {isDriveLinked ? (
        <>
          <HardDrive className="w-2.5 h-2.5" />
          Google Drive
        </>
      ) : (
        <>
          <Cloud className="w-2.5 h-2.5" />
          Platform Storage
        </>
      )}
    </span>
  );
}
