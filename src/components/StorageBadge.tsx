import { Cloud } from "lucide-react";

/**
 * Tiny badge showing the active storage backend (Cloudflare R2).
 */
export function StorageBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary"
      title="Files saved to secure cloud storage"
    >
      <Cloud className="w-2.5 h-2.5" />
      Cloud Storage
    </span>
  );
}
