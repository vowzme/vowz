import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, Database, Zap, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface UsageStats {
  totalCalls: number;
  todayCalls: number;
  last7DaysCalls: number;
  byFunction: { name: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
}

const FUNCTION_COLORS: Record<string, string> = {
  "wedding-wizard": "hsl(var(--gold))",
  "editor-ai": "hsl(var(--navy))",
  "wedding-content-gen": "#10b981",
  "translate-site": "#8b5cf6",
};

const FUNCTION_LABELS: Record<string, string> = {
  "wedding-wizard": "AI Wizard",
  "editor-ai": "Editor AI",
  "wedding-content-gen": "Content Gen",
  "translate-site": "Translation",
};

export function AdminUsageWidget() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState({ sites: 0, photos: 0, rsvps: 0 });

  useEffect(() => {
    const fetchUsage = async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

      const [allRes, todayRes, weekRes, sitesRes, rsvpsRes] = await Promise.all([
        supabase.from("ai_usage_log" as any).select("function_name, created_at"),
        supabase.from("ai_usage_log" as any).select("id", { count: "exact", head: true }).gte("created_at", todayStart),
        supabase.from("ai_usage_log" as any).select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("wedding_sites").select("id", { count: "exact", head: true }),
        supabase.from("rsvps").select("id", { count: "exact", head: true }),
      ]);

      const rows = (allRes.data || []) as any[];

      // Count by function
      const fnCounts: Record<string, number> = {};
      const dailyCounts: Record<string, number> = {};

      rows.forEach((r: any) => {
        fnCounts[r.function_name] = (fnCounts[r.function_name] || 0) + 1;
        const day = r.created_at?.slice(0, 10);
        if (day) dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      });

      const byFunction = Object.entries(fnCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // Last 7 days trend
      const dailyTrend: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        dailyTrend.push({ date: key.slice(5), count: dailyCounts[key] || 0 });
      }

      setStats({
        totalCalls: rows.length,
        todayCalls: (todayRes as any).count ?? 0,
        last7DaysCalls: (weekRes as any).count ?? 0,
        byFunction,
        dailyTrend,
      });

      setDbStats({
        sites: sitesRes.count ?? 0,
        photos: 0,
        rsvps: rsvpsRes.count ?? 0,
      });

      setLoading(false);
    };

    fetchUsage();
  }, []);

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-body text-muted-foreground flex items-center gap-2">
            <Zap className="h-4 w-4" /> Usage & Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
        <Zap className="h-5 w-5 text-amber-500" /> Usage & Credits Monitor
      </h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground font-body uppercase tracking-wide">AI Calls Today</p>
                <p className="font-display text-2xl font-bold text-foreground">{stats?.todayCalls ?? 0}</p>
              </div>
              <Cpu className="h-8 w-8 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground font-body uppercase tracking-wide">Last 7 Days</p>
                <p className="font-display text-2xl font-bold text-foreground">{stats?.last7DaysCalls ?? 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground font-body uppercase tracking-wide">Total AI Calls</p>
                <p className="font-display text-2xl font-bold text-foreground">{stats?.totalCalls ?? 0}</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground font-body uppercase tracking-wide">DB Records</p>
                <p className="font-display text-2xl font-bold text-foreground">{dbStats.sites + dbStats.rsvps}</p>
              </div>
              <Database className="h-8 w-8 text-sky-500/30" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{dbStats.sites} sites · {dbStats.rsvps} RSVPs</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily trend */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground">AI Calls — Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats?.dailyTrend || []}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={30} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="hsl(var(--gold))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By function breakdown */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground">AI Calls by Function</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.byFunction.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No AI calls recorded yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={stats?.byFunction.map(f => ({ ...f, label: FUNCTION_LABELS[f.name] || f.name })) || []} layout="vertical">
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={90} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {stats?.byFunction.map((entry, idx) => (
                      <Cell key={idx} fill={FUNCTION_COLORS[entry.name] || "#94a3b8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info note */}
      <p className="text-xs text-muted-foreground">
        💡 <strong>AI Credits</strong> are consumed by AI Wizard, Editor AI, Content Generation & Translations.{" "}
        <strong>Cloud Credits</strong> are consumed by database operations, file storage & edge function compute.
      </p>
    </div>
  );
}
