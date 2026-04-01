import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Cloud, HardDrive, Database, FileImage, Shield, Activity } from "lucide-react";

interface BucketStats {
  name: string;
  label: string;
  fileCount: number;
  icon: React.ReactNode;
}

interface TableStats {
  name: string;
  label: string;
  count: number;
}

const BUCKET_CONFIG = [
  { name: "wedding-photos", label: "Wedding Photos", icon: <FileImage className="h-4 w-4" /> },
  { name: "wedding-logos", label: "Logos", icon: <Shield className="h-4 w-4" /> },
  { name: "blessing-photos", label: "Blessings", icon: <FileImage className="h-4 w-4" /> },
  { name: "email-assets", label: "Email Assets", icon: <FileImage className="h-4 w-4" /> },
];

export function AdminCloudHealthWidget() {
  const [bucketStats, setBucketStats] = useState<BucketStats[]>([]);
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [driveLinked, setDriveLinked] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      // Fetch storage bucket file counts
      const bucketResults = await Promise.all(
        BUCKET_CONFIG.map(async (b) => {
          const { data } = await supabase.storage.from(b.name).list("", { limit: 1000 });
          const fileCount = data?.filter((f) => f.name && !f.name.endsWith("/")).length ?? 0;
          return { name: b.name, label: b.label, fileCount, icon: b.icon };
        })
      );

      // Fetch table record counts
      const tableDefs: { table: string; label: string }[] = [
        { table: "profiles", label: "Users" },
        { table: "wedding_sites", label: "Wedding Sites" },
        { table: "rsvps", label: "RSVPs" },
        { table: "guest_blessings", label: "Blessings" },
        { table: "guestbook", label: "Guestbook" },
        { table: "site_analytics", label: "Analytics Events" },
        { table: "user_subscriptions", label: "Subscriptions" },
        { table: "email_send_log", label: "Emails Sent" },
        { table: "ai_usage_log", label: "AI Calls" },
        { table: "blog_posts", label: "Blog Posts" },
      ];

      const tableResults = await Promise.all(
        tableDefs.map(async (t) => {
          const { count } = await supabase
            .from(t.table as any)
            .select("id", { count: "exact", head: true });
          return { name: t.table, label: t.label, count: count ?? 0 };
        })
      );

      // Drive links
      const { count: driveCount } = await supabase
        .from("user_google_drive")
        .select("id", { count: "exact", head: true })
        .eq("is_linked", true);

      setBucketStats(bucketResults);
      setTableStats(tableResults);
      setTotalFiles(bucketResults.reduce((s, b) => s + b.fileCount, 0));
      setTotalRecords(tableResults.reduce((s, t) => s + t.count, 0));
      setDriveLinked(driveCount ?? 0);
      setLoading(false);
    };

    fetchAll();
  }, []);

  const getHealthStatus = () => {
    if (totalRecords > 8000) return { label: "High Usage", color: "bg-amber-500", textColor: "text-amber-600" };
    if (totalRecords > 3000) return { label: "Moderate", color: "bg-emerald-500", textColor: "text-emerald-600" };
    return { label: "Healthy", color: "bg-emerald-500", textColor: "text-emerald-600" };
  };

  const health = getHealthStatus();

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-body text-muted-foreground flex items-center gap-2">
            <Cloud className="h-4 w-4" /> Cloud Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
        <Cloud className="h-5 w-5 text-sky-500" /> Cloud Health & Storage
      </h2>

      {/* Health status bar */}
      <Card className="border-border/50">
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-body text-muted-foreground">Overall Cloud Status</span>
            </div>
            <Badge className={`${health.color} text-white border-0 text-[11px]`}>{health.label}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-display text-xl font-bold text-foreground">{totalFiles}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Stored Files</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-foreground">{totalRecords.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">DB Records</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-foreground">{driveLinked}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Drive Links</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Storage Buckets */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground flex items-center gap-2">
              <HardDrive className="h-4 w-4" /> Storage Buckets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bucketStats.map((b) => (
              <div key={b.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  {b.icon}
                  <span className="font-body">{b.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-display font-bold text-foreground">{b.fileCount}</span>
                  <span className="text-[10px] text-muted-foreground">files</span>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-border/50 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-body">Total platform files</span>
              <span className="text-sm font-display font-bold text-foreground">{totalFiles}</span>
            </div>
          </CardContent>
        </Card>

        {/* Database Records */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground flex items-center gap-2">
              <Database className="h-4 w-4" /> Database Records
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tableStats.map((t) => {
              const maxCount = Math.max(...tableStats.map((x) => x.count), 1);
              const pct = Math.round((t.count / maxCount) * 100);
              return (
                <div key={t.name} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-body text-foreground">{t.label}</span>
                    <span className="text-xs font-display font-bold text-foreground">{t.count.toLocaleString()}</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        ☁️ <strong>Cloud Balance</strong> — Lovable Cloud usage (compute, bandwidth, storage) is managed at the workspace level.
        Check <strong>Settings → Cloud & AI balance</strong> in Lovable for real-time billing details.
      </p>
    </div>
  );
}
