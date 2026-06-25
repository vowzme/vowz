import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Eye, MousePointerClick, Sparkles, TrendingUp } from "lucide-react";
import { FALLBACK_TEMPLATES } from "@/lib/card-templates";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

interface Row {
  template_slug: string;
  event_type: "open" | "preview" | "use";
  created_at: string;
}

const NAME = (slug: string) =>
  FALLBACK_TEMPLATES.find((t) => t.slug === slug)?.name ?? slug;

export default function AdminCardAnalytics() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<7 | 30>(7);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = new Date(); since.setDate(since.getDate() - range);
      const { data } = await (supabase as any)
        .from("template_events")
        .select("template_slug,event_type,created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(5000);
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, [range]);

  const totals = useMemo(() => {
    const t = { opens: 0, previews: 0, uses: 0 };
    for (const r of rows) {
      if (r.event_type === "open") t.opens++;
      else if (r.event_type === "preview") t.previews++;
      else if (r.event_type === "use") t.uses++;
    }
    return t;
  }, [rows]);

  const ranked = useMemo(() => {
    const map = new Map<string, { opens: number; previews: number; uses: number; score: number }>();
    for (const r of rows) {
      const cur = map.get(r.template_slug) ?? { opens: 0, previews: 0, uses: 0, score: 0 };
      if (r.event_type === "open") { cur.opens++; cur.score += 1; }
      if (r.event_type === "preview") { cur.previews++; cur.score += 2; }
      if (r.event_type === "use") { cur.uses++; cur.score += 5; }
      map.set(r.template_slug, cur);
    }
    return Array.from(map.entries())
      .map(([slug, v]) => ({ slug, ...v }))
      .sort((a, b) => b.score - a.score);
  }, [rows]);

  const trend = useMemo(() => {
    const buckets: Record<string, { date: string; opens: number; previews: number; uses: number }> = {};
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { date: key.slice(5), opens: 0, previews: 0, uses: 0 };
    }
    for (const r of rows) {
      const key = r.created_at.slice(0, 10);
      const b = buckets[key];
      if (!b) continue;
      if (r.event_type === "open") b.opens++;
      else if (r.event_type === "preview") b.previews++;
      else if (r.event_type === "use") b.uses++;
    }
    return Object.values(buckets);
  }, [rows, range]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Card Template Analytics</h1>
          <p className="text-sm text-muted-foreground font-body">
            Opens, previews, and "Use this template" clicks across the public gallery.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          {([7, 30] as const).map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1.5 text-xs font-body rounded-md ${
                range === d ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Last {d} days
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Eye} label="Opens" value={totals.opens} hint="Detail view opened" />
        <StatCard icon={BarChart3} label="Previews" value={totals.previews} hint="Rendered in preview" />
        <StatCard icon={MousePointerClick} label="Uses" value={totals.uses} hint="'Use this template' clicked" />
        <StatCard icon={Sparkles} label="Templates tracked" value={ranked.length} hint="Distinct templates" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-gold" /> Daily activity
          </CardTitle>
        </CardHeader>
        <CardContent style={{ height: 280 }}>
          {loading ? (
            <div className="h-full grid place-items-center text-sm text-muted-foreground">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="opens" stroke="#94a3b8" dot={false} />
                <Line type="monotone" dataKey="previews" stroke="#3b82f6" dot={false} />
                <Line type="monotone" dataKey="uses" stroke="#D4AF37" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Most popular ranking</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2">#</th>
                  <th className="text-left px-4 py-2">Template</th>
                  <th className="text-right px-4 py-2">Opens</th>
                  <th className="text-right px-4 py-2">Previews</th>
                  <th className="text-right px-4 py-2">Uses</th>
                  <th className="text-right px-4 py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {ranked.slice(0, 30).map((r, i) => (
                  <tr key={r.slug} className="border-t border-border/60">
                    <td className="px-4 py-2 text-muted-foreground">
                      {i + 1}
                      {i < 3 && <Badge className="ml-2 bg-gold/15 text-gold border-gold/40 text-[10px]">Top {i + 1}</Badge>}
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium">{NAME(r.slug)}</div>
                      <div className="text-[11px] text-muted-foreground">{r.slug}</div>
                    </td>
                    <td className="px-4 py-2 text-right">{r.opens}</td>
                    <td className="px-4 py-2 text-right">{r.previews}</td>
                    <td className="px-4 py-2 text-right">{r.uses}</td>
                    <td className="px-4 py-2 text-right font-semibold">{r.score}</td>
                  </tr>
                ))}
                {!loading && ranked.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No template events yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }: {
  icon: any; label: string; value: number; hint: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-body uppercase tracking-wider">
          <Icon className="w-3.5 h-3.5" /> {label}
        </div>
        <div className="text-2xl font-display font-bold mt-1">{value.toLocaleString()}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>
      </CardContent>
    </Card>
  );
}