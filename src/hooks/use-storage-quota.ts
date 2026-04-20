import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

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

  const usedPct = quota.total_quota_bytes
    ? Math.min(100, Math.round((quota.used_bytes / quota.total_quota_bytes) * 100))
    : 0;
  const isLow = usedPct >= 80 && usedPct < 100;
  const isFull = usedPct >= 100;

  return { quota, loading, refresh, usedPct, isLow, isFull };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}
