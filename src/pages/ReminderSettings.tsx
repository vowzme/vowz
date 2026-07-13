import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("reminder_preferences")
        .select("milestone, channel")
        .eq("user_id", user.id);
      const next = { ...DEFAULTS };
      (data || []).forEach((r: any) => {
        if (r.milestone in next) next[r.milestone as Milestone] = r.channel as Channel;
      });
      setPrefs(next);
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
    setSaving(false);
    if (error) toast.error(error.message);
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
      </div>
    </div>
  );
}