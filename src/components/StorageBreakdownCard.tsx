import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatBytes } from "@/hooks/use-storage-quota";
import { Image as ImageIcon, Film, FileText, Files, Loader2 } from "lucide-react";

type Category = "images" | "videos" | "documents" | "other";

const categorize = (ct: string | null): Category => {
  const t = (ct || "").toLowerCase();
  if (t.startsWith("image/")) return "images";
  if (t.startsWith("video/")) return "videos";
  if (
    t.startsWith("application/pdf") ||
    t.includes("msword") ||
    t.includes("officedocument") ||
    t.startsWith("text/")
  )
    return "documents";
  return "other";
};

const CONFIG: Record<
  Category,
  { label: string; icon: typeof ImageIcon; color: string; bar: string }
> = {
  images: { label: "Images", icon: ImageIcon, color: "text-primary", bar: "bg-primary" },
  videos: { label: "Videos", icon: Film, color: "text-gold", bar: "bg-gold" },
  documents: { label: "Documents", icon: FileText, color: "text-emerald-600", bar: "bg-emerald-500" },
  other: { label: "Other", icon: Files, color: "text-muted-foreground", bar: "bg-muted-foreground/60" },
};

const StorageBreakdownCard = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<{ bytes: number; count: number; cat: Category }[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;

      const totals: Record<Category, { bytes: number; count: number }> = {
        images: { bytes: 0, count: 0 },
        videos: { bytes: 0, count: 0 },
        documents: { bytes: 0, count: 0 },
        other: { bytes: 0, count: 0 },
      };

      const pageSize = 1000;
      let from = 0;
      // Paginate to avoid the 1000-row cap on very large libraries.
      while (true) {
        const { data, error } = await supabase
          .from("r2_files")
          .select("size_bytes, content_type")
          .eq("user_id", uid)
          .range(from, from + pageSize - 1);
        if (error || !data) break;
        for (const r of data) {
          const c = categorize(r.content_type);
          totals[c].bytes += Number(r.size_bytes || 0);
          totals[c].count += 1;
        }
        if (data.length < pageSize) break;
        from += pageSize;
      }

      if (!active) return;
      setRows(
        (Object.keys(totals) as Category[]).map((cat) => ({
          cat,
          ...totals[cat],
        })),
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const totalBytes = rows.reduce((s, r) => s + r.bytes, 0);
  const totalCount = rows.reduce((s, r) => s + r.count, 0);

  return (
    <Card className="p-4 border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Files className="w-4 h-4 text-primary" />
          <span className="font-display text-sm font-semibold text-foreground">
            Storage Breakdown
          </span>
        </div>
        <span className="font-body text-xs text-muted-foreground">
          {totalCount} file{totalCount === 1 ? "" : "s"} · {formatBytes(totalBytes)}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading breakdown…
        </div>
      ) : totalCount === 0 ? (
        <p className="text-xs font-body text-muted-foreground py-1">
          No files uploaded yet.
        </p>
      ) : (
        <div className="space-y-2.5">
          {rows
            .filter((r) => r.count > 0)
            .sort((a, b) => b.bytes - a.bytes)
            .map(({ cat, bytes, count }) => {
              const cfg = CONFIG[cat];
              const Icon = cfg.icon;
              const pct = totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-xs font-body mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      <span className="text-foreground font-medium">{cfg.label}</span>
                      <span className="text-muted-foreground">
                        · {count} file{count === 1 ? "" : "s"}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {formatBytes(bytes)} <span className="opacity-60">({pct}%)</span>
                    </span>
                  </div>
                  <div className="relative w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 ${cfg.bar} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </Card>
  );
};

export default StorageBreakdownCard;