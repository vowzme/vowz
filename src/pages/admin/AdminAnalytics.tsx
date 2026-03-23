import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, subDays, startOfDay } from "date-fns";
import { BarChart3, TrendingUp, Globe, Users, Crown, Eye, MessageSquare, Heart, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";

interface DailySignup {
  date: string;
  count: number;
}

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSites: 0,
    publishedSites: 0,
    premiumUsers: 0,
    totalRsvps: 0,
    totalBlessings: 0,
    totalPageViews: 0,
  });
  const [dailySignups, setDailySignups] = useState<DailySignup[]>([]);
  const [templateStats, setTemplateStats] = useState<{ name: string; count: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ type: string; count: number }[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [profilesRes, sitesRes, subsRes, rsvpsRes, blessingsRes, analyticsRes] = await Promise.all([
        supabase.from("profiles").select("id, created_at"),
        supabase.from("wedding_sites").select("id, is_published, theme, created_at"),
        supabase.from("user_subscriptions").select("id, status").eq("status", "active"),
        supabase.from("rsvps").select("id", { count: "exact", head: true }),
        supabase.from("guest_blessings").select("id", { count: "exact", head: true }),
        supabase.from("site_analytics").select("id, event_type", { count: "exact", head: true }),
      ]);

      const profiles = profilesRes.data || [];
      const sites = sitesRes.data || [];

      setStats({
        totalUsers: profiles.length,
        totalSites: sites.length,
        publishedSites: sites.filter((s: any) => s.is_published).length,
        premiumUsers: (subsRes.data || []).length,
        totalRsvps: rsvpsRes.count || 0,
        totalBlessings: blessingsRes.count || 0,
        totalPageViews: analyticsRes.count || 0,
      });

      // Daily signups (last 14 days)
      const days: DailySignup[] = [];
      for (let i = 13; i >= 0; i--) {
        const day = startOfDay(subDays(new Date(), i));
        const dayEnd = startOfDay(subDays(new Date(), i - 1));
        const count = profiles.filter((p: any) => {
          const d = new Date(p.created_at);
          return d >= day && d < dayEnd;
        }).length;
        days.push({ date: format(day, "MMM dd"), count });
      }
      setDailySignups(days);

      // Template usage
      const themeCounts: Record<string, number> = {};
      sites.forEach((s: any) => {
        const t = s.theme || "traditional";
        themeCounts[t] = (themeCounts[t] || 0) + 1;
      });
      setTemplateStats(
        Object.entries(themeCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)
      );

      // Activity breakdown
      setRecentActivity([
        { type: "Users", count: profiles.length },
        { type: "Sites", count: sites.length },
        { type: "Published", count: sites.filter((s: any) => s.is_published).length },
        { type: "RSVPs", count: rsvpsRes.count || 0 },
        { type: "Blessings", count: blessingsRes.count || 0 },
      ]);

      setLoading(false);
    };
    fetchAll();
  }, []);

  const COLORS = ["hsl(var(--gold))", "hsl(var(--navy))", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

  const exportCSV = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Users", stats.totalUsers],
      ["Total Sites", stats.totalSites],
      ["Published Sites", stats.publishedSites],
      ["Premium Users", stats.premiumUsers],
      ["Total RSVPs", stats.totalRsvps],
      ["Total Blessings", stats.totalBlessings],
      ["Page Views", stats.totalPageViews],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vowz-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const metricCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-[hsl(var(--navy))]" },
    { label: "Published Sites", value: stats.publishedSites, icon: Globe, color: "text-emerald-500" },
    { label: "Premium Users", value: stats.premiumUsers, icon: Crown, color: "text-[hsl(var(--gold))]" },
    { label: "Total RSVPs", value: stats.totalRsvps, icon: Heart, color: "text-rose-500" },
    { label: "Guest Blessings", value: stats.totalBlessings, icon: MessageSquare, color: "text-purple-500" },
    { label: "Page Views", value: stats.totalPageViews, icon: Eye, color: "text-sky-500" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
        <Button variant="outline" size="sm" onClick={exportCSV} className="font-body">
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {metricCards.map((c) => (
          <Card key={c.label} className="border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <c.icon className={`w-4 h-4 ${c.color}`} />
                <span className="font-body text-xs text-muted-foreground">{c.label}</span>
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{c.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Signups Chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-body text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[hsl(var(--gold))]" /> Daily Sign-ups (14 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailySignups}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--gold))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Template Usage Pie */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-body text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-500" /> Template Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={templateStats}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
                >
                  {templateStats.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Overview */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="font-body text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" /> Platform Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={recentActivity} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="type" type="category" tick={{ fontSize: 12, fontFamily: "var(--font-body)" }} width={80} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--navy))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
