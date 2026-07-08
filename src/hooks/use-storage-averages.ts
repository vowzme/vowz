import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type FileCategory = "photos" | "videos" | "documents";

// Fallback averages when the user has no files of a given type yet.
// Chosen for typical compressed uploads on this app.
export const DEFAULT_AVG_BYTES: Record<FileCategory, number> = {
  photos: 2 * 1024 * 1024, // 2 MB
  videos: 20 * 1024 * 1024, // 20 MB
  documents: 500 * 1024, // 500 KB
};

export interface CategoryStat {
  bytes: number;
  count: number;
  avgBytes: number;
  usedDefault: boolean;
}

export type CategoryStats = Record<FileCategory, CategoryStat>;

const categorize = (ct: string | null): FileCategory | null => {
  const t = (ct || "").toLowerCase();
  if (t.startsWith("image/")) return "photos";
  if (t.startsWith("video/")) return "videos";
  if (
    t.startsWith("application/pdf") ||
    t.includes("msword") ||
    t.includes("officedocument") ||
    t.startsWith("text/")
  )
    return "documents";
  return null;
};

export function useStorageAverages() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CategoryStats>({
    photos: { bytes: 0, count: 0, avgBytes: DEFAULT_AVG_BYTES.photos, usedDefault: true },
    videos: { bytes: 0, count: 0, avgBytes: DEFAULT_AVG_BYTES.videos, usedDefault: true },
    documents: { bytes: 0, count: 0, avgBytes: DEFAULT_AVG_BYTES.documents, usedDefault: true },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const totals: Record<FileCategory, { bytes: number; count: number }> = {
        photos: { bytes: 0, count: 0 },
        videos: { bytes: 0, count: 0 },
        documents: { bytes: 0, count: 0 },
      };
      const pageSize = 1000;
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("r2_files")
          .select("size_bytes, content_type")
          .eq("user_id", user.id)
          .range(from, from + pageSize - 1);
        if (error || !data) break;
        for (const r of data) {
          const c = categorize(r.content_type);
          if (!c) continue;
          totals[c].bytes += Number(r.size_bytes || 0);
          totals[c].count += 1;
        }
        if (data.length < pageSize) break;
        from += pageSize;
      }
      if (!active) return;
      setStats({
        photos: buildStat("photos", totals.photos),
        videos: buildStat("videos", totals.videos),
        documents: buildStat("documents", totals.documents),
      });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  return { stats, loading };
}

function buildStat(cat: FileCategory, t: { bytes: number; count: number }): CategoryStat {
  if (t.count > 0 && t.bytes > 0) {
    return { bytes: t.bytes, count: t.count, avgBytes: t.bytes / t.count, usedDefault: false };
  }
  return { bytes: 0, count: 0, avgBytes: DEFAULT_AVG_BYTES[cat], usedDefault: true };
}