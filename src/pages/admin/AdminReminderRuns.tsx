import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type LogRow = {
  message_id: string | null;
  template_name: string | null;
  recipient_email: string | null;
  status: string | null;
  created_at: string;
};

const RANGES = { "24h": 1, "7d": 7, "30d": 30, all: 0 } as const;
type RangeKey = keyof typeof RANGES;

const MILESTONE_LABEL: Record<string, string> = {
  d7: "7 days", d3: "3 days", d1: "1 day", overdue: "Overdue",
};

function milestoneOf(template: string | null): string | null {
  if (!template?.startsWith("checklist_reminder_")) return null;
  return template.replace("checklist_reminder_", "");
}

export default function AdminReminderRuns() {
  const [range, setRange] = useState<RangeKey>("7d");
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase
        .from("email_send_log")
        .select("message_id, template_name, recipient_email, status, created_at")
        .like("template_name", "checklist_reminder_%")
        .order("created_at", { ascending: false })
        .limit(10000);
      const days = RANGES[range];
      if (days > 0) q = q.gte("created_at", new Date(Date.now() - days * 86400000).toISOString());
      const { data } = await q;
      setRows((data as LogRow[]) || []);
      setLoading(false);
    })();
  }, [range]);

  // Deduplicate to latest status per message_id
  const latest = useMemo(() => {
    const map = new Map<string, LogRow>();
    for (const r of rows) {
      if (!r.message_id) continue;
      const prev = map.get(r.message_id);
      if (!prev || new Date(r.created_at) > new Date(prev.created_at)) map.set(r.message_id, r);
    }
    return Array.from(map.values());
  }, [rows]);

  const totals = useMemo(() => {
    let sent = 0, failed = 0, suppressed = 0, pending = 0;
    for (const r of latest) {
      if (r.status === "sent") sent++;
      else if (r.status === "dlq" || r.status === "failed" || r.status === "bounced") failed++;
      else if (r.status === "suppressed" || r.status === "complained") suppressed++;
      else pending++;
    }
    return { total: latest.length, sent, failed, suppressed, pending };
  }, [latest]);

  // Group by day (run) — the cron runs once daily
  const runs = useMemo(() => {
    const buckets = new Map<string, { day: string; sent: number; failed: number; total: number }>();
    for (const r of latest) {
      const day = r.created_at.slice(0, 10);
      const b = buckets.get(day) || { day, sent: 0, failed: 0, total: 0 };
      b.total++;
      if (r.status === "sent") b.sent++;
      else if (r.status === "dlq" || r.status === "failed" || r.status === "bounced") b.failed++;
      buckets.set(day, b);
    }
    return Array.from(buckets.values()).sort((a, b) => b.day.localeCompare(a.day));
  }, [latest]);

  // Group by recipient + milestone (proxy for "per site")
  const perRecipient = useMemo(() => {
    type Key = string;
    const map = new Map<Key, {
      email: string; milestone: string; sends: number; failed: number; lastAt: string;
      messages: Set<string>; resends: number;
    }>();
    for (const r of latest) {
      const m = milestoneOf(r.template_name);
      if (!m || !r.recipient_email || !r.message_id) continue;
      const key = `${r.recipient_email}::${m}`;
      const b = map.get(key) || {
        email: r.recipient_email, milestone: m, sends: 0, failed: 0, lastAt: r.created_at,
        messages: new Set<string>(), resends: 0,
      };
      b.messages.add(r.message_id);
      b.sends = b.messages.size;
      if (r.status === "dlq" || r.status === "failed" || r.status === "bounced") b.failed++;
      if (r.created_at > b.lastAt) b.lastAt = r.created_at;
      map.set(key, b);
    }
    return Array.from(map.values())
      .map((b) => ({ ...b, resends: Math.max(0, b.sends - 1) }))
      .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  }, [latest]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-navy">Checklist Reminder Runs</h1>
          <p className="text-sm text-muted-foreground">Daily reminder runs, delivery outcomes and resend counts per recipient.</p>
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

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total reminders" value={totals.total} />
        <StatCard label="Sent" value={totals.sent} tone="ok" />
        <StatCard label="Failed" value={totals.failed} tone="err" />
        <StatCard label="Suppressed" value={totals.suppressed} tone="warn" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Runs by day</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Loading /> : runs.length === 0 ? <Empty /> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead className="text-right">Success rate</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {runs.map((r) => (
                  <TableRow key={r.day}>
                    <TableCell className="font-mono text-xs">{r.day}</TableCell>
                    <TableCell className="text-right">{r.total}</TableCell>
                    <TableCell className="text-right text-emerald-700">{r.sent}</TableCell>
                    <TableCell className="text-right text-red-700">{r.failed}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {r.total ? `${((r.sent / r.total) * 100).toFixed(1)}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Per recipient · milestone</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Loading /> : perRecipient.length === 0 ? <Empty /> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Milestone</TableHead>
                <TableHead className="text-right">Sends</TableHead>
                <TableHead className="text-right">Resends</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead>Last sent</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {perRecipient.slice(0, 200).map((r) => (
                  <TableRow key={`${r.email}-${r.milestone}`}>
                    <TableCell className="font-mono text-xs">{r.email}</TableCell>
                    <TableCell><Badge variant="secondary">{MILESTONE_LABEL[r.milestone] || r.milestone}</Badge></TableCell>
                    <TableCell className="text-right">{r.sends}</TableCell>
                    <TableCell className="text-right">{r.resends}</TableCell>
                    <TableCell className="text-right text-red-700">{r.failed}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(r.lastAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            One row per recipient + milestone bucket. Resends = extra sends beyond the first for the same milestone.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "ok" | "err" | "warn" }) {
  const color = tone === "ok" ? "text-emerald-700" : tone === "err" ? "text-red-700" : tone === "warn" ? "text-amber-700" : "text-navy";
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`text-3xl font-semibold mt-1 ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

const Loading = () => <div className="text-sm text-muted-foreground py-6 text-center">Loading…</div>;
const Empty = () => <div className="text-sm text-muted-foreground py-6 text-center">No reminder activity in this range.</div>;