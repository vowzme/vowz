import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type EventRow = {
  id: string;
  action: string;
  guest_email: string | null;
  message_id: string | null;
  created_at: string;
};

type LogRow = {
  message_id: string | null;
  status: string | null;
  created_at: string;
};

type TrackRow = {
  message_id: string;
  event_type: string;
};

const RANGES = { "24h": 1, "7d": 7, "30d": 30, all: 0 } as const;
type RangeKey = keyof typeof RANGES;

const ACTIONS = ["approved", "hidden", "deleted"] as const;

function StatCard({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`text-2xl font-display font-semibold ${tone || ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function statusBadge(status: string | null) {
  const s = status || "unknown";
  const cls =
    s === "sent" ? "bg-green-100 text-green-800" :
    s === "failed" || s === "dlq" || s === "bounced" ? "bg-red-100 text-red-800" :
    s === "suppressed" ? "bg-yellow-100 text-yellow-800" :
    s === "pending" ? "bg-blue-100 text-blue-800" :
    "bg-muted text-muted-foreground";
  return <Badge className={cls}>{s}</Badge>;
}

export default function AdminGuestModeration() {
  const [range, setRange] = useState<RangeKey>("7d");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const days = RANGES[range];
      const since = days > 0 ? new Date(Date.now() - days * 86400000).toISOString() : null;

      let evQ = supabase
        .from("guest_moderation_events")
        .select("id, action, guest_email, message_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (since) evQ = evQ.gte("created_at", since);
      const { data: evData } = await evQ;
      const ev = (evData as EventRow[]) || [];
      setEvents(ev);

      const ids = Array.from(new Set(ev.map((e) => e.message_id).filter(Boolean))) as string[];

      if (ids.length) {
        const [{ data: logData }, { data: trackData }] = await Promise.all([
          supabase
            .from("email_send_log")
            .select("message_id, status, created_at")
            .in("message_id", ids),
          supabase
            .from("email_ab_events")
            .select("message_id, event_type")
            .in("message_id", ids),
        ]);
        setLogs((logData as LogRow[]) || []);
        setTracks((trackData as TrackRow[]) || []);
      } else {
        setLogs([]);
        setTracks([]);
      }
      setLoading(false);
    })();
  }, [range]);

  // Latest status per message_id
  const statusByMsg = useMemo(() => {
    const m = new Map<string, LogRow>();
    for (const r of logs) {
      if (!r.message_id) continue;
      const prev = m.get(r.message_id);
      if (!prev || new Date(r.created_at) > new Date(prev.created_at)) m.set(r.message_id, r);
    }
    return m;
  }, [logs]);

  // Open/click sets (unique per message_id)
  const openMsgs = useMemo(() => {
    const s = new Set<string>();
    for (const t of tracks) if (t.event_type === "open") s.add(t.message_id);
    return s;
  }, [tracks]);
  const clickMsgs = useMemo(() => {
    const s = new Set<string>();
    for (const t of tracks) if (t.event_type === "click") s.add(t.message_id);
    return s;
  }, [tracks]);

  // Per-action stats
  const perAction = useMemo(() => {
    const rows = ACTIONS.map((action) => {
      const evs = events.filter((e) => e.action === action);
      const withMsg = evs.filter((e) => e.message_id);
      let sent = 0, failed = 0, suppressed = 0, pending = 0, opens = 0, clicks = 0;
      for (const e of withMsg) {
        const st = statusByMsg.get(e.message_id!)?.status || "";
        if (st === "sent") sent++;
        else if (st === "failed" || st === "dlq" || st === "bounced") failed++;
        else if (st === "suppressed") suppressed++;
        else pending++;
        if (openMsgs.has(e.message_id!)) opens++;
        if (clickMsgs.has(e.message_id!)) clicks++;
      }
      const openRate = sent > 0 ? (opens / sent) * 100 : 0;
      const clickRate = sent > 0 ? (clicks / sent) * 100 : 0;
      return {
        action,
        total: evs.length,
        emailed: withMsg.length,
        sent, failed, suppressed, pending,
        opens, clicks, openRate, clickRate,
      };
    });
    return rows;
  }, [events, statusByMsg, openMsgs, clickMsgs]);

  const totals = useMemo(() => {
    return perAction.reduce(
      (acc, r) => ({
        total: acc.total + r.total,
        sent: acc.sent + r.sent,
        failed: acc.failed + r.failed,
        opens: acc.opens + r.opens,
        clicks: acc.clicks + r.clicks,
      }),
      { total: 0, sent: 0, failed: 0, opens: 0, clicks: 0 },
    );
  }, [perAction]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold">Guest Moderation Notifications</h1>
          <p className="text-sm text-muted-foreground">Per-action delivery and engagement for guest photo moderation emails.</p>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Events" value={totals.total} />
        <StatCard label="Sent" value={totals.sent} tone="text-green-700" />
        <StatCard label="Failed" value={totals.failed} tone="text-red-700" />
        <StatCard label="Open rate" value={totals.sent ? `${((totals.opens / totals.sent) * 100).toFixed(1)}%` : "—"} />
        <StatCard label="Click rate" value={totals.sent ? `${((totals.clicks / totals.sent) * 100).toFixed(1)}%` : "—"} />
      </div>

      <Card>
        <CardHeader><CardTitle>Per action</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead className="text-right">Events</TableHead>
                <TableHead className="text-right">Emailed</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead className="text-right">Suppressed</TableHead>
                <TableHead className="text-right">Opens</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Open rate</TableHead>
                <TableHead className="text-right">Click rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perAction.map((r) => (
                <TableRow key={r.action}>
                  <TableCell className="capitalize font-medium">{r.action}</TableCell>
                  <TableCell className="text-right">{r.total}</TableCell>
                  <TableCell className="text-right">{r.emailed}</TableCell>
                  <TableCell className="text-right text-green-700">{r.sent}</TableCell>
                  <TableCell className="text-right text-red-700">{r.failed}</TableCell>
                  <TableCell className="text-right">{r.suppressed}</TableCell>
                  <TableCell className="text-right">{r.opens}</TableCell>
                  <TableCell className="text-right">{r.clicks}</TableCell>
                  <TableCell className="text-right">{r.sent ? `${r.openRate.toFixed(1)}%` : "—"}</TableCell>
                  <TableCell className="text-right">{r.sent ? `${r.clickRate.toFixed(1)}%` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent events</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No moderation events in this range.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Clicked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.slice(0, 200).map((e) => {
                  const st = e.message_id ? statusByMsg.get(e.message_id)?.status || "pending" : null;
                  const opened = e.message_id ? openMsgs.has(e.message_id) : false;
                  const clicked = e.message_id ? clickMsgs.has(e.message_id) : false;
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{e.action}</TableCell>
                      <TableCell className="text-xs">{e.guest_email || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>{e.message_id ? statusBadge(st) : <span className="text-xs text-muted-foreground">no email</span>}</TableCell>
                      <TableCell>{opened ? "✓" : "—"}</TableCell>
                      <TableCell>{clicked ? "✓" : "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}