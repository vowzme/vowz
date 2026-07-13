import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Row = {
  template_name: string;
  variant: "A" | "B";
  event_type: "sent" | "open" | "click";
  created_at: string;
};

type Agg = { sent: number; opens: number; clicks: number; uniqueOpens: Set<string>; uniqueClicks: Set<string> };

const RANGES = { "24h": 1, "7d": 7, "30d": 30, all: 0 } as const;
type RangeKey = keyof typeof RANGES;

function pct(num: number, den: number) {
  if (!den) return "—";
  return `${((num / den) * 100).toFixed(1)}%`;
}

export default function AdminEmailAbTests() {
  const [range, setRange] = useState<RangeKey>("7d");
  const [rows, setRows] = useState<Row[]>([]);
  const [uniqRows, setUniqRows] = useState<Array<Row & { message_id: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase
        .from("email_ab_events")
        .select("template_name, variant, event_type, created_at, message_id")
        .order("created_at", { ascending: false })
        .limit(20000);
      const days = RANGES[range];
      if (days > 0) {
        const since = new Date(Date.now() - days * 86400000).toISOString();
        q = q.gte("created_at", since);
      }
      const { data } = await q;
      setUniqRows((data as any) || []);
      setRows((data as any) || []);
      setLoading(false);
    })();
  }, [range]);

  const agg = useMemo(() => {
    const map = new Map<string, Record<"A" | "B", Agg>>();
    const empty = (): Agg => ({ sent: 0, opens: 0, clicks: 0, uniqueOpens: new Set(), uniqueClicks: new Set() });
    for (const r of uniqRows as any as Array<Row & { message_id: string }>) {
      const t = r.template_name;
      if (!map.has(t)) map.set(t, { A: empty(), B: empty() });
      const bucket = map.get(t)![r.variant];
      if (r.event_type === "sent") bucket.sent++;
      else if (r.event_type === "open") {
        bucket.opens++;
        bucket.uniqueOpens.add(r.message_id);
      } else if (r.event_type === "click") {
        bucket.clicks++;
        bucket.uniqueClicks.add(r.message_id);
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [uniqRows]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-navy">Email A/B Tests</h1>
          <p className="text-sm text-muted-foreground">Subject-line variants for reminder emails — open & click rates by variant.</p>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Variant performance</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Loading…</div>
          ) : agg.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">No A/B events yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Unique opens</TableHead>
                  <TableHead className="text-right">Open rate</TableHead>
                  <TableHead className="text-right">Unique clicks</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">CTOR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agg.flatMap(([template, byVariant]) =>
                  (["A", "B"] as const).map((v) => {
                    const a = byVariant[v];
                    const uo = a.uniqueOpens.size;
                    const uc = a.uniqueClicks.size;
                    return (
                      <TableRow key={`${template}-${v}`}>
                        <TableCell className="font-mono text-xs">{template}</TableCell>
                        <TableCell><Badge variant={v === "A" ? "secondary" : "default"}>{v}</Badge></TableCell>
                        <TableCell className="text-right">{a.sent}</TableCell>
                        <TableCell className="text-right">{uo}</TableCell>
                        <TableCell className="text-right font-semibold">{pct(uo, a.sent)}</TableCell>
                        <TableCell className="text-right">{uc}</TableCell>
                        <TableCell className="text-right font-semibold">{pct(uc, a.sent)}</TableCell>
                        <TableCell className="text-right">{pct(uc, uo)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            Open tracking uses a 1×1 pixel — some clients block images and will under-count opens. CTOR = clicks / opens.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}