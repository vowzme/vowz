import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export interface StorageQuota {
  used_bytes: number;
  base_quota_bytes: number;
  addon_bytes: number;
  total_quota_bytes: number;
  is_premium: boolean;
  file_count: number;
}

const ZERO: StorageQuota = {
  used_bytes: 0,
  base_quota_bytes: 104857600,
  addon_bytes: 0,
  total_quota_bytes: 104857600,
  is_premium: false,
  file_count: 0,
};

export function useStorageQuota() {
  const { user } = useAuth();
  const [quota, setQuota] = useState<StorageQuota>(ZERO);
  const [loading, setLoading] = useState(true);
  const prevPctRef = useRef<number | null>(null);
  const warnedRef = useRef<{ low: boolean; full: boolean }>({ low: false, full: false });

  const refresh = useCallback(async () => {
    if (!user) {
      setQuota(ZERO);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.rpc("get_user_storage_quota", { _user_id: user.id });
      if (error) throw error;
      const row: any = Array.isArray(data) ? data[0] : data;
      if (row) {
        setQuota({
          used_bytes: Number(row.used_bytes || 0),
          base_quota_bytes: Number(row.base_quota_bytes || 0),
          addon_bytes: Number(row.addon_bytes || 0),
          total_quota_bytes: Number(row.total_quota_bytes || 0),
          is_premium: !!row.is_premium,
          file_count: Number(row.file_count || 0),
        });
      }
    } catch (err) {
      console.error("useStorageQuota:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Real-time updates: refresh quota whenever this user's usage row changes.
  useEffect(() => {
    if (!user) return;
    const channelId = `r2-usage-${user.id}-${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "r2_storage_usage",
          filter: `user_id=eq.${user.id}`,
        },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "r2_files",
          filter: `user_id=eq.${user.id}`,
        },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  const usedPct = quota.total_quota_bytes
    ? Math.min(100, Math.round((quota.used_bytes / quota.total_quota_bytes) * 100))
    : 0;
  const isLow = usedPct >= 80 && usedPct < 100;
  const isFull = usedPct >= 100;

  // Toast when the user crosses 80% or 100% thresholds (upward crossings only).
  useEffect(() => {
    if (loading) return;
    const prev = prevPctRef.current;
    prevPctRef.current = usedPct;

    // Reset warnings if usage drops back below threshold (e.g. after deletion).
    if (usedPct < 80) warnedRef.current.low = false;
    if (usedPct < 100) warnedRef.current.full = false;

    if (prev === null) return; // skip initial mount

    if (usedPct >= 100 && prev < 100 && !warnedRef.current.full) {
      warnedRef.current.full = true;
      toast.error("Storage full", {
        description: "You've hit 100% of your storage. Delete files or add +2 GB to continue uploading.",
        duration: 8000,
      });
    } else if (usedPct >= 80 && prev < 80 && !warnedRef.current.low) {
      warnedRef.current.low = true;
      toast.warning("Storage almost full", {
        description: `You've used ${usedPct}% of your storage. Consider a +2 GB add-on.`,
        duration: 6000,
      });
    }
  }, [usedPct, loading]);

  return { quota, loading, refresh, usedPct, isLow, isFull };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}
