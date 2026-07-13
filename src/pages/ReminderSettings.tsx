import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Bell, Mail, BellOff } from "lucide-react";

type Milestone = "d7" | "d3" | "d1" | "overdue";
type Channel = "email" | "in_app" | "off";

const MILESTONES: { key: Milestone; label: string; desc: string }[] = [
  { key: "d7", label: "1 week before", desc: "Tasks due within 7 days" },
  { key: "d3", label: "3 days before", desc: "Tasks due within 3 days" },
  { key: "d1", label: "1 day before", desc: "Tasks due tomorrow" },
  { key: "overdue", label: "Overdue", desc: "Tasks past their due date" },
];

const DEFAULTS: Record<Milestone, Channel> = {
  d7: "email",
  d3: "email",
  d1: "email",
  overdue: "email",
};

export default function ReminderSettings() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Record<Milestone, Channel>>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountEnabled, setAccountEnabled] = useState(true);
  const [sites, setSites] = useState<{ id: string; title: string; enabled: boolean }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: remData }, { data: sitesData }, { data: prefsData }] = await Promise.all([
        supabase.from("reminder_preferences").select("milestone, channel").eq("user_id", user.id),
        supabase.from("wedding_sites").select("id, partner1, partner2").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("guest_notification_prefs").select("wedding_site_id, enabled").eq("user_id", user.id),
      ]);
      const next = { ...DEFAULTS };
      (remData || []).forEach((r: any) => {
        if (r.milestone in next) next[r.milestone as Milestone] = r.channel as Channel;
      });
      setPrefs(next);

      const account = (prefsData || []).find((p: any) => p.wedding_site_id === null);
      setAccountEnabled(account ? account.enabled : true);
      const byId = new Map<string, boolean>();
      (prefsData || []).forEach((p: any) => {
        if (p.wedding_site_id) byId.set(p.wedding_site_id, p.enabled);
      });
      setSites(
        (sitesData || []).map((s: any) => ({
          id: s.id,
          title: [s.partner1, s.partner2].filter(Boolean).join(" & ") || "Untitled site",
          enabled: byId.has(s.id) ? (byId.get(s.id) as boolean) : true,
        }))
      );
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const rows = (Object.keys(prefs) as Milestone[]).map((m) => ({
      user_id: user.id,
      milestone: m,
      channel: prefs[m],
    }));
    const { error } = await supabase
      .from("reminder_preferences")
      .upsert(rows, { onConflict: "user_id,milestone" });

    // Account-wide guest notification pref (site_id null)
    const { error: accErr } = await supabase
      .from("guest_notification_prefs")
      .upsert(
        { user_id: user.id, wedding_site_id: null, enabled: accountEnabled },
        { onConflict: "user_id", ignoreDuplicates: false }
      );

    // Per-site prefs
    const siteRows = sites.map((s) => ({
      user_id: user.id,
      wedding_site_id: s.id,
      enabled: s.enabled,
    }));
    const { error: siteErr } = siteRows.length
      ? await supabase
          .from("guest_notification_prefs")
          .upsert(siteRows, { onConflict: "user_id,wedding_site_id" })
      : { error: null as any };

    setSaving(false);
    const firstErr = error || accErr || siteErr;
    if (firstErr) toast.error(firstErr.message);
    else toast.success("Preferences saved");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" /> Back to dashboard</Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-navy">Reminder preferences</CardTitle>
            <p className="text-sm text-muted-foreground">
              Choose how you'd like to be reminded about upcoming checklist tasks.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {MILESTONES.map((m) => (
              <div key={m.key} className="border-b border-border pb-5 last:border-0 last:pb-0">
                <div className="mb-2">
                  <Label className="text-base font-semibold text-navy">{m.label}</Label>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
                <RadioGroup
                  value={prefs[m.key]}
                  onValueChange={(v) => setPrefs((p) => ({ ...p, [m.key]: v as Channel }))}
                  className="grid grid-cols-3 gap-2"
                >
                  <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer hover:border-gold has-[[data-state=checked]]:border-gold has-[[data-state=checked]]:bg-gold/5">
                    <RadioGroupItem value="email" />
                    <Mail className="w-4 h-4" /> <span className="text-sm">Email</span>
                  </label>
                  <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer hover:border-gold has-[[data-state=checked]]:border-gold has-[[data-state=checked]]:bg-gold/5">
                    <RadioGroupItem value="in_app" />
                    <Bell className="w-4 h-4" /> <span className="text-sm">In-app</span>
                  </label>
                  <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer hover:border-gold has-[[data-state=checked]]:border-gold has-[[data-state=checked]]:bg-gold/5">
                    <RadioGroupItem value="off" />
                    <BellOff className="w-4 h-4" /> <span className="text-sm">Off</span>
                  </label>
                </RadioGroup>
              </div>
            ))}
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving} className="bg-gold text-navy hover:bg-gold/90">
                {saving ? "Saving..." : "Save preferences"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-navy">Guest photo notifications</CardTitle>
            <p className="text-sm text-muted-foreground">
              Emails to guests when you approve, hide, or delete their photo submissions.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <Label className="text-base font-semibold text-navy">All sites</Label>
                <p className="text-xs text-muted-foreground">Turn off to disable moderation emails across every site.</p>
              </div>
              <Switch checked={accountEnabled} onCheckedChange={setAccountEnabled} />
            </div>

            {sites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sites yet.</p>
            ) : (
              sites.map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{s.title}</Label>
                    <p className="text-xs text-muted-foreground">Per-site override</p>
                  </div>
                  <Switch
                    checked={accountEnabled && s.enabled}
                    disabled={!accountEnabled}
                    onCheckedChange={(v) =>
                      setSites((prev) => prev.map((p) => (p.id === s.id ? { ...p, enabled: v } : p)))
                    }
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}