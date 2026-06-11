import { useState, useMemo } from "react";
import { Trash2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import StorageUsageCard from "@/components/StorageUsageCard";
import { useStorageQuota, formatBytes } from "@/hooks/use-storage-quota";
import type { WeddingSection } from "@/pages/Editor";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r2-upload`;

function collectUrls(value: unknown, out: Set<string>) {
  if (!value) return;
  if (typeof value === "string") {
    if (/^https?:\/\//.test(value)) out.add(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => collectUrls(v, out));
    return;
  }
  if (typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((v) => collectUrls(v, out));
  }
}

interface Props {
  sections: WeddingSection[];
  siteData: Record<string, unknown>;
}

const MediaManagerPanel = ({ sections, siteData }: Props) => {
  const { session } = useAuth();
  const { refresh } = useStorageQuota();
  const [cleaning, setCleaning] = useState(false);

  const referencedUrls = useMemo(() => {
    const set = new Set<string>();
    collectUrls(sections, set);
    collectUrls(siteData, set);
    return Array.from(set);
  }, [sections, siteData]);

  const handleCleanup = async () => {
    if (!session?.access_token) return;
    if (!confirm("Delete media files that are no longer used in your site? This cannot be undone.")) return;
    setCleaning(true);
    try {
      const res = await fetch(`${FUNCTION_URL}?action=cleanup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ referenced_urls: referencedUrls }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Cleanup failed");
      if (data.deleted > 0) {
        toast({
          title: `Freed ${formatBytes(data.freed_bytes)} 🧹`,
          description: `Removed ${data.deleted} unused file${data.deleted === 1 ? "" : "s"}.`,
        });
      } else {
        toast({ title: "Already clean ✨", description: "No unused files found." });
      }
      refresh();
    } catch (err: any) {
      toast({ title: "Cleanup failed", description: err.message, variant: "destructive" });
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-4">
      <StorageUsageCard />

      <Card className="p-4 border-border/50">
        <div className="flex items-start gap-3 mb-3">
          <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground">Smart savings</h4>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              Re-uploading the same photo is automatic — we detect duplicates and don't charge your quota twice.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-border/50">
        <h4 className="font-display text-sm font-semibold text-foreground mb-1">Clean unused media</h4>
        <p className="text-xs text-muted-foreground font-body mb-3">
          Permanently delete photos & videos that aren't used in any section of your site. Frees storage instantly.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCleanup}
          disabled={cleaning}
          className="w-full"
        >
          {cleaning ? (
            <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Scanning…</>
          ) : (
            <><Trash2 className="w-3.5 h-3.5 mr-2" /> Remove unused files</>
          )}
        </Button>
      </Card>

      <p className="text-[11px] text-muted-foreground text-center font-body px-2">
        All media is stored on Cloudflare R2 with end-to-end encryption. Photos are auto-compressed and stripped of GPS metadata for privacy.
      </p>
    </div>
  );
};

export default MediaManagerPanel;