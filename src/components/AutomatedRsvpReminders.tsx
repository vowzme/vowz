import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, MailCheck, Clock, Send } from "lucide-react";

type Schedule = {
  id?: string;
  wedding_site_id: string;
  enabled: boolean;
  wedding_date: string | null;
  offsets_days: number[];
  send_hour: number;
  subject_override: string | null;
  body_override: string | null;
  last_run_at: string | null;
};

const DEFAULT_OFFSETS = [30, 21, 14, 7, 3, 1];

export default function AutomatedRsvpReminders({ siteId }: { siteId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [recentSends, setRecentSends] = useState<Array<{ recipient: string; offset_day: number; status: string; created_at: string }>>([]);
  const [schedule, setSchedule] = useState<Schedule>({
    wedding_site_id: siteId,
    enabled: false,
    wedding_date: null,
    offsets_days: [30, 14, 7, 3, 1],
    send_hour: 10,
    subject_override: null,
    body_override: null,
    last_run_at: null,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [{ data: sch }, { count }, { data: sends }] = await Promise.all([
        supabase.from("rsvp_reminder_schedules").select("*").eq("wedding_site_id", siteId).maybeSingle(),
        supabase
          .from("guest_invites")
          .select("id", { count: "exact", head: true })
          .eq("wedding_site_id", siteId)
          .is("rsvp_id", null)
          .not("guest_email", "is", null)
          .neq("guest_email", ""),
        supabase
          .from("rsvp_reminder_sends")
          .select("recipient, offset_day, status, created_at")
          .eq("wedding_site_id", siteId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      if (!alive) return;
      if (sch) setSchedule({ ...(sch as Schedule) });
      setPendingCount(count ?? 0);
      setRecentSends((sends ?? []) as any);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [siteId]);

  const toggleOffset = (n: number) => {
    setSchedule((s) => {
      const has = s.offsets_days.includes(n);
      const next = has ? s.offsets_days.filter((x) => x !== n) : [...s.offsets_days, n].sort((a, b) => b - a);
      return { ...s, offsets_days: next.slice(0, 12) };
    });
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      wedding_site_id: siteId,
      enabled: schedule.enabled,
      wedding_date: schedule.wedding_date || null,
      offsets_days: schedule.offsets_days.length ? schedule.offsets_days : [7, 3, 1],
      send_hour: Math.max(0, Math.min(23, schedule.send_hour || 10)),
      subject_override: schedule.subject_override?.trim() || null,
      body_override: schedule.body_override?.trim() || null,
    };
    const { error } = await supabase
      .from("rsvp_reminder_schedules")
      .upsert(payload, { onConflict: "wedding_site_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save reminder settings", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reminder schedule saved" });
    }
  };

  const sendNow = async (forceOffset?: number) => {
    setTriggering(true);
    const { data, error } = await supabase.functions.invoke("rsvp-reminder-sender", {
      body: { site_id: siteId, ...(typeof forceOffset === "number" ? { force_offset: forceOffset } : {}) },
    });
    setTriggering(false);
    if (error) {
      toast({ title: "Send failed", description: error.message, variant: "destructive" });
      return;
    }
    const r = (data as any)?.result || {};
    toast({
      title: r.skipped ? `Skipped: ${r.skipped}` : `Reminders queued`,
      description: r.skipped
        ? `Days left: ${r.days_left ?? "?"}, configured offsets: ${(r.offsets || []).join(", ")}`
        : `Sent ${r.sent ?? 0} · Skipped ${r.skipped ?? 0} · Failed ${r.failed ?? 0}`,
    });
    const { data: sends } = await supabase
      .from("rsvp_reminder_sends")
      .select("recipient, offset_day, status, created_at")
      .eq("wedding_site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(10);
    setRecentSends((sends ?? []) as any);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border/50 rounded-2xl p-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading reminder settings…
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <MailCheck className="w-4 h-4 text-primary" /> Automated reminders for non-responders
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Guests with an invite email but no RSVP receive a gentle nudge automatically on each of the days you pick.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Switch checked={schedule.enabled} onCheckedChange={(v) => setSchedule((s) => ({ ...s, enabled: v }))} />
          <span className="text-xs">{schedule.enabled ? "On" : "Off"}</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Wedding date</Label>
          <Input
            type="date"
            value={schedule.wedding_date ?? ""}
            onChange={(e) => setSchedule((s) => ({ ...s, wedding_date: e.target.value || null }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Send hour (UTC)</Label>
          <Input
            type="number"
            min={0}
            max={23}
            value={schedule.send_hour}
            onChange={(e) => setSchedule((s) => ({ ...s, send_hour: Number(e.target.value) }))}
          />
          <p className="text-[11px] text-muted-foreground">Daily job runs at 10:05 UTC — this hour is informational for now.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Send on these days before the wedding</Label>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_OFFSETS.map((n) => {
            const active = schedule.offsets_days.includes(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => toggleOffset(n)}
                className={`px-3 py-1 rounded-full text-xs border transition ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}
              >
                {n} day{n === 1 ? "" : "s"}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">Selected: {schedule.offsets_days.join(", ") || "none"}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Subject override (optional)</Label>
          <Input
            placeholder="A gentle reminder — our wedding is soon"
            value={schedule.subject_override ?? ""}
            onChange={(e) => setSchedule((s) => ({ ...s, subject_override: e.target.value }))}
            maxLength={140}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Body override (optional)</Label>
          <Textarea
            rows={3}
            placeholder="We haven't heard back from you yet…"
            value={schedule.body_override ?? ""}
            onChange={(e) => setSchedule((s) => ({ ...s, body_override: e.target.value }))}
            maxLength={800}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
          Save schedule
        </Button>
        <Button variant="outline" onClick={() => sendNow()} disabled={triggering}>
          {triggering ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
          Run now (matching offset)
        </Button>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span>Non-responders with email: <Badge variant="secondary">{pendingCount ?? 0}</Badge></span>
          {schedule.last_run_at ? <span>Last run: {new Date(schedule.last_run_at).toLocaleString()}</span> : null}
        </div>
      </div>

      {recentSends.length > 0 && (
        <div className="pt-3 border-t border-border/50">
          <p className="text-xs font-medium mb-2">Recent reminders</p>
          <div className="space-y-1">
            {recentSends.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="truncate">{r.recipient}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px]">-{r.offset_day}d</Badge>
                  <Badge variant={r.status === "failed" ? "destructive" : "secondary"} className="text-[10px]">
                    {r.status}
                  </Badge>
                  <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}