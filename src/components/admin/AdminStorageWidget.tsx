import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive, Users, IndianRupee, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TopUser {
  user_id: string;
  email: string | null;
  used_bytes: number;
  file_count: number;
}

interface StorageStats {
  totalBytes: number;
  totalFiles: number;
  totalUsers: number;
  topUsers: TopUser[];
  addonRevenueINR: number;
  addonRevenueUSD: number;
  addonsActive: number;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
};

export function AdminStorageWidget() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: usage } = await supabase
          .from("r2_storage_usage")
          .select("user_id, used_bytes, file_count")
          .order("used_bytes", { ascending: false });

        const userIds = (usage || []).slice(0, 20).map((u) => u.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", userIds);

        const emailMap = new Map((profiles || []).map((p) => [p.id, p.email]));

        const topUsers: TopUser[] = (usage || []).slice(0, 20).map((u) => ({
          user_id: u.user_id,
          email: emailMap.get(u.user_id) || null,
          used_bytes: Number(u.used_bytes),
          file_count: u.file_count,
        }));

        const totalBytes = (usage || []).reduce((s, u) => s + Number(u.used_bytes), 0);
        const totalFiles = (usage || []).reduce((s, u) => s + u.file_count, 0);

        const { data: addons } = await supabase
          .from("user_storage_addons")
          .select("amount_paid, currency, status, expires_at");

        const activeAddons = (addons || []).filter(
          (a) => a.status === "active" && new Date(a.expires_at) > new Date()
        );
        const addonRevenueINR = (addons || [])
          .filter((a) => a.currency === "INR")
          .reduce((s, a) => s + Number(a.amount_paid), 0);
        const addonRevenueUSD = (addons || [])
          .filter((a) => a.currency === "USD")
          .reduce((s, a) => s + Number(a.amount_paid), 0);

        setStats({
          totalBytes,
          totalFiles,
          totalUsers: usage?.length ?? 0,
          topUsers,
          addonRevenueINR,
          addonRevenueUSD,
          addonsActive: activeAddons.length,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card className="border-border/50 mb-6">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-[hsl(var(--gold))]" /> R2 Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const exportCSV = () => {
    if (!stats) return;
    const rows = [
      ["Email", "User ID", "Used Bytes", "Used (MB)", "File Count"],
      ...stats.topUsers.map((u) => [
        u.email || "—",
        u.user_id,
        String(u.used_bytes),
        (u.used_bytes / 1048576).toFixed(2),
        String(u.file_count),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `r2-storage-top-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-border/50 mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-[hsl(var(--gold))]" /> R2 Storage Usage
        </CardTitle>
        <button
          onClick={exportCSV}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Export CSV
        </button>
      </CardHeader>
      <CardContent>
        {/* Summary stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="rounded-lg border border-border/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <HardDrive className="h-3.5 w-3.5" /> Total Used
            </div>
            <div className="font-display text-xl font-bold">{formatBytes(stats!.totalBytes)}</div>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="h-3.5 w-3.5" /> Active Users
            </div>
            <div className="font-display text-xl font-bold">{stats!.totalUsers}</div>
            <div className="text-xs text-muted-foreground">{stats!.totalFiles} files</div>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <IndianRupee className="h-3.5 w-3.5" /> Add-on Revenue
            </div>
            <div className="font-display text-xl font-bold">
              ₹{stats!.addonRevenueINR.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-muted-foreground">
              + ${stats!.addonRevenueUSD.toLocaleString("en-US")}
            </div>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5" /> Active Add-ons
            </div>
            <div className="font-display text-xl font-bold">{stats!.addonsActive}</div>
            <div className="text-xs text-muted-foreground">+2 GB packs</div>
          </div>
        </div>

        {/* Top users table */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            Top 20 Users by Storage
          </h3>
          {stats!.topUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No storage data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4">#</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4 text-right">Used</th>
                    <th className="py-2 pr-4 text-right">Files</th>
                  </tr>
                </thead>
                <tbody>
                  {stats!.topUsers.map((u, i) => (
                    <tr key={u.user_id} className="border-b border-border/30">
                      <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 pr-4 font-mono text-xs">
                        {u.email || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2 pr-4 text-right font-medium">
                        {formatBytes(u.used_bytes)}
                      </td>
                      <td className="py-2 pr-4 text-right text-muted-foreground">
                        {u.file_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
