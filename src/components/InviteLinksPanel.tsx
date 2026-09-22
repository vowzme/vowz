// Personal RSVP invite links — owners create per-guest entries and copy tokenised URLs.
// Each link pre-fills the guest's name/email on the public RSVP form and blocks duplicate submissions
// via the `guest_invites` table + `submit_rsvp_by_invite` RPC on the server.

import { useEffect, useMemo, useState } from "react";
import { Copy, Link2, Loader2, Plus, Trash2, MessageCircle, Mail, Check, Send, Eye, MousePointerClick, X } from "lucide-react";
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
  guest_group: string | null;
  tags: string[] | null;
};

export const GROUP_SUGGESTIONS = ["Bride's side", "Groom's side", "Family", "Friends", "Colleagues"];
export const TAG_SUGGESTIONS = ["Sangeet only", "Out-of-town", "Kids", "VIP", "Reception only"];

const parseTags = (raw: string) =>
  Array.from(new Set(raw.split(",").map((t) => t.trim()).filter(Boolean).map((t) => t.slice(0, 40)))).slice(0, 12);


type SendStat = {
  email_sent: number;
  email_opened: boolean;
  email_clicked: boolean;
  email_failed: boolean;
  whatsapp_sent: number;
  last_message_id: string | null;
};

interface Props {
  siteId: string;
  siteSlug: string | null;
  coupleNames: string;
  /** Lets the parent page reuse groups/tags for list filters and broadcasts. */
  onInvitesChange?: (items: Array<{ guest_name: string; guest_email: string | null; guest_group: string | null; tags: string[] }>) => void;
}

