import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

type Action = "approved" | "hidden" | "deleted";
type Row = { action: Action; subject: string; body_html: string };

const ACTIONS: Action[] = ["approved", "hidden", "deleted"];
const EMPTY: Record<Action, Row> = {
  approved: { action: "approved", subject: "", body_html: "" },
  hidden: { action: "hidden", subject: "", body_html: "" },
  deleted: { action: "deleted", subject: "", body_html: "" },
};

const PLACEHOLDER_HINT =
  "Available placeholders: {{guest_name}}, {{couple}}, {{caption}}, {{action}}";

export function GuestModerationTemplatesDialog({ siteId }: { siteId: string }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Record<Action, Row>>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("guest_moderation_templates")
        .select("action, subject, body_html")
        .eq("wedding_site_id", siteId);
      const next = { ...EMPTY };
      (data || []).forEach((r: any) => {
        if (ACTIONS.includes(r.action)) {
          next[r.action as Action] = {
            action: r.action,
            subject: r.subject || "",
            body_html: r.body_html || "",
          };
        }
      });
      setRows(next);
    })();
  }, [open, siteId]);

  const save = async () => {
    setSaving(true);
    const payload = ACTIONS.map((a) => ({
      wedding_site_id: siteId,
      action: a,
      subject: rows[a].subject.trim() || null,
      body_html: rows[a].body_html.trim() || null,
    }));
    const { error } = await supabase
      .from("guest_moderation_templates")
      .upsert(payload, { onConflict: "wedding_site_id,action" });
    setSaving(false);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Templates saved" });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Mail className="w-4 h-4 mr-1.5" /> Email templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Guest moderation email templates</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="approved">
          <TabsList>
            {ACTIONS.map((a) => (
              <TabsTrigger key={a} value={a} className="capitalize">{a}</TabsTrigger>
            ))}
          </TabsList>
          {ACTIONS.map((a) => (
            <TabsContent key={a} value={a} className="mt-4 space-y-3">
              <div className="space-y-1">
                <Label>Subject</Label>
                <Input
                  value={rows[a].subject}
                  onChange={(e) => setRows((r) => ({ ...r, [a]: { ...r[a], subject: e.target.value } }))}
                  placeholder="Leave blank to use the default subject"
                />
              </div>
              <div className="space-y-1">
                <Label>Body (HTML)</Label>
                <Textarea
                  value={rows[a].body_html}
                  onChange={(e) => setRows((r) => ({ ...r, [a]: { ...r[a], body_html: e.target.value } }))}
                  rows={10}
                  placeholder="Leave blank to use the default body"
                />
                <p className="text-xs text-muted-foreground">{PLACEHOLDER_HINT}</p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save templates"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}