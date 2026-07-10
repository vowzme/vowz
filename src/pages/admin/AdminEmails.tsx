import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, RefreshCw } from "lucide-react";
import { AlertTriangle, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type LogRow = {
  id: string;
  message_id: string | null;
  template_name: string | null;
  recipient_email: string | null;
  status: string | null;
  error_message: string | null;
  created_at: string;
};

type Suppressed = {
  email: string;
  reason: string | null;
  created_at: string;
};

const RANGES = [
  { key: "24h", label: "Last 24h", ms: 24 * 60 * 60 * 1000 },
  { key: "7d", label: "Last 7 days", ms: 7 * 24 * 60 * 60 * 1000 },
  { key: "30d", label: "Last 30 days", ms: 30 * 24 * 60 * 60 * 1000 },
];

const STATUS_COLORS: Record<string, string> = {
  sent: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  pending: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  dlq: "bg-red-500/15 text-red-700 border-red-500/30",
  failed: "bg-red-500/15 text-red-700 border-red-500/30",
  bounced: "bg-orange-500/15 text-orange-700 border-orange-500/30",
  complained: "bg-orange-500/15 text-orange-700 border-orange-500/30",
  suppressed: "bg-amber-500/15 text-amber-700 border-amber-500/30",
};

const PAGE_SIZE = 50;
// Pending rows older than this are treated as timed-out and eligible for retry.
const STUCK_PENDING_MS = 30 * 60 * 1000;

export default function AdminEmails() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [suppressed, setSuppressed] = useState<Suppressed[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeKey, setRangeKey] = useState("7d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [template, setTemplate] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const { start, end } = useMemo(() => {
    if (rangeKey === "custom" && customStart && customEnd) {
      return {
        start: new Date(customStart).toISOString(),
        end: new Date(customEnd + "T23:59:59").toISOString(),
      };
    }
    const r = RANGES.find((r) => r.key === rangeKey) ?? RANGES[1];
    return {
      start: new Date(Date.now() - r.ms).toISOString(),
      end: new Date().toISOString(),
    };
  }, [rangeKey, customStart, customEnd]);

  const load = async () => {
    setLoading(true);
    const [logRes, supRes] = await Promise.all([
      supabase
        .from("email_send_log")
        .select("id, message_id, template_name, recipient_email, status, error_message, created_at")
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase
        .from("suppressed_emails")
        .select("email, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    setRows((logRes.data as LogRow[]) ?? []);
    setSuppressed((supRes.data as Suppressed[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end]);

  // Deduplicate: latest row per message_id (rows already sorted DESC).
  const deduped = useMemo(() => {
    const seen = new Set<string>();
    const out: LogRow[] = [];
    for (const r of rows) {
      const key = r.message_id ?? `__id:${r.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
    }
    return out;
  }, [rows]);

  const templates = useMemo(() => {
    const s = new Set<string>();
    deduped.forEach((r) => r.template_name && s.add(r.template_name));
    return Array.from(s).sort();
  }, [deduped]);

  const filtered = useMemo(() => {
    return deduped.filter((r) => {
      if (template !== "all" && r.template_name !== template) return false;
      if (status !== "all") {
        if (status === "failed" && !(r.status === "dlq" || r.status === "failed")) return false;
        else if (status !== "failed" && r.status !== status) return false;
      }
      return true;
    });
  }, [deduped, template, status]);

  const stats = useMemo(() => {
    let sent = 0, failed = 0, sup = 0, pending = 0, stuck = 0;
    const now = Date.now();
    for (const r of filtered) {
      if (r.status === "sent") sent++;
      else if (r.status === "dlq" || r.status === "failed" || r.status === "bounced") failed++;
      else if (r.status === "suppressed" || r.status === "complained") sup++;
      else if (r.status === "pending") {
        pending++;
        if (now - new Date(r.created_at).getTime() > STUCK_PENDING_MS) stuck++;
      }
    }
    return { total: filtered.length, sent, failed, sup, pending, stuck };
  }, [filtered]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(0);
  }, [template, status, rangeKey, customStart, customEnd]);

  const isRetryable = (r: LogRow) => {
    if (!r.template_name || !r.recipient_email) return false;
    if (r.status === "dlq" || r.status === "failed" || r.status === "bounced") return true;
    if (r.status === "pending") {
      return Date.now() - new Date(r.created_at).getTime() > STUCK_PENDING_MS;
    }
    return false;
  };

  const retry = async (r: LogRow) => {
    if (!r.template_name || !r.recipient_email) return;
    setRetryingId(r.id);
    try {
      const { data, error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: r.template_name,
          recipientEmail: r.recipient_email,
          idempotencyKey: `retry-${r.message_id ?? r.id}-${Date.now()}`,
          templateData: {},
        },
      });
      if (error) throw error;
      if (data && (data as any).success === false) {
        toast({
          title: "Retry skipped",
          description: (data as any).reason ?? "Recipient is suppressed",
          variant: "destructive",
        });
      } else {
        toast({ title: "Retry queued", description: `Re-sending ${r.template_name} to ${r.recipient_email}` });
      }
      await load();
    } catch (e: any) {
      toast({ title: "Retry failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Mail className="h-6 w-6 text-[hsl(var(--gold))]" /> Email Monitoring
        </h1>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4 border-border/50">
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <div className="flex gap-2 flex-wrap">
            {RANGES.map((r) => (
              <Button
                key={r.key}
                size="sm"
                variant={rangeKey === r.key ? "default" : "outline"}
                onClick={() => setRangeKey(r.key)}
              >
                {r.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant={rangeKey === "custom" ? "default" : "outline"}
              onClick={() => setRangeKey("custom")}
            >
              Custom
            </Button>
          </div>
          {rangeKey === "custom" && (
            <div className="flex gap-2 items-center">
              <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-40" />
              <span className="text-muted-foreground text-sm">to</span>
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-40" />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Template</label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All templates</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed (dlq)</SelectItem>
                <SelectItem value="suppressed">Suppressed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Sent", value: stats.sent, color: "text-emerald-600" },
          {
            label: stats.stuck > 0 ? `Pending (${stats.stuck} stuck)` : "Pending",
            value: stats.pending,
            color: stats.stuck > 0 ? "text-amber-600" : "text-sky-600",
          },
          { label: "Failed", value: stats.failed, color: "text-red-600" },
          { label: "Suppressed", value: stats.sup, color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardHeader className="pb-1"><CardTitle className="text-xs font-body text-muted-foreground">{s.label}</CardTitle></CardHeader>
            <CardContent><div className={`font-display text-2xl font-bold ${s.color}`}>{loading ? "—" : s.value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Log table */}
      <Card className="mb-6 border-border/50">
        <CardHeader><CardTitle className="text-base font-body">Recent emails</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Error</TableHead>
                <TableHead className="text-right">Retry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{loading ? "Loading…" : "No emails in this range"}</TableCell></TableRow>
              )}
              {paged.map((r) => {
                const stuck = r.status === "pending" && Date.now() - new Date(r.created_at).getTime() > STUCK_PENDING_MS;
                const canRetry = isRetryable(r);
                return (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.template_name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{r.recipient_email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={stuck ? STATUS_COLORS.failed : (STATUS_COLORS[r.status ?? ""] ?? "")}>
                      {stuck ? (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> timed out
                        </span>
                      ) : (r.status ?? "unknown")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs text-red-600 max-w-[320px] truncate" title={r.error_message ?? ""}>
                    {r.error_message ?? ""}
                  </TableCell>
                  <TableCell className="text-right">
                    {canRetry && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={retryingId === r.id}
                        onClick={() => retry(r)}
                      >
                        {retryingId === r.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <><RotateCcw className="h-3 w-3 mr-1" /> Retry</>
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between p-3 border-t border-border/50">
              <div className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages} · {filtered.length} emails
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suppressed */}
      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-base font-body">Suppressed addresses (bounces / complaints / unsubscribes)</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppressed.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No suppressed addresses</TableCell></TableRow>
              )}
              {suppressed.map((s) => (
                <TableRow key={s.email}>
                  <TableCell className="text-sm">{s.email}</TableCell>
                  <TableCell><Badge variant="outline">{s.reason ?? "unknown"}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}