export default function InviteLinksPanel({ siteId, siteSlug, coupleNames, onInvitesChange }: Props) {
  const [items, setItems] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ guest_name: "", guest_email: "", guest_phone: "", plus_ones_allowed: 0, guest_group: "", tags: "" });
  const [copied, setCopied] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, SendStat>>({});
  const [bulkEmailBusy, setBulkEmailBusy] = useState(false);
  const [waStep, setWaStep] = useState<{ open: boolean; queue: Invite[]; index: number }>({ open: false, queue: [], index: 0 });
  const [groupFilter, setGroupFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [editing, setEditing] = useState<{ id: string; guest_group: string; tags: string } | null>(null);

  const base = useMemo(() => (siteSlug ? `${window.location.origin}/site/${siteSlug}` : ""), [siteSlug]);
  const linkFor = (token: string) => (base ? `${base}?g=${encodeURIComponent(token)}` : "");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("guest_invites" as any)
      .select("id, guest_name, guest_email, guest_phone, plus_ones_allowed, token, rsvp_id, created_at, guest_group, tags")
      .eq("wedding_site_id", siteId)
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Couldn't load invites", description: error.message, variant: "destructive" });
    else {
      const list = ((data as any) || []) as Invite[];
      setItems(list);
      onInvitesChange?.(
        list.map((i) => ({ guest_name: i.guest_name, guest_email: i.guest_email, guest_group: i.guest_group ?? null, tags: i.tags ?? [] })),
      );
    }

    setLoading(false);
    void loadStats();
  };

  const loadStats = async () => {
    const { data: sends } = await supabase
      .from("guest_invite_sends" as any)
      .select("invite_id, channel, status, message_id, created_at")
      .eq("wedding_site_id", siteId)
      .order("created_at", { ascending: true });

    const acc: Record<string, SendStat> = {};
    const messageIds: string[] = [];
    for (const s of (sends as any[]) || []) {
      if (!acc[s.invite_id]) acc[s.invite_id] = { email_sent: 0, email_opened: false, email_clicked: false, email_failed: false, whatsapp_sent: 0, last_message_id: null };
      if (s.channel === "email") {
        if (s.status === "failed") acc[s.invite_id].email_failed = true;
        else acc[s.invite_id].email_sent++;
        if (s.message_id) { acc[s.invite_id].last_message_id = s.message_id; messageIds.push(s.message_id); }
      } else if (s.channel === "whatsapp") {
        acc[s.invite_id].whatsapp_sent++;
      }
    }

    if (messageIds.length) {
      const { data: events } = await supabase
        .from("email_ab_events" as any)
        .select("message_id, event_type")
        .in("message_id", messageIds);
      const openSet = new Set<string>();
      const clickSet = new Set<string>();
      for (const e of (events as any[]) || []) {
        if (e.event_type === "open") openSet.add(e.message_id);
        else if (e.event_type === "click") clickSet.add(e.message_id);
      }
      for (const invId of Object.keys(acc)) {
        const mid = acc[invId].last_message_id;
        if (mid) {
          if (openSet.has(mid)) acc[invId].email_opened = true;
          if (clickSet.has(mid)) acc[invId].email_clicked = true;
        }
      }
    }
    setStats(acc);
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
      guest_group: form.guest_group.trim().slice(0, 60) || null,
      tags: parseTags(form.tags),
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Couldn't add invite", description: error.message, variant: "destructive" }); return; }
    setForm({ guest_name: "", guest_email: "", guest_phone: "", plus_ones_allowed: 0, guest_group: form.guest_group, tags: "" });
    toast({ title: "Invite added" });
    void load();
  };

  const saveGrouping = async () => {
    if (!editing) return;
    const patch = {
      guest_group: editing.guest_group.trim().slice(0, 60) || null,
      tags: parseTags(editing.tags),
    };
    const { error } = await supabase.from("guest_invites" as any).update(patch as any).eq("id", editing.id);
    if (error) { toast({ title: "Couldn't save", description: error.message, variant: "destructive" }); return; }
    setEditing(null);
    void load();
  };


  const remove = async (id: string) => {
    if (!confirm("Delete this invite? The personal link will stop working.")) return;
    const { error } = await supabase.from("guest_invites" as any).delete().eq("id", id);
    if (error) toast({ title: "Couldn't delete", description: error.message, variant: "destructive" });
    else setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const bulkSendEmails = async () => {
    const targets = visible.filter((i) => !!i.guest_email && !i.rsvp_id);
    if (targets.length === 0) {
      toast({ title: "No pending email invites", description: "All email guests have already responded, or none have an email on file." });
      return;
    }
    if (!confirm(`Send invitation emails to ${targets.length} guest${targets.length === 1 ? "" : "s"}? Delivery and opens are tracked per recipient.`)) return;
    setBulkEmailBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-invite-emails", {
        body: { site_id: siteId, invite_ids: targets.map((t) => t.id) },
      });
      if (error) throw error;
      const r = data as { sent: number; failed: number; skipped: number };
      toast({
        title: `Queued ${r.sent} invite email${r.sent === 1 ? "" : "s"}`,
        description: r.failed || r.skipped ? `${r.failed} failed · ${r.skipped} skipped` : "Opens and clicks will show up on each row shortly.",
      });
      await loadStats();
    } catch (e: any) {
      toast({ title: "Couldn't send invites", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setBulkEmailBusy(false);
    }
  };

  const startWhatsAppWalker = () => {
    const queue = items.filter((i) => !i.rsvp_id);
    if (queue.length === 0) {
      toast({ title: "Nobody left to invite", description: "All guests on this list have already responded." });
      return;
    }
    setWaStep({ open: true, queue, index: 0 });
  };

  const logWhatsAppSent = async (inv: Invite) => {
    await supabase.from("guest_invite_sends" as any).insert({
      invite_id: inv.id,
      wedding_site_id: siteId,
      channel: "whatsapp",
      recipient: inv.guest_phone || null,
      status: "sent",
    } as any);
    void loadStats();
  };

  const sendCurrentWhatsApp = (advance: boolean) => {
    const inv = waStep.queue[waStep.index];
    if (!inv) return;
    const url = waLink(inv);
    void logWhatsAppSent(inv);
    // Open user's own WhatsApp — click gesture ensures popup allowed
    window.open(url, "_blank", "noopener,noreferrer");
    if (advance) {
      const next = waStep.index + 1;
      if (next >= waStep.queue.length) setWaStep({ open: false, queue: [], index: 0 });
      else setWaStep((s) => ({ ...s, index: next }));
    }
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

  const allGroups = useMemo(
    () => Array.from(new Set(items.map((i) => i.guest_group).filter(Boolean) as string[])).sort(),
    [items],
  );
  const allTags = useMemo(
    () => Array.from(new Set(items.flatMap((i) => i.tags ?? []))).sort(),
    [items],
  );
  const visible = useMemo(
    () =>
      items.filter((i) => {
        if (groupFilter !== "all" && (i.guest_group || "") !== groupFilter) return false;
        if (tagFilter !== "all" && !(i.tags ?? []).includes(tagFilter)) return false;
        return true;
      }),
    [items, groupFilter, tagFilter],
  );

  const responded = visible.filter((i) => i.rsvp_id).length;
  const emailPending = visible.filter((i) => i.guest_email && !i.rsvp_id).length;
  const waPending = visible.filter((i) => !i.rsvp_id).length;


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

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-xl bg-muted/40 border border-border/40">
          <Button size="sm" variant="gold" onClick={bulkSendEmails} disabled={bulkEmailBusy || emailPending === 0} title="Send invite email to everyone who hasn't responded">
            {bulkEmailBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
            Send emails ({emailPending})
          </Button>
          <Button size="sm" variant="outline" onClick={startWhatsAppWalker} disabled={waPending === 0} title="Open your WhatsApp with a pre-filled invite for each guest, one at a time">
            <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> WhatsApp all ({waPending})
          </Button>
          <p className="text-[11px] text-muted-foreground font-body ml-auto self-center">
            WhatsApp uses your own account. Emails are tracked for delivery & opens.
          </p>
        </div>
      )}

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
                {stats[inv.id] && (stats[inv.id].email_sent > 0 || stats[inv.id].whatsapp_sent > 0 || stats[inv.id].email_failed) && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {stats[inv.id].email_sent > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400" title="Emails sent">
                        <Mail className="w-3 h-3" /> {stats[inv.id].email_sent}
                      </span>
                    )}
                    {stats[inv.id].email_opened && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400" title="Guest opened the email">
                        <Eye className="w-3 h-3" /> Opened
                      </span>
                    )}
                    {stats[inv.id].email_clicked && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" title="Guest clicked the invite link">
                        <MousePointerClick className="w-3 h-3" /> Clicked
                      </span>
                    )}
                    {stats[inv.id].email_failed && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive" title="Delivery failed — try again">
                        Failed
                      </span>
                    )}
                    {stats[inv.id].whatsapp_sent > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" title="WhatsApp opened for this guest">
                        <MessageCircle className="w-3 h-3" /> {stats[inv.id].whatsapp_sent}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={() => copyLink(inv.token)} title="Copy personal link">
                  {copied === inv.token ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
                <Button size="sm" variant="outline" asChild title="Send on WhatsApp (opens your WhatsApp)" onClick={() => void logWhatsAppSent(inv)}>
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

      {waStep.open && waStep.queue[waStep.index] && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-card border border-border/50 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-display text-lg font-semibold">Send via your WhatsApp</h3>
                <p className="text-xs text-muted-foreground font-body">
                  Guest {waStep.index + 1} of {waStep.queue.length} — messages send from your own WhatsApp account.
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setWaStep({ open: false, queue: [], index: 0 })} aria-label="Close">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-3 rounded-lg border border-border/40 bg-muted/30 mb-3">
              <p className="font-body font-medium text-sm">{waStep.queue[waStep.index].guest_name}</p>
              <p className="text-xs text-muted-foreground font-body break-all">
                {waStep.queue[waStep.index].guest_phone || "No phone — WhatsApp will open the contact picker"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="gold" size="sm" onClick={() => sendCurrentWhatsApp(true)}>
                <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> Open WhatsApp & next
              </Button>
              <Button variant="outline" size="sm" onClick={() => sendCurrentWhatsApp(false)}>
                Open only
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const next = waStep.index + 1;
                  if (next >= waStep.queue.length) setWaStep({ open: false, queue: [], index: 0 });
                  else setWaStep((s) => ({ ...s, index: next }));
                }}
              >
                Skip
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground font-body mt-3">
              Each open is logged so you can see who you've already messaged.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}