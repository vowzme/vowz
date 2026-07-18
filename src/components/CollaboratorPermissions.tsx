import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Shield, Trash2, UserPlus } from "lucide-react";
import type { SiteFeaturePermission } from "@/hooks/use-site-permissions";

type Member = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  can_edit: boolean;
  permissions: Partial<Record<SiteFeaturePermission, boolean>>;
};

const FEATURE_LIST: Array<{ key: SiteFeaturePermission; label: string; hint: string }> = [
  { key: "edit_content", label: "Edit site content", hint: "Text, photos, sections in the editor" },
  { key: "manage_features", label: "Toggle features", hint: "Enable or disable modules" },
  { key: "manage_rsvp", label: "Manage RSVP", hint: "RSVP settings and responses" },
  { key: "manage_guests", label: "Manage guests", hint: "Guest list, invites, edits" },
  { key: "manage_reminders", label: "Manage reminders", hint: "Automated RSVP reminders" },
  { key: "manage_album", label: "Moderate album", hint: "Approve or remove guest photos" },
];

export default function CollaboratorPermissions({ siteId, ownerOnly }: { siteId: string; ownerOnly: boolean }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("wedding_family_members")
      .select("id, name, email, phone, role, can_edit, permissions")
      .eq("wedding_site_id", siteId)
      .order("created_at", { ascending: true });
    if (error) toast({ title: "Couldn't load collaborators", description: error.message, variant: "destructive" });
    setMembers(((data ?? []) as any[]).map((m) => ({ ...m, permissions: (m.permissions ?? {}) as any })));
    setLoading(false);
  };

  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, siteId]);

  const addMember = async () => {
    const email = newEmail.trim().toLowerCase();
    const name = newName.trim();
    if (!email || !name) {
      toast({ title: "Name and email required", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("wedding_family_members").insert({
      wedding_site_id: siteId,
      name,
      email,
      role: "family",
      can_edit: true,
      permissions: { edit_content: true } as any,
    });
    if (error) {
      toast({ title: "Couldn't invite collaborator", description: error.message, variant: "destructive" });
      return;
    }
    setNewName("");
    setNewEmail("");
    toast({ title: "Collaborator added", description: `${name} can now sign in with ${email} to collaborate.` });
    await load();
  };

  const togglePermission = async (member: Member, feature: SiteFeaturePermission, next: boolean) => {
    setSaving(member.id);
    const perms = { ...(member.permissions || {}), [feature]: next };
    const { error } = await supabase
      .from("wedding_family_members")
      .update({ permissions: perms as any })
      .eq("id", member.id);
    setSaving(null);
    if (error) {
      toast({ title: "Couldn't update permission", description: error.message, variant: "destructive" });
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, permissions: perms } : m)));
  };

  const removeMember = async (member: Member) => {
    if (!confirm(`Remove ${member.name} as a collaborator?`)) return;
    const { error } = await supabase.from("wedding_family_members").delete().eq("id", member.id);
    if (error) {
      toast({ title: "Couldn't remove", description: error.message, variant: "destructive" });
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
  };

  if (!ownerOnly) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className="h-4 w-4" />
          Collaborator permissions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">Collaborator permissions</DialogTitle>
          <DialogDescription>
            Invite family or planners by email and grant only the modules they should manage. They can sign in with the same email to access your site.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border p-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <UserPlus className="h-4 w-4" /> Invite a collaborator
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Priya" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" placeholder="priya@example.com" />
            </div>
            <div className="flex items-end">
              <Button onClick={addMember} className="w-full">Add</Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">By default they get <strong>Edit site content</strong>. Toggle other modules below.</p>
        </div>

        <div className="mt-3 space-y-3 max-h-[50vh] overflow-y-auto">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && members.length === 0 && <p className="text-sm text-muted-foreground">No collaborators yet.</p>}
          {members.map((m) => (
            <div key={m.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeMember(m)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FEATURE_LIST.map((f) => {
                  const checked = !!m.permissions?.[f.key];
                  return (
                    <label key={f.key} className="flex items-start gap-2 rounded-md border p-2 cursor-pointer hover:bg-muted/50">
                      <Checkbox
                        checked={checked}
                        disabled={saving === m.id}
                        onCheckedChange={(v) => togglePermission(m, f.key, !!v)}
                      />
                      <div>
                        <div className="text-sm font-medium">{f.label}</div>
                        <div className="text-xs text-muted-foreground">{f.hint}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}