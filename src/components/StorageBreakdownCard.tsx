import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatBytes, useStorageQuota } from "@/hooks/use-storage-quota";
import {
  Image as ImageIcon,
  Film,
  FileText,
  Files,
  Loader2,
  Download,
  ChevronDown,
  ChevronRight,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r2-upload`;

interface FileRow {
  key: string;
  url: string;
  size_bytes: number;
  content_type: string | null;
  created_at: string;
}

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
  const [rows, setRows] = useState<
    { bytes: number; count: number; cat: Category; files: FileRow[] }[]
  >([]);
  const [expanded, setExpanded] = useState<Set<Category>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const { session } = useAuth();
  const { refresh: refreshQuota } = useStorageQuota();

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
      const filesByCat: Record<Category, FileRow[]> = {
        images: [],
        videos: [],
        documents: [],
        other: [],
      };

      const pageSize = 1000;
      let from = 0;
      // Paginate to avoid the 1000-row cap on very large libraries.
      while (true) {
        const { data, error } = await supabase
          .from("r2_files")
          .select("key, url, size_bytes, content_type, created_at")
          .eq("user_id", uid)
          .range(from, from + pageSize - 1);
        if (error || !data) break;
        for (const r of data) {
          const c = categorize(r.content_type);
          totals[c].bytes += Number(r.size_bytes || 0);
          totals[c].count += 1;
          filesByCat[c].push(r as FileRow);
        }
        if (data.length < pageSize) break;
        from += pageSize;
      }

      if (!active) return;
      setRows(
        (Object.keys(totals) as Category[]).map((cat) => ({
          cat,
          ...totals[cat],
          files: filesByCat[cat].sort(
            (a, b) => Number(b.size_bytes || 0) - Number(a.size_bytes || 0),
          ),
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

  const toggle = (cat: Category) =>
    setExpanded((s) => {
      const next = new Set(s);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });

  const handleDelete = async (file: FileRow) => {
    if (!session?.access_token) return;
    if (!confirm(`Delete "${file.key.split("/").pop()}"? This cannot be undone.`)) return;
    setDeleting(file.key);
    try {
      const res = await fetch(`${FUNCTION_URL}?action=delete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: file.key }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error("Delete failed");
      setRows((prev) =>
        prev.map((r) =>
          r.files.some((f) => f.key === file.key)
            ? {
                ...r,
                files: r.files.filter((f) => f.key !== file.key),
                count: r.count - 1,
                bytes: r.bytes - Number(file.size_bytes || 0),
              }
            : r,
        ),
      );
      toast({ title: `Deleted · freed ${formatBytes(Number(file.size_bytes || 0))}` });
      refreshQuota();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const handleExportCSV = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const header = ["Category", "File Count", "Total Bytes", "Total MB", "% of Storage"];
    const body = rows
      .slice()
      .sort((a, b) => b.bytes - a.bytes)
      .map((r) => [
        CONFIG[r.cat].label,
        r.count,
        r.bytes,
        (r.bytes / 1048576).toFixed(2),
        totalBytes > 0 ? ((r.bytes / totalBytes) * 100).toFixed(1) + "%" : "0%",
      ]);
    body.push([
      "Total",
      totalCount,
      totalBytes,
      (totalBytes / 1048576).toFixed(2),
      "100%",
    ]);
    const csv =
      [header, ...body].map((r) => r.map(esc).join(",")).join("\n") +
      `\n\n"Generated","${new Date().toISOString()}"\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vowz-storage-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: "Storage report downloaded" });
  };

  return (
    <Card className="p-4 border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Files className="w-4 h-4 text-primary" />
          <span className="font-display text-sm font-semibold text-foreground">
            Storage Breakdown
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-body text-xs text-muted-foreground">
            {totalCount} file{totalCount === 1 ? "" : "s"} · {formatBytes(totalBytes)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleExportCSV}
            disabled={loading || totalCount === 0}
            aria-label="Download storage report as CSV"
          >
            <Download className="w-3.5 h-3.5 mr-1" /> CSV
          </Button>
        </div>
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
              const isOpen = expanded.has(cat);
              const files = rows.find((r) => r.cat === cat)?.files ?? [];
              return (
                <div key={cat}>
                  <button
                    type="button"
                    onClick={() => toggle(cat)}
                    className="w-full flex items-center justify-between text-xs font-body mb-1 hover:opacity-80 transition-opacity"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-1.5">
                      {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      <span className="text-foreground font-medium">{cfg.label}</span>
                      <span className="text-muted-foreground">
                        · {count} file{count === 1 ? "" : "s"}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {formatBytes(bytes)} <span className="opacity-60">({pct}%)</span>
                    </span>
                  </button>
                  <div className="relative w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 ${cfg.bar} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {isOpen && files.length > 0 && (
                    <div className="mt-2 ml-5 max-h-64 overflow-y-auto divide-y divide-border/40 rounded-md border border-border/40 bg-muted/20">
                      {files.map((f) => {
                        const name = f.key.split("/").pop() || f.key;
                        const isImg = (f.content_type || "").startsWith("image/");
                        const isBusy = deleting === f.key;
                        return (
                          <div key={f.key} className="flex items-center gap-2 px-2 py-1.5 text-xs">
                            {isImg ? (
                              <img
                                src={f.url}
                                alt=""
                                loading="lazy"
                                className="w-7 h-7 rounded object-cover shrink-0 bg-muted"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0">
                                <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-body text-foreground" title={name}>
                                {name}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {formatBytes(Number(f.size_bytes || 0))}
                                {" · "}
                                {new Date(f.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-muted-foreground hover:text-primary p-1"
                              aria-label="Open file"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDelete(f)}
                              disabled={isBusy}
                              className="text-muted-foreground hover:text-destructive p-1 disabled:opacity-50"
                              aria-label="Delete file"
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </Card>
  );
};

export default StorageBreakdownCard;