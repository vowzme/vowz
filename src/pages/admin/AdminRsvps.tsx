import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RefreshCw } from "lucide-react";

type RsvpRow = {
  id: string;
  wedding_site_id: string;
  guest_name: string;
  guest_email: string;
  attending: boolean;
  guest_count: number;
  meal_preference: string | null;
  message: string | null;
  plus_ones: unknown;
  created_at: string;
};

type SiteRow = { id: string; partner1: string; partner2: string; slug: string | null };
type LogRow = { recipient_email: string; status: string | null; created_at: string };

const RANGES = { "24h": 1, "7d": 7, "30d": 30, all: 0 } as const;
type RangeKey = keyof typeof RANGES;

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

function emailBadge(status: string | null | undefined) {
  const s = status || "not sent";
  const cls =
    s === "sent" ? "bg-green-100 text-green-800" :
    s === "failed" || s === "bounced" ? "bg-red-100 text-red-800" :
    s === "suppressed" ? "bg-yellow-100 text-yellow-800" :
    "bg-muted text-muted-foreground";
  return <Badge className={cls}>{s}</Badge>;
}

function csvCell(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function AdminRsvps() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [status, setStatus] = useState<"all" | "attending" | "declined">("all");
  const [search, setSearch] = useState("");
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const days = RANGES[range];
      const since = days ? new Date(Date.now() - days * 86400000).toISOString() : null;

      let q = supabase
        .from("rsvps")
        .select("id, wedding_site_id, guest_name, guest_email, attending, guest_count, meal_preference, message, plus_ones, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (since) q = q.gte("created_at", since);

      const [rsvpRes, siteRes, logRes] = await Promise.all([
        q,
        supabase.from("wedding_sites").select("id, partner1, partner2, slug"),
        supabase
          .from("email_send_log")
          .select("recipient_email, status, created_at")
          .eq("template_name", "rsvp-confirmation")
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);

      if (rsvpRes.error) throw rsvpRes.error;
      setRsvps((rsvpRes.data as RsvpRow[]) || []);
      setSites((siteRes.data as SiteRow[]) || []);
      setLogs((logRes.data as LogRow[]) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load RSVPs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const siteMap = useMemo(() => {
    const m = new Map<string, SiteRow>();
    for (const s of sites) m.set(s.id, s);
    return m;
  }, [sites]);

  const emailStatusByGuest = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of logs) {
      const key = (l.recipient_email || "").toLowerCase();
      if (!m.has(key) && l.status) m.set(key, l.status);
    }
    return m;
  }, [logs]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rsvps.filter((r) => {
      if (siteFilter !== "all" && r.wedding_site_id !== siteFilter) return false;
      if (status === "attending" && !r.attending) return false;
      if (status === "declined" && r.attending) return false;
      if (!term) return true;
      const site = siteMap.get(r.wedding_site_id);
      const hay = [
        r.guest_name,
        r.guest_email,
        site ? `${site.partner1} ${site.partner2} ${site.slug || ""}` : "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [rsvps, siteFilter, status, search, siteMap]);

  const stats = useMemo(() => {
    const attending = filtered.filter((r) => r.attending);
    const guests = attending.reduce((sum, r) => sum + (r.guest_count || 0), 0);
    let sent = 0;
    let missing = 0;
    for (const r of filtered) {
      const s = emailStatusByGuest.get((r.guest_email || "").toLowerCase());
      if (s === "sent") sent++;
      else missing++;
    }
    return {
      total: filtered.length,
      attending: attending.length,
      declined: filtered.length - attending.length,
      guests,
      sent,
      missing,
    };
  }, [filtered, emailStatusByGuest]);

  const exportCsv = () => {
    const header = [
      "Submitted", "Site", "Slug", "Guest", "Email", "Attending",
      "Guests", "Meal", "Confirmation email", "Message",
    ];
    const rows = filtered.map((r) => {
      const site = siteMap.get(r.wedding_site_id);
      return [
        new Date(r.created_at).toISOString(),
        site ? `${site.partner1} & ${site.partner2}` : r.wedding_site_id,
        site?.slug || "",
        r.guest_name,
        r.guest_email,
        r.attending ? "Yes" : "No",
        r.guest_count,
        r.meal_preference || "",
        emailStatusByGuest.get((r.guest_email || "").toLowerCase()) || "not sent",
        r.message || "",
      ];
    });
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `vowz-rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">RSVP Tracking</h1>
          <p className="text-sm text-muted-foreground">
            Every guest response across the platform, with confirmation-email delivery status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
            Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
        <StatCard label="RSVPs" value={stats.total} />
        <StatCard label="Attending" value={stats.attending} tone="text-green-600" />
        <StatCard label="Declined" value={stats.declined} tone="text-rose-600" />
        <StatCard label="Total guests" value={stats.guests} />
        <StatCard label="Emails sent" value={stats.sent} tone="text-green-600" />
        <StatCard label="No email record" value={stats.missing} tone="text-amber-600" />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="font-display text-lg">Responses</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search guest, email or couple…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64"
            />
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All responses</SelectItem>
                <SelectItem value="attending">Attending</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
            <Select value={siteFilter} onValueChange={setSiteFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="All sites" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sites</SelectItem>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.partner1} &amp; {s.partner2}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Couple</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Meal</TableHead>
                <TableHead>Confirmation email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Loading RSVPs…
                  </TableCell>
                </TableRow>
              )}
              {!loading && !filtered.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No RSVPs match these filters.
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.map((r) => {
                const site = siteMap.get(r.wedding_site_id);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.guest_name}</div>
                      <div className="text-xs text-muted-foreground">{r.guest_email}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {site ? (
                        site.slug ? (
                          <a
                            className="underline underline-offset-2"
                            href={`/site/${site.slug}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {site.partner1} &amp; {site.partner2}
                          </a>
                        ) : (
                          `${site.partner1} & ${site.partner2}`
                        )
                      ) : (
                        <span className="text-muted-foreground">Unknown site</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={r.attending ? "bg-green-100 text-green-800" : "bg-rose-100 text-rose-800"}>
                        {r.attending ? "Attending" : "Declined"}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.guest_count}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.meal_preference || "—"}
                    </TableCell>
                    <TableCell>{emailBadge(emailStatusByGuest.get((r.guest_email || "").toLowerCase()))}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
