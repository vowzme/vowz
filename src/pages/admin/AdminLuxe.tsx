import { useEffect, useState } from "react";
import { Crown, Loader2, Search, Plus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

interface Row {
  id: string;
  user_id: string;
  amount_paid: number;
  currency: string;
  provider: string;
  status: string;
  purchased_at: string;
  email?: string;
  name?: string;
  sites?: number;
  cards?: number;
}

export default function AdminLuxe() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [grantEmail, setGrantEmail] = useState("");
  const [granting, setGranting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: unlocks } = await (supabase as any)
      .from("user_luxe_unlocks")
      .select("*")
      .order("purchased_at", { ascending: false });
    const list: Row[] = (unlocks ?? []) as Row[];
    const ids = list.map((r) => r.user_id);
    if (ids.length) {
      const [{ data: profiles }, { data: sites }, { data: cards }] = await Promise.all([
        (supabase as any).from("profiles").select("id,email,full_name").in("id", ids),
        (supabase as any).from("wedding_sites").select("id,user_id").in("user_id", ids),
        (supabase as any).from("invitation_card_variants").select("id,user_id").in("user_id", ids),
      ]);
      const pm = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      for (const r of list) {
        const p: any = pm.get(r.user_id);
        r.email = p?.email;
        r.name = p?.full_name;
        r.sites = (sites ?? []).filter((s: any) => s.user_id === r.user_id).length;
        r.cards = (cards ?? []).filter((c: any) => c.user_id === r.user_id).length;
      }
    }
    setRows(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const grant = async () => {
    const email = grantEmail.trim().toLowerCase();
    if (!email) return;
    setGranting(true);
    try {
      const { data: profile } = await (supabase as any)
        .from("profiles").select("id").eq("email", email).maybeSingle();
      if (!profile) {
        toast({ title: "No account with that email", variant: "destructive" });
        return;
      }
      const { error } = await (supabase as any).from("user_luxe_unlocks").insert({
        user_id: profile.id, provider: "admin_grant", amount_paid: 0, currency: "INR", status: "active",
      });
      if (error) throw error;
      toast({ title: "LUXE granted", description: email });
      setGrantEmail("");
      load();
    } catch (e: any) {
      toast({ title: "Could not grant LUXE", description: e?.message, variant: "destructive" });
    } finally {
      setGranting(false);
    }
  };

  const revoke = async (r: Row) => {
    const { error } = await (supabase as any)
      .from("user_luxe_unlocks").update({ status: "revoked" }).eq("id", r.id);
    if (error) {
      toast({ title: "Could not revoke", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "LUXE access revoked", description: r.email });
    load();
  };

  const filtered = rows.filter((r) =>
    !q.trim() || `${r.email ?? ""} ${r.name ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()));
  const active = rows.filter((r) => r.status === "active");
  const revenueInr = active.filter((r) => r.currency === "INR").reduce((s, r) => s + Number(r.amount_paid || 0), 0);
  const revenueUsd = active.filter((r) => r.currency !== "INR").reduce((s, r) => s + Number(r.amount_paid || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Crown className="w-6 h-6 text-gold" />
          <h1 className="font-display text-2xl font-bold">LUXE couples</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border/60 p-4">
            <p className="text-xs text-muted-foreground font-body">Active unlocks</p>
            <p className="font-display text-2xl font-bold">{active.length}</p>
          </div>
          <div className="rounded-xl border border-border/60 p-4">
            <p className="text-xs text-muted-foreground font-body">Revenue (India)</p>
            <p className="font-display text-2xl font-bold">₹{revenueInr.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border/60 p-4">
            <p className="text-xs text-muted-foreground font-body">Revenue (International)</p>
            <p className="font-display text-2xl font-bold">${revenueUsd.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 p-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs font-body text-muted-foreground">Grant LUXE to an account</label>
            <Input value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} placeholder="couple@email.com" />
          </div>
          <Button onClick={grant} disabled={granting}>
            {granting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Grant
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by email or name" />
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
        ) : filtered.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground py-10 text-center">No LUXE couples yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-sm font-body">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="p-3">Couple</th>
                  <th className="p-3">Paid</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Sites / Cards</th>
                  <th className="p-3">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border/50">
                    <td className="p-3">
                      <p className="font-medium">{r.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{r.email}</p>
                    </td>
                    <td className="p-3">{r.currency === "INR" ? "₹" : "$"}{Number(r.amount_paid).toLocaleString()}</td>
                    <td className="p-3 capitalize">{r.provider.replace("_", " ")}</td>
                    <td className="p-3">{new Date(r.purchased_at).toLocaleDateString()}</td>
                    <td className="p-3">{r.sites ?? 0} / {r.cards ?? 0}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "active" ? "bg-emerald/15 text-emerald" : "bg-muted text-muted-foreground"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {r.status === "active" && (
                        <Button size="sm" variant="ghost" onClick={() => revoke(r)}>
                          <XCircle className="w-4 h-4" /> Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
