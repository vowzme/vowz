import { useCallback, useEffect, useState } from "react";
import { csvCell, toCsv } from "@/lib/csv";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import ThemesFunnelCard from "@/components/admin/ThemesFunnelCard";
import {
  Users,
  Eye,
  UserPlus,
  Globe,
  Heart,
  CheckCircle2,
  RefreshCw,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

interface Funnel {
  visitors: number;
  pricing_viewers: number;
  auth_viewers: number;
  signups: number;
  sites_created: number;
  sites_published: number;
  rsvp_page_visitors: number;
  rsvp_form_views: number;
  rsvp_submissions: number;
}

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

export default function AdminVisitors() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [daily, setDaily] = useState<{ date: string; visitors: number; views: number }[]>([]);
  const [topPages, setTopPages] = useState<{ path: string; views: number }[]>([]);
  const [sources, setSources] = useState<{ source: string; visitors: number }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [funnelRes, eventsRes] = await Promise.all([
      (supabase as any).rpc("get_platform_funnel", { _days: days }),
      (supabase as any)
        .from("platform_events")
        .select("visitor_id, path, referrer, utm_source, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20000),
    ]);

    setFunnel((funnelRes.data?.[0] as Funnel) ?? null);

    const rows = (eventsRes.data ?? []) as any[];

    const byDay = new Map<string, { views: number; visitors: Set<string> }>();
    const byPath = new Map<string, number>();
    const bySource = new Map<string, Set<string>>();

    for (const r of rows) {
      const day = String(r.created_at).slice(0, 10);
      const d = byDay.get(day) ?? { views: 0, visitors: new Set<string>() };
      d.views += 1;
      d.visitors.add(r.visitor_id);
      byDay.set(day, d);

      const p = r.path || "/";
      byPath.set(p, (byPath.get(p) ?? 0) + 1);

      let src = r.utm_source as string | null;
      if (!src) {
        if (!r.referrer) src = "Direct";
        else {
          try {
            src = new URL(r.referrer).hostname.replace(/^www\./, "");
          } catch {
            src = "Other";
          }
        }
      }
      const set = bySource.get(src) ?? new Set<string>();
      set.add(r.visitor_id);
      bySource.set(src, set);
    }

    setDaily(
      [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({
          date: format(new Date(date), "MMM dd"),
          views: v.views,
          visitors: v.visitors.size,
        })),
    );
    setTopPages(
      [...byPath.entries()]
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10),
    );
    setSources(
      [...bySource.entries()]
        .map(([source, set]) => ({ source, visitors: set.size }))
        .sort((a, b) => b.visitors - a.visitors)
        .slice(0, 8),
    );
    setLoading(false);
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const steps = funnel
    ? [
        { label: "Visited the site", value: funnel.visitors, icon: Users },
        { label: "Looked at pricing", value: funnel.pricing_viewers, icon: Eye },
        { label: "Opened sign up", value: funnel.auth_viewers, icon: UserPlus },
        { label: "Created an account", value: funnel.signups, icon: CheckCircle2 },
        { label: "Started a wedding site", value: funnel.sites_created, icon: Globe },
        { label: "Published their site", value: funnel.sites_published, icon: Globe },
        { label: "Guests reached the RSVP form", value: funnel.rsvp_form_views, icon: Heart },
        { label: "Guests sent an RSVP", value: funnel.rsvp_submissions, icon: Heart },
      ]
    : [];
  const top = steps[0]?.value || 0;

  const exportCsv = () => {
    const lines = [
      "step,count,share_of_visitors",
      ...steps.map(
        (s) => `${csvCell(s.label)},${s.value},${top ? ((s.value / top) * 100).toFixed(1) + "%" : "-"}`,
      ),
      "",
      "date,visitors,page_views",
      ...daily.map((d) => `${d.date},${d.visitors},${d.views}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `visitor-funnel-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Visitors &amp; sign-up funnel</h1>
          <p className="text-sm text-muted-foreground">
            How many people reach the site, sign up, and finally reach the RSVP flow.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.days}
              size="sm"
              variant={days === r.days ? "default" : "outline"}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={!funnel}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {loading && !funnel ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.slice(0, 4).map((s) => (
              <Card key={s.label}>
                <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {s.label}
                  </CardTitle>
                  <s.icon className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{s.value.toLocaleString()}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <ThemesFunnelCard days={days} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sign-up funnel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {steps.map((s, i) => {
                const pct = top ? Math.round((s.value / top) * 100) : 0;
                const prev = i > 0 ? steps[i - 1].value : 0;
                const dropoff = i > 0 && prev > 0 ? Math.round((s.value / prev) * 100) : null;
                return (
                  <div key={s.label} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{s.label}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="font-medium">{s.value.toLocaleString()}</span>
                        {dropoff !== null && (
                          <Badge variant="secondary" className="text-[11px]">
                            {dropoff}% of previous
                          </Badge>
                        )}
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.max(pct, s.value > 0 ? 2 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground pt-1">
                The last two steps count wedding guests on published sites, so they can be larger
                than the number of couples who signed up.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Visitors per day</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {daily.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No visits recorded yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={daily}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" fontSize={11} />
                      <YAxis fontSize={11} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="visitors" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="views" stroke="hsl(var(--muted-foreground))" strokeWidth={1} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Where visitors come from</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {sources.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No visits recorded yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sources} layout="vertical" margin={{ left: 24 }}>
                      <XAxis type="number" fontSize={11} allowDecimals={false} />
                      <YAxis type="category" dataKey="source" width={110} fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="visitors" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Most visited pages</CardTitle>
            </CardHeader>
            <CardContent>
              {topPages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No visits recorded yet.</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {topPages.map((p) => (
                    <li key={p.path} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="truncate font-mono text-xs">{p.path}</span>
                      <span className="font-medium">{p.views.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
