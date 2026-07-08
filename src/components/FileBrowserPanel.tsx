import { useEffect, useState, useCallback } from "react";
import { Trash2, Loader2, Image as ImageIcon, Film, FileText, File as FileIcon, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useStorageQuota, formatBytes } from "@/hooks/use-storage-quota";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r2-upload`;

interface Row {
  key: string;
  url: string;
  size_bytes: number;
  content_type: string | null;
  created_at: string;
}

const iconFor = (ct: string | null) => {
  const t = (ct || "").toLowerCase();
  if (t.startsWith("image/")) return ImageIcon;
  if (t.startsWith("video/")) return Film;
  if (t.startsWith("application/pdf") || t.includes("officedocument") || t.startsWith("text/")) return FileText;
  return FileIcon;
};

const shortName = (key: string) => key.split("/").pop() || key;

const FileBrowserPanel = () => {
  const { session, user } = useAuth();
  const { refresh } = useStorageQuota();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null); // key being deleted, or "__bulk__"

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("r2_files")
      .select("key, url, size_bytes, content_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error && data) setRows(data as Row[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (key: string) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const toggleAll = () =>
    setSelected((s) => (s.size === rows.length ? new Set() : new Set(rows.map((r) => r.key))));

  const deleteOne = async (key: string): Promise<boolean> => {
    if (!session?.access_token) return false;
    const res = await fetch(`${FUNCTION_URL}?action=delete`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key }),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok && data.success;
  };

  const handleDeleteOne = async (row: Row) => {
    if (!confirm(`Delete "${shortName(row.key)}"? This cannot be undone.`)) return;
    setBusy(row.key);
    const ok = await deleteOne(row.key);
    setBusy(null);
    if (ok) {
      setRows((r) => r.filter((f) => f.key !== row.key));
      setSelected((s) => {
        const n = new Set(s);
        n.delete(row.key);
        return n;
      });
      toast({ title: `Deleted · freed ${formatBytes(row.size_bytes)}` });
      refresh();
    } else {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} file${selected.size === 1 ? "" : "s"}? This cannot be undone.`)) return;
    setBusy("__bulk__");
    const keys = Array.from(selected);
    let ok = 0;
    let freed = 0;
    for (const key of keys) {
      const row = rows.find((r) => r.key === key);
      if (await deleteOne(key)) {
        ok++;
        freed += Number(row?.size_bytes || 0);
      }
    }
    setBusy(null);
    setRows((r) => r.filter((f) => !selected.has(f.key) || !keys.includes(f.key)));
    setSelected(new Set());
    toast({
      title: `Deleted ${ok}/${keys.length} · freed ${formatBytes(freed)}`,
      variant: ok === keys.length ? "default" : "destructive",
    });
    refresh();
    load();
  };

  const totalBytes = rows.reduce((s, r) => s + Number(r.size_bytes || 0), 0);

  return (
    <Card className="p-4 border-border/50">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h4 className="font-display text-sm font-semibold text-foreground">Your files</h4>
          <p className="text-xs font-body text-muted-foreground">
            {rows.length} file{rows.length === 1 ? "" : "s"} · {formatBytes(totalBytes)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {rows.length > 0 && (
            <Button variant="ghost" size="sm" onClick={toggleAll} className="h-8 px-2 text-xs">
              {selected.size === rows.length ? (
                <><CheckSquare className="w-3.5 h-3.5 mr-1" /> Unselect all</>
              ) : (
                <><Square className="w-3.5 h-3.5 mr-1" /> Select all</>
              )}
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            disabled={selected.size === 0 || busy === "__bulk__"}
            onClick={handleBulkDelete}
            className="h-8"
          >
            {busy === "__bulk__" ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5 mr-1" />
            )}
            Delete {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading files…
        </div>
      ) : rows.length === 0 ? (
        <p className="text-xs font-body text-muted-foreground py-4 text-center">
          No files yet. Uploads from your site will appear here.
        </p>
      ) : (
        <div className="max-h-96 overflow-y-auto divide-y divide-border/40 -mx-1">
          {rows.map((r) => {
            const Icon = iconFor(r.content_type);
            const isSel = selected.has(r.key);
            const isBusy = busy === r.key;
            return (
              <div
                key={r.key}
                className={`flex items-center gap-2 px-1 py-2 text-xs ${isSel ? "bg-primary/5" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => toggle(r.key)}
                  className="shrink-0 p-1"
                  aria-label={isSel ? "Unselect" : "Select"}
                >
                  {isSel ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {r.content_type?.startsWith("image/") ? (
                  <img
                    src={r.url}
                    alt=""
                    loading="lazy"
                    className="w-8 h-8 rounded object-cover shrink-0 bg-muted"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-body text-foreground" title={shortName(r.key)}>
                    {shortName(r.key)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatBytes(Number(r.size_bytes || 0))}
                    {r.content_type ? ` · ${r.content_type}` : ""}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleDeleteOne(r)}
                  disabled={isBusy || busy === "__bulk__"}
                  aria-label="Delete file"
                >
                  {isBusy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default FileBrowserPanel;