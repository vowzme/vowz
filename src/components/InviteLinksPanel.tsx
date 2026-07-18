// Personal RSVP invite links — owners create per-guest entries and copy tokenised URLs.
// Each link pre-fills the guest's name/email on the public RSVP form and blocks duplicate submissions
// via the `guest_invites` table + `submit_rsvp_by_invite` RPC on the server.

import { useEffect, useMemo, useState } from "react";
import { Copy, Link2, Loader2, Plus, Trash2, MessageCircle, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Invite = {
  id: string;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  plus_ones_allowed: number;
  token: string;
  rsvp_id: string | null;
  created_at: string;
};

interface Props {
  siteId: string;
  siteSlug: string | null;
  coupleNames: string;
}

export default function InviteLinksPanel({ siteId, siteSlug, coupleNames }: Props) {
  const [items, setItems] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ guest_name: "", guest_email: "", guest_phone: "", plus_ones_allowed: 0 });
  const [copied, setCopied] = useState<string | null>(null);

  const base = useMemo(() => (siteSlug ? `${window.location.origin}/site/${siteSlug}` : ""), [siteSlug]);
  const linkFor = (token: string) => (base ? `${base}?g=${encodeURIComponent(token)}` : "");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("guest_invites" as any)
      .select("id, guest_name, guest_email, guest_phone, plus_ones_allowed, token, rsvp_id, created_at")
      .eq("wedding_site_id", siteId)
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Couldn't load invites", description: error.message, variant: "destructive" });
    else setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { if (siteId) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [siteId]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.guest_name.trim();
    if (!name) return;
    setSaving(true);
    const { error } = await supabase.from("guest_invites" as any).insert({
      wedding_site_id: siteId,
      guest_name: name.slice(0, 120),
      guest_email: form.guest_email.trim().slice(0, 254) || null,
      guest_phone: form.guest_phone.trim().slice(0, 40) || null,
      plus_ones_allowed: Math.max(0, Math.min(20, Number(form.plus_ones_allowed) || 0)),
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Couldn't add invite", description: error.message, variant: "destructive" }); return; }
    setForm({ guest_name: "", guest_email: "", guest_phone: "", plus_ones_allowed: 0 });
    toast({ title: "Invite added" });
    void load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this invite? The personal link will stop working.")) return;
    const { error } = await supabase.from("guest_invites" as any).delete().eq("id", id);
    if (error) toast({ title: "Couldn't delete", description: error.message, variant: "destructive" });
    else setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const copyLink = async (token: string) => {
    const url = linkFor(token);
    if (!url) return;
    try { await navigator.clipboard.writeText(url); } catch {}
    setCopied(token);
    toast({ title: "Link copied", description: "Paste into WhatsApp, SMS, or email." });
    setTimeout(() => setCopied((c) => (c === token ? null : c)), 1500);
  };

  const waLink = (inv: Invite) => {
    const url = linkFor(inv.token);
    const text = `Hi ${inv.guest_name}, you're invited to ${coupleNames}'s wedding. Please RSVP here: ${url}`;
    const phone = (inv.guest_phone || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
    return phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const mailLink = (inv: Invite) => {
    if (!inv.guest_email) return "";
    const url = linkFor(inv.token);
    const subject = `You're invited — ${coupleNames}`;
    const body = `Hi ${inv.guest_name},\n\nWe'd love to have you celebrate with us. Please RSVP using your personal link:\n${url}\n\nWith love,\n${coupleNames}`;
    return `mailto:${encodeURIComponent(inv.guest_email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const responded = items.filter((i) => i.rsvp_id).length;

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-gold" />
          <h2 className="font-display text-lg font-semibold">Personal invite links</h2>
        </div>
        <p className="text-xs text-muted-foreground font-body">
          {items.length} invited · {responded} responded
        </p>
      </div>
      <p className="text-sm text-muted-foreground font-body mb-4">
        Each guest gets a unique link that pre-fills their name and caps their plus-ones — one RSVP per invite, no duplicates.
      </p>

      <form onSubmit={create} className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-4">
        <Input placeholder="Guest name" value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} required maxLength={120} className="sm:col-span-2" />
        <Input type="email" placeholder="Email (optional)" value={form.guest_email} onChange={(e) => setForm({ ...form, guest_email: e.target.value })} maxLength={254} />
        <Input placeholder="Phone (optional)" value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} maxLength={40} />
        <div className="flex gap-2">
          <Input
            type="number"
            min={0}
            max={20}
            value={form.plus_ones_allowed}
            onChange={(e) => setForm({ ...form, plus_ones_allowed: parseInt(e.target.value) || 0 })}
            title="Plus-ones allowed"
            className="w-20"
          />
          <Button type="submit" variant="gold" size="sm" disabled={saving || !form.guest_name.trim()} className="flex-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Add</>}
          </Button>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body text-center py-6">
          No invites yet — add your first guest above.
        </p>
      ) : (
        <div className="divide-y divide-border/40">
          {items.map((inv) => (
            <div key={inv.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-body font-medium text-sm truncate">{inv.guest_name}</span>
                  {inv.plus_ones_allowed > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border/50 text-muted-foreground">
                      +{inv.plus_ones_allowed}
                    </span>
                  )}
                  {inv.rsvp_id && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      Responded
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-body truncate">
                  {[inv.guest_email, inv.guest_phone].filter(Boolean).join(" · ") || "No contact info"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={() => copyLink(inv.token)} title="Copy personal link">
                  {copied === inv.token ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
                <Button size="sm" variant="outline" asChild title="Send on WhatsApp">
                  <a href={waLink(inv)} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-3.5 h-3.5" /></a>
                </Button>
                {inv.guest_email && (
                  <Button size="sm" variant="outline" asChild title="Send by email">
                    <a href={mailLink(inv)}><Mail className="w-3.5 h-3.5" /></a>
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => remove(inv.id)} title="Delete invite">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}