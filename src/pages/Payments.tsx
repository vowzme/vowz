import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Receipt, Download, ArrowLeft, CreditCard, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/SEOHead";
import { toast } from "@/hooks/use-toast";

type Provider = "razorpay" | "paypal" | "dodo";

type Txn = {
  id: string;
  kind: "subscription" | "storage_addon";
  provider: Provider | string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  payment_id: string | null;
  order_id: string | null;
  created_at: string;
  refunded?: boolean;
  raw: any;
};

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  cancelled: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  refunded: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  expired: "bg-muted text-muted-foreground border-border",
  failed: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
};

function fmtMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "INR" }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function openReceipt(t: Txn, userEmail: string | null) {
  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Receipt ${t.payment_id || t.id}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:'Inter',system-ui,sans-serif;color:#0b1220;background:#f6f7fb;margin:0;padding:32px}
  .card{max-width:680px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,.06)}
  h1{font-family:'Playfair Display',Georgia,serif;color:#001F3F;margin:0 0 4px;font-size:28px}
  .muted{color:#64748b;font-size:13px}
  .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px dashed #e2e8f0;font-size:14px}
  .row:last-child{border-bottom:0}
  .label{color:#64748b}
  .value{font-weight:600;color:#0f172a}
  .total{margin-top:20px;padding:16px 20px;background:#001F3F;color:#F5F5DC;border-radius:12px;display:flex;justify-content:space-between;align-items:center}
  .total .amt{font-size:22px;font-weight:700;color:#D4AF37}
  .brand{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
  .brand small{color:#94a3b8}
  .status{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;background:#ecfdf5;color:#047857}
  .foot{margin-top:24px;text-align:center;color:#94a3b8;font-size:12px}
  @media print{body{background:#fff;padding:0}.card{box-shadow:none;padding:24px}.noprint{display:none}}
  .actions{max-width:680px;margin:16px auto 0;text-align:right}
  button{background:#D4AF37;color:#001F3F;border:0;padding:10px 18px;border-radius:8px;font-weight:600;cursor:pointer}
</style></head><body>
<div class="card">
  <div class="brand">
    <div>
      <h1>Payment Receipt</h1>
      <div class="muted">vowz.me · Wedding invitations & RSVP</div>
    </div>
    <div style="text-align:right"><span class="status">${t.status}</span><br/><small class="muted">${format(new Date(t.created_at), "dd MMM yyyy, HH:mm")}</small></div>
  </div>
  <div class="row"><span class="label">Receipt No.</span><span class="value">${t.payment_id || t.order_id || t.id}</span></div>
  <div class="row"><span class="label">Provider</span><span class="value">${t.provider === "paypal" ? "PayPal" : t.provider === "razorpay" ? "Razorpay" : t.provider === "dodo" ? "Dodo Payments" : t.provider}</span></div>
  <div class="row"><span class="label">Description</span><span class="value">${t.description}</span></div>
  <div class="row"><span class="label">Billed to</span><span class="value">${userEmail || "—"}</span></div>
  ${t.order_id ? `<div class="row"><span class="label">Order ID</span><span class="value">${t.order_id}</span></div>` : ""}
  ${t.payment_id ? `<div class="row"><span class="label">Payment ID</span><span class="value">${t.payment_id}</span></div>` : ""}
  <div class="total"><span>Total paid</span><span class="amt">${fmtMoney(t.amount, t.currency)}</span></div>
  <div class="foot">Thank you for using vowz.me. This is a system-generated receipt.</div>
</div>
<div class="actions noprint"><button onclick="window.print()">Download / Print PDF</button></div>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) {
    toast({ title: "Popup blocked", description: "Allow pop-ups to view the receipt.", variant: "destructive" });
    return;
  }
  w.document.write(html);
  w.document.close();
}

export default function Payments() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | Provider>("all");

  async function load() {
    if (!user) return;
    setLoading(true);
    const [s, a, r] = await Promise.all([
      supabase.from("user_subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("user_storage_addons").select("*").eq("user_id", user.id).order("purchased_at", { ascending: false }),
      supabase.from("razorpay_refunds").select("razorpay_payment_id,status").eq("user_id", user.id),
    ]);
    setSubs(s.data || []);
    setAddons(a.data || []);
    setRefunds(r.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const txns: Txn[] = useMemo(() => {
    const refundMap = new Map(refunds.map((r) => [r.razorpay_payment_id, r.status]));
    const subTx: Txn[] = subs.map((s) => ({
      id: s.id,
      kind: "subscription",
      provider: s.provider,
      description: `${s.plan.replace(/_/g, " ")} subscription`,
      amount: Number(s.amount_paid || 0),
      currency: s.currency,
      status: s.status,
      payment_id: s.payment_id,
      order_id: s.payment_order_id,
      created_at: s.created_at,
      refunded: refundMap.get(s.payment_id) === "processed",
      raw: s,
    }));
    const addonTx: Txn[] = addons.map((a) => ({
      id: a.id,
      kind: "storage_addon",
      provider: a.payment_id?.startsWith?.("PAYPAL:")
        ? "paypal"
        : a.payment_id?.startsWith?.("DODO:")
          ? "dodo"
          : "razorpay",
      description: `Storage add-on · ${(a.bytes_added / (1024 * 1024 * 1024)).toFixed(1)} GB`,
      amount: Number(a.amount_paid || 0),
      currency: a.currency,
      status: a.status,
      payment_id: a.payment_id,
      order_id: a.payment_order_id,
      created_at: a.purchased_at || a.created_at,
      raw: a,
    }));
    const merged = [...subTx, ...addonTx].sort(
      (x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime()
    );
    if (filter === "all") return merged;
    return merged.filter((t) => t.provider === filter);
  }, [subs, addons, refunds, filter]);

  const totals = useMemo(() => {
    const byCur: Record<string, number> = {};
    txns.forEach((t) => {
      if (t.status === "active" || t.status === "completed") {
        byCur[t.currency] = (byCur[t.currency] || 0) + t.amount;
      }
    });
    return byCur;
  }, [txns]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Payments & receipts · vowz.me" description="View your Razorpay, PayPal and Dodo Payments transaction history and download receipts." />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Dashboard</Link>
            </Button>
            <div>
              <h1 className="font-display text-3xl text-navy dark:text-ivory">Payments & receipts</h1>
              <p className="text-sm text-muted-foreground">Your Razorpay, PayPal and Dodo Payments transactions across subscriptions and storage add-ons.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
          </Button>
        </div>

        {Object.keys(totals).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="border rounded-xl p-4 bg-card">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Successful spend</div>
              <div className="mt-1 text-2xl font-semibold text-navy dark:text-ivory">
                {Object.entries(totals).map(([c, v]) => (
                  <div key={c}>{fmtMoney(v, c)}</div>
                ))}
              </div>
            </div>
            <div className="border rounded-xl p-4 bg-card">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Transactions</div>
              <div className="mt-1 text-2xl font-semibold text-navy dark:text-ivory">{txns.length}</div>
            </div>
            <div className="border rounded-xl p-4 bg-card">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Active items</div>
              <div className="mt-1 text-2xl font-semibold text-navy dark:text-ivory">
                {txns.filter((t) => t.status === "active" || t.status === "completed").length}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {(["all", "razorpay", "paypal", "dodo"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "all" ? "All providers" : f === "razorpay" ? "Razorpay" : f === "paypal" ? "PayPal" : "Dodo"}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="py-24 flex justify-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>
        ) : txns.length === 0 ? (
          <div className="border rounded-xl p-12 text-center bg-card">
            <CreditCard className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <div className="font-medium">No transactions yet</div>
            <p className="text-sm text-muted-foreground mt-1">Your Razorpay, PayPal and Dodo Payments will show up here.</p>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden bg-card">
            <div className="hidden md:grid grid-cols-[1.6fr_0.9fr_0.9fr_0.8fr_auto] gap-4 px-5 py-3 text-xs uppercase tracking-wide text-muted-foreground bg-muted/30 border-b">
              <div>Description</div><div>Provider</div><div>Amount</div><div>Status</div><div className="text-right">Receipt</div>
            </div>
            {txns.map((t) => {
              const tone = STATUS_TONE[t.refunded ? "refunded" : t.status] || "bg-muted text-muted-foreground border-border";
              return (
                <div key={`${t.kind}-${t.id}`} className="grid grid-cols-1 md:grid-cols-[1.6fr_0.9fr_0.9fr_0.8fr_auto] gap-2 md:gap-4 px-5 py-4 border-b last:border-0 items-center">
                  <div>
                    <div className="font-medium capitalize">{t.description}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(t.created_at), "dd MMM yyyy · HH:mm")}
                      {t.payment_id && <> · <span className="font-mono">{t.payment_id.slice(0, 24)}</span></>}
                    </div>
                  </div>
                  <div className="text-sm capitalize">{t.provider}</div>
                  <div className="text-sm font-semibold">{fmtMoney(t.amount, t.currency)}</div>
                  <div>
                    <Badge variant="outline" className={`${tone} capitalize`}>{t.refunded ? "refunded" : t.status}</Badge>
                  </div>
                  <div className="md:text-right">
                    <Button size="sm" variant="outline" onClick={() => openReceipt(t, user?.email || null)} disabled={!t.payment_id && t.status !== "active" && t.status !== "completed"}>
                      <Receipt className="w-4 h-4 mr-1" />Receipt
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-6">
          Need a GST invoice or refund? <Link to="/contact" className="underline">Contact support</Link>. Refund status shown here reflects the latest webhook update from Razorpay, PayPal or Dodo Payments.
        </p>
      </div>
    </div>
  );
}