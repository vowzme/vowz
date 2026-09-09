// Guest List Manager — per-guest RSVP tracking + WhatsApp share.
// Reads from public.rsvps (RLS restricts to site owner). No new tables.
// WhatsApp support is manual via wa.me deep links — no WhatsApp Business API.

import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Search, Download, FileText, MessageCircle, Users, Check, X as XIcon, Loader2, Mail, Copy, Megaphone, Smartphone, FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeHealth } from "@/lib/realtime-health";

import { useAuth } from "@/hooks/use-auth";
import { useSitePermissions } from "@/hooks/use-site-permissions";
import { toast } from "@/hooks/use-toast";
import InviteLinksPanel from "@/components/InviteLinksPanel";

type Rsvp = {
  id: string;
  guest_name: string;
  guest_email: string;
  attending: boolean;
  guest_count: number;
  meal_preference: string | null;
  selected_events: string[] | null;
  message: string | null;
  created_at: string;
  plus_ones: Array<{ name: string; meal_preference: string | null; dietary_tags: string[] }> | null;
};

type InviteMeta = { guest_phone: string | null; plus_ones_allowed: number | null };

type Site = { id: string; partner1: string; partner2: string; slug: string | null };
type WeddingEvent = { name: string; date?: string; time?: string; venue?: string };

// Extract "Dietary: …" and "Dietary notes: …" lines out of the message column.
function parseDietary(message: string | null): { tags: string[]; notes: string; rest: string } {
  if (!message) return { tags: [], notes: "", rest: "" };
  const lines = message.split("\n");
  let tags: string[] = [];
  let notes = "";
  const rest: string[] = [];
  for (const line of lines) {
    const t = line.match(/^Dietary:\s*(.*)$/i);
    const n = line.match(/^Dietary notes:\s*(.*)$/i);
    if (t) tags = t[1].split(",").map((s) => s.trim()).filter(Boolean);
    else if (n) notes = n[1].trim();
    else rest.push(line);
  }
  return { tags, notes, rest: rest.join("\n").trim() };
}

export default function GuestList() {
  const { siteId } = useParams<{ siteId: string }>();
  const { user } = useAuth();
  const perms = useSitePermissions(siteId);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<Site | null>(null);
  const [rows, setRows] = useState<Rsvp[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const realtimeHealth = useRealtimeHealth();
  const [inviteMeta, setInviteMeta] = useState<Record<string, InviteMeta>>({});

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "yes" | "no">("all");
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [broadcast, setBroadcast] = useState({
    eventIdx: -1,
    audience: "yes" as "all" | "yes" | "no" | "event",
    subject: "Update about our wedding",
    message: "",
  });

  useEffect(() => {
    if (!siteId || !user) return;
    (async () => {
      setLoading(true);
      const { data: s } = await supabase
        .from("wedding_sites")
        .select("id, partner1, partner2, slug, user_id, sections")
        .eq("id", siteId)
        .maybeSingle();
      const allowed = s && (s.user_id === user.id || perms.can("manage_guests"));
      if (!s || !allowed) {
        toast({ title: "Not found", description: "This site doesn't exist or isn't yours.", variant: "destructive" });
        navigate("/dashboard");
        return;
      }
      setSite(s as any);
      const ev = ((s as any).sections as any[] || [])
        .find((sec) => sec.type === "events")?.data?.events as WeddingEvent[] | undefined;
      setEvents(ev || []);
      const { data: r, error } = await supabase
        .from("rsvps")
        .select("id, guest_name, guest_email, attending, guest_count, meal_preference, selected_events, message, created_at, plus_ones")
        .eq("wedding_site_id", siteId)
        .order("created_at", { ascending: false });
      if (error) {
        toast({ title: "Couldn't load RSVPs", description: error.message, variant: "destructive" });
      } else {
        setRows((r ?? []) as any);
      }
      // Best-effort enrichment with per-guest phone + plus-ones-allowed from invites.
      const { data: invites } = await supabase
        .from("guest_invites")
        .select("guest_name, guest_email, guest_phone, plus_ones_allowed")
        .eq("wedding_site_id", siteId);
      if (invites && invites.length) {
        const map: Record<string, InviteMeta> = {};
        for (const inv of invites as any[]) {
          const keys = [
            inv.guest_email ? `e:${String(inv.guest_email).trim().toLowerCase()}` : "",
            inv.guest_name ? `n:${String(inv.guest_name).trim().toLowerCase()}` : "",
          ].filter(Boolean);
          for (const k of keys) {
            map[k] = { guest_phone: inv.guest_phone ?? null, plus_ones_allowed: inv.plus_ones_allowed ?? null };
          }
        }
        setInviteMeta(map);
      }
      setLoading(false);
    })();
  }, [siteId, user, navigate, perms.loading]);

  // ─── Fallback refresh ───────────────────────────────────────────────
  // Live updates can drop on flaky mobile networks. Rather than showing an
  // error, quietly re-read the responses on a timer and when the tab regains
  // focus, so the guest list is always populated with saved data.
  useEffect(() => {
    if (!siteId) return;
    let cancelled = false;

    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      const { data, error } = await supabase
        .from("rsvps")
        .select("id, guest_name, guest_email, attending, guest_count, meal_preference, selected_events, message, created_at, plus_ones")
        .eq("wedding_site_id", siteId)
        .order("created_at", { ascending: false });
      if (!cancelled && !error && data) {
        setRows((prev) => (data.length || prev.length ? (data as any) : prev));
        setLastSyncedAt(new Date());
      }
    };

    const interval = window.setInterval(refresh, realtimeHealth === "live" ? 120000 : 25000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [siteId, realtimeHealth]);


  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "yes" && !r.attending) return false;
      if (filter === "no" && r.attending) return false;
      if (!needle) return true;
      return (
        r.guest_name.toLowerCase().includes(needle) ||
        r.guest_email.toLowerCase().includes(needle) ||
        (r.message ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rows, q, filter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const yes = rows.filter((r) => r.attending).length;
    const no = total - yes;
    const heads = rows.filter((r) => r.attending).reduce((s, r) => s + (r.guest_count || 1), 0);
    return { total, yes, no, heads };
  }, [rows]);

  const inviteUrl = site?.slug ? `${window.location.origin}/site/${site.slug}` : "";
  const inviteText = site
    ? `You're invited to ${site.partner1} & ${site.partner2}'s wedding! ${inviteUrl ? `RSVP here: ${inviteUrl}` : ""}`.trim()
    : "";

  const waLink = (name: string) =>
    `https://wa.me/?text=${encodeURIComponent(`Hi ${name}, ${inviteText}`)}`;

  // Canonical roster shape shared across CSV + Excel exports.
  const buildRoster = () => {
    const lookupMeta = (r: Rsvp): InviteMeta => {
      const byEmail = r.guest_email ? inviteMeta[`e:${r.guest_email.trim().toLowerCase()}`] : undefined;
      const byName = !byEmail && r.guest_name ? inviteMeta[`n:${r.guest_name.trim().toLowerCase()}`] : undefined;
      return byEmail || byName || { guest_phone: null, plus_ones_allowed: null };
    };
    return filtered.map((r) => {
      const { tags, notes, rest } = parseDietary(r.message);
      const meta = lookupMeta(r);
      const companions = (r.plus_ones ?? []).map((p) => ({
        name: p.name,
        meal: p.meal_preference || "",
        dietary: (p.dietary_tags ?? []).join(", "),
      }));
      return {
        "Guest name": r.guest_name,
        Email: r.guest_email,
        Phone: meta.guest_phone ?? "",
        Status: r.attending ? "Attending" : "Regrets",
        "Total heads": r.guest_count,
        "Plus-ones allowed": meta.plus_ones_allowed ?? "",
        Meal: r.meal_preference ?? "",
        "Dietary tags": tags.join(", "),
        "Dietary notes": notes,
        Events: (r.selected_events ?? []).join(", "),
        Message: rest,
        "Companion count": companions.length,
        Companions: companions
          .map((c) => {
            const bits = [c.meal, c.dietary].filter(Boolean).join(" / ");
            return bits ? `${c.name} (${bits})` : c.name;
          })
          .join(" | "),
        "Companion names": companions.map((c) => c.name).join(" | "),
        "Companion meals": companions.map((c) => c.meal).join(" | "),
        "Companion dietary": companions.map((c) => c.dietary).join(" | "),
        Submitted: new Date(r.created_at).toISOString(),
      };
    });
  };

  const exportCsv = () => {
    const roster = buildRoster();
    if (roster.length === 0) return;
    const headers = Object.keys(roster[0]);
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];
    for (const row of roster) lines.push(headers.map((h) => esc((row as any)[h])).join(","));
    // Prepend UTF-8 BOM so Excel opens accented names + emoji correctly.
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guest-list-${site?.slug || site?.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportXlsx = async () => {
    // Loaded on demand — the spreadsheet library is ~300 kB and is only
    // needed when someone actually clicks Export.
    const XLSX = await import("xlsx");
    const roster = buildRoster();
    if (roster.length === 0) return;
    const summary = [
      { Metric: "Total RSVPs", Value: stats.total },
      { Metric: "Attending", Value: stats.yes },
      { Metric: "Regrets", Value: stats.no },
      { Metric: "Total heads (attending)", Value: stats.heads },
      { Metric: "Exported", Value: new Date().toLocaleString() },
      { Metric: "Wedding", Value: site ? `${site.partner1} & ${site.partner2}` : "" },
    ];
    // One row per companion — useful for seating + catering counts.
    const companionRows: any[] = [];
    for (const r of filtered) {
      (r.plus_ones ?? []).forEach((p, idx) => {
        companionRows.push({
          "Primary guest": r.guest_name,
          "Primary email": r.guest_email,
          "Companion #": idx + 1,
          "Companion name": p.name,
          Meal: p.meal_preference ?? "",
          "Dietary tags": (p.dietary_tags ?? []).join(", "),
        });
      });
    }
    const wb = XLSX.utils.book_new();
    const wsRoster = XLSX.utils.json_to_sheet(roster);
    // Set column widths based on header + longest cell for readability.
    const headers = Object.keys(roster[0]);
    (wsRoster as any)["!cols"] = headers.map((h) => ({
      wch: Math.min(
        48,
        Math.max(h.length + 2, ...roster.map((r) => String((r as any)[h] ?? "").length + 2)),
      ),
    }));
    XLSX.utils.book_append_sheet(wb, wsRoster, "RSVPs");
    if (companionRows.length) {
      const wsPlus = XLSX.utils.json_to_sheet(companionRows);
      XLSX.utils.book_append_sheet(wb, wsPlus, "Companions");
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "Summary");
    XLSX.writeFile(wb, `guest-list-${site?.slug || site?.id}.xlsx`);
  };

  const exportPdf = () => {
    const esc = (v: any) =>
      String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const couple = site ? `${site.partner1} & ${site.partner2}` : "Wedding";
    const total = filtered.length;
    const yes = filtered.filter((r) => r.attending).length;
    const heads = filtered.filter((r) => r.attending).reduce((n, r) => n + (r.guest_count || 0), 0);

    const rowsHtml = filtered
      .map((r) => {
        const { tags, notes, rest } = parseDietary(r.message);
        const companionsHtml = (r.plus_ones ?? []).length
          ? (r.plus_ones ?? [])
              .map((p) => {
                const bits = [p.meal_preference, ...(p.dietary_tags ?? [])].filter(Boolean).join(", ");
                return `<div>${esc(p.name)}${bits ? ` <span style="color:#777">— ${esc(bits)}</span>` : ""}</div>`;
              })
              .join("")
          : "—";
        return `<tr>
          <td>${esc(r.guest_name)}<div class="sub">${esc(r.guest_email)}</div></td>
          <td>${r.attending ? "Yes" : "No"}</td>
          <td>${esc(r.guest_count)}</td>
          <td>${esc(r.meal_preference || "—")}</td>
          <td>${tags.length ? esc(tags.join(", ")) : "—"}</td>
          <td>${notes ? esc(notes) : "—"}</td>
          <td>${esc((r.selected_events ?? []).join(", ") || "—")}</td>
          <td>${rest ? esc(rest) : "—"}</td>
          <td>${companionsHtml}</td>
        </tr>`;
      })
      .join("");

    const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>Guest List — ${esc(couple)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#111;margin:24px}
  h1{margin:0 0 4px;font-size:20px}
  .meta{color:#666;font-size:12px;margin-bottom:16px}
  .stats{display:flex;gap:16px;margin:12px 0 20px;font-size:12px}
  .stats span b{display:block;font-size:16px;color:#111}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}
  th{background:#f5f5f5;text-transform:uppercase;font-size:10px;letter-spacing:.04em}
  .sub{color:#777;font-size:10px;margin-top:2px}
  @page{size:A4 landscape;margin:12mm}
</style></head><body>
<h1>RSVP Guest List — ${esc(couple)}</h1>
<div class="meta">Generated ${new Date().toLocaleString()}</div>
<div class="stats">
  <span><b>${total}</b> Total RSVPs</span>
  <span><b>${yes}</b> Attending</span>
  <span><b>${heads}</b> Heads</span>
</div>
<table>
  <thead><tr>
    <th>Guest</th><th>Attending</th><th>Heads</th><th>Meal</th>
    <th>Dietary</th><th>Dietary notes</th><th>Events</th><th>Message</th><th>Companions</th>
  </tr></thead>
  <tbody>${rowsHtml}</tbody>
</table>
<script>window.onload=()=>{setTimeout(()=>window.print(),200);}</script>
</body></html>`;

    const w = window.open("", "_blank");
    if (!w) {
      toast({ title: "Popup blocked", description: "Allow popups to export the PDF.", variant: "destructive" });
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const copyBroadcast = async () => {
    if (!inviteText) return;
    await navigator.clipboard.writeText(inviteText);
    toast({ title: "Invite copied", description: "Paste it into any WhatsApp chat or group to broadcast." });
  };

  // ── Mass broadcast (announcements) ────────────────────────────────────
  const broadcastRecipients = useMemo(() => {
    let list = rows;
    if (broadcast.audience === "yes") list = rows.filter((r) => r.attending);
    else if (broadcast.audience === "no") list = rows.filter((r) => !r.attending);
    else if (broadcast.audience === "event") {
      const ev = events[broadcast.eventIdx];
      if (ev) list = rows.filter((r) => r.attending && (r.selected_events ?? []).includes(ev.name));
    }
    return list;
  }, [rows, broadcast.audience, broadcast.eventIdx, events]);

  const composedMessage = useMemo(() => {
    const ev = broadcast.eventIdx >= 0 ? events[broadcast.eventIdx] : null;
    const evLine = ev
      ? `📢 ${ev.name}${ev.date ? ` — ${ev.date}` : ""}${ev.time ? ` at ${ev.time}` : ""}${ev.venue ? ` (${ev.venue})` : ""}`
      : "";
    const signature = site ? `\n— ${site.partner1} & ${site.partner2}` : "";
    const link = inviteUrl ? `\n${inviteUrl}` : "";
    return [evLine, broadcast.message.trim(), link, signature].filter(Boolean).join("\n").trim();
  }, [broadcast, events, site, inviteUrl]);

  const openWhatsAppBroadcast = () => {
    if (!composedMessage) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(composedMessage)}`, "_blank");
    toast({ title: `Opens WhatsApp for ${broadcastRecipients.length} guest${broadcastRecipients.length === 1 ? "" : "s"}`, description: "Pick a WhatsApp Broadcast list or paste into your group." });
  };

  const openSmsBroadcast = () => {
    if (!composedMessage) return;
    window.location.href = `sms:?&body=${encodeURIComponent(composedMessage)}`;
  };

  const openEmailBroadcast = () => {
    if (!composedMessage) return;
    const bcc = broadcastRecipients.map((r) => r.guest_email).filter(Boolean).join(",");
    if (!bcc) {
      toast({ title: "No email addresses in this audience", variant: "destructive" });
      return;
    }
    window.location.href = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(broadcast.subject)}&body=${encodeURIComponent(composedMessage)}`;
  };

  const copyBroadcastMessage = async () => {
    if (!composedMessage) return;
    await navigator.clipboard.writeText(composedMessage);
    toast({ title: "Message copied", description: "Paste into your WhatsApp broadcast list, group, or SMS app." });
  };

  return (
    <>
      <Helmet>
        <title>Guest List · Vowz</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
                <Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" /> Dashboard</Link>
              </Button>
              <h1 className="font-display text-3xl font-semibold">Guest List</h1>
              <p className="text-sm text-muted-foreground font-body">
                {site ? `${site.partner1} & ${site.partner2}'s wedding` : "Loading…"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyBroadcast} disabled={!inviteText}>
                <Copy className="w-4 h-4 mr-1" /> Copy invite
              </Button>
              <Button variant="gold" size="sm" asChild disabled={!inviteText}>
                <a href={`https://wa.me/?text=${encodeURIComponent(inviteText)}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp broadcast
                </a>
              </Button>
              <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
                <Download className="w-4 h-4 mr-1" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportXlsx} disabled={filtered.length === 0}>
                <FileSpreadsheet className="w-4 h-4 mr-1" /> Export Excel
              </Button>
              <Button variant="outline" size="sm" onClick={exportPdf} disabled={filtered.length === 0}>
                <FileText className="w-4 h-4 mr-1" /> Export PDF
              </Button>
            </div>
          </div>

          {realtimeHealth === "degraded" && (
            <div className="mb-4 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs font-body text-muted-foreground">
              Live updates are reconnecting. Your guest list is still up to date and refreshes every few seconds
              {lastSyncedAt ? ` — last checked ${lastSyncedAt.toLocaleTimeString()}` : ""}.
            </div>
          )}



          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <Stat label="Total RSVPs" value={stats.total} icon={<Users className="w-4 h-4" />} />
            <Stat label="Attending" value={stats.yes} icon={<Check className="w-4 h-4 text-emerald-600" />} />
            <Stat label="Regrets" value={stats.no} icon={<XIcon className="w-4 h-4 text-destructive" />} />
            <Stat label="Total heads" value={stats.heads} icon={<Users className="w-4 h-4 text-gold" />} />
          </div>

          {site && (
            <InviteLinksPanel
              siteId={site.id}
              siteSlug={site.slug}
              coupleNames={`${site.partner1} & ${site.partner2}`}
            />
          )}

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, email, message…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="inline-flex rounded-md border border-border overflow-hidden">
              {(["all", "yes", "no"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`px-3 py-1.5 text-xs font-body transition-colors ${
                    filter === k ? "bg-gold text-primary-foreground" : "bg-background hover:bg-muted"
                  }`}
                >
                  {k === "all" ? "All" : k === "yes" ? "Attending" : "Not attending"}
                </button>
              ))}
            </div>
          </div>

          {/* Announcements broadcast */}
          <div className="mb-6 rounded-xl border border-border/60 bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-gold" />
              <h2 className="font-display text-lg">Announcement broadcast</h2>
              <span className="ml-auto text-xs font-body text-muted-foreground">
                {broadcastRecipients.length} guest{broadcastRecipients.length === 1 ? "" : "s"} · {broadcastRecipients.filter((r) => r.guest_email).length} email{broadcastRecipients.filter((r) => r.guest_email).length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                value={broadcast.audience}
                onChange={(e) => setBroadcast({ ...broadcast, audience: e.target.value as any })}
                className="h-9 rounded-md border border-border bg-background px-2 text-sm font-body"
              >
                <option value="all">Everyone who RSVP'd</option>
                <option value="yes">Attending only</option>
                <option value="no">Not attending</option>
                <option value="event">Guests for a specific event</option>
              </select>
              <select
                value={broadcast.eventIdx}
                onChange={(e) => setBroadcast({ ...broadcast, eventIdx: parseInt(e.target.value), audience: parseInt(e.target.value) >= 0 ? "event" : broadcast.audience })}
                disabled={events.length === 0}
                className="h-9 rounded-md border border-border bg-background px-2 text-sm font-body disabled:opacity-50"
              >
                <option value={-1}>{events.length === 0 ? "No events on your site" : "Pick an event (optional)"}</option>
                {events.map((ev, i) => (
                  <option key={i} value={i}>{ev.name}{ev.date ? ` — ${ev.date}` : ""}</option>
                ))}
              </select>
              <Input
                value={broadcast.subject}
                onChange={(e) => setBroadcast({ ...broadcast, subject: e.target.value })}
                placeholder="Email subject"
                className="h-9"
                maxLength={140}
              />
            </div>
            <Textarea
              value={broadcast.message}
              onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
              placeholder="What do you want to tell your guests? e.g. Sangeet dress code is pastel, bus leaves at 6pm sharp."
              rows={3}
              maxLength={1000}
              className="font-body text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="gold" size="sm" onClick={openWhatsAppBroadcast} disabled={!composedMessage.trim()}>
                <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
              </Button>
              <Button variant="outline" size="sm" onClick={openSmsBroadcast} disabled={!composedMessage.trim()}>
                <Smartphone className="w-4 h-4 mr-1" /> SMS
              </Button>
              <Button variant="outline" size="sm" onClick={openEmailBroadcast} disabled={!composedMessage.trim() || broadcastRecipients.filter((r) => r.guest_email).length === 0}>
                <Mail className="w-4 h-4 mr-1" /> Email (BCC)
              </Button>
              <Button variant="ghost" size="sm" onClick={copyBroadcastMessage} disabled={!composedMessage.trim()}>
                <Copy className="w-4 h-4 mr-1" /> Copy message
              </Button>
            </div>
            <p className="text-[11px] font-body text-muted-foreground">
              Announcements open your own WhatsApp / SMS / email app with the message and recipients prefilled — no bulk send from our servers, so guests always see it come from you.
            </p>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-border/60 rounded-xl">
              <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-body text-muted-foreground">No RSVPs match your filters yet.</p>
            </div>
          ) : (
            <div className="border border-border/60 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2.5">Guest</th>
                      <th className="text-left px-4 py-2.5">Attending</th>
                      <th className="text-left px-4 py-2.5">Heads</th>
                      <th className="text-left px-4 py-2.5">Meal</th>
                      <th className="text-left px-4 py-2.5">Dietary</th>
                      <th className="text-left px-4 py-2.5">Events</th>
                      <th className="text-left px-4 py-2.5">Message</th>
                      <th className="text-right px-4 py-2.5">Reach out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const { tags, notes, rest } = parseDietary(r.message);
                      return (
                      <tr key={r.id} className="border-t border-border/50 hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{r.guest_name}</div>
                          <div className="text-xs text-muted-foreground">{r.guest_email}</div>
                          {(r.plus_ones ?? []).length > 0 && (
                            <div className="mt-1.5 space-y-0.5">
                              {(r.plus_ones ?? []).map((p, i) => {
                                const bits = [p.meal_preference, ...(p.dietary_tags ?? [])].filter(Boolean).join(", ");
                                return (
                                  <div key={i} className="text-xs text-muted-foreground">
                                    <span className="text-foreground/80">+ {p.name}</span>
                                    {bits && <span> — {bits}</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.attending ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600"><Check className="w-3.5 h-3.5" /> Yes</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-destructive"><XIcon className="w-3.5 h-3.5" /> No</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{r.guest_count}</td>
                        <td className="px-4 py-3 capitalize text-muted-foreground">{r.meal_preference || "—"}</td>
                        <td className="px-4 py-3 text-xs max-w-[200px]">
                          {tags.length === 0 && !notes ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <div className="space-y-1">
                              {tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {tags.map((tg) => (
                                    <span key={tg} className="px-1.5 py-0.5 rounded bg-gold/15 text-foreground border border-gold/30">
                                      {tg}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {notes && (
                                <div className="text-muted-foreground truncate" title={notes}>{notes}</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate" title={(r.selected_events ?? []).join(", ")}>
                          {(r.selected_events ?? []).join(", ") || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[240px] truncate" title={rest || r.message || ""}>
                          {rest || "—"}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <a
                            href={waLink(r.guest_name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border hover:bg-muted mr-1"
                            title="Open WhatsApp with a prefilled invite message"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                          <a
                            href={`mailto:${encodeURIComponent(r.guest_email)}?subject=${encodeURIComponent("Our wedding invitation")}&body=${encodeURIComponent(inviteText)}`}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border hover:bg-muted"
                          >
                            <Mail className="w-3.5 h-3.5" /> Email
                          </a>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-body">{icon} {label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </div>
  );
}
