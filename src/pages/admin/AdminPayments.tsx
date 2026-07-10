import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { CreditCard, IndianRupee, Wallet, Receipt, TrendingUp, Users, Search, Webhook, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface PaymentProvider {
  id: string;
  provider: string;
  is_enabled: boolean;
  config: Record<string, string>;
}

interface PaymentRecord {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  amount_paid: number;
  currency: string;
  provider: string;
  payment_id: string | null;
  payment_order_id: string | null;
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

interface WebhookEvent {
  id: string;
  received_at: string;
  event_type: string | null;
  razorpay_event_id: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  signature_valid: boolean;
  processed: boolean;
  status_code: number;
  error: string | null;
  payload: any;
}

const providerMeta: Record<string, { label: string; icon: React.ElementType; fields: { key: string; label: string; type?: string }[] }> = {
  razorpay: {
    label: "Razorpay",
    icon: IndianRupee,
    fields: [
      { key: "key_id", label: "Key ID" },
      { key: "key_secret", label: "Key Secret", type: "password" },
    ],
  },
  phonepe: {
    label: "PhonePe",
    icon: Wallet,
    fields: [
      { key: "merchant_id", label: "Merchant ID" },
      { key: "salt_key", label: "Salt Key", type: "password" },
      { key: "salt_index", label: "Salt Index" },
    ],
  },
  paypal: {
    label: "PayPal",
    icon: CreditCard,
    fields: [
      { key: "client_id", label: "Client ID" },
      { key: "client_secret", label: "Client Secret", type: "password" },
      { key: "mode", label: "Mode (sandbox/live)" },
    ],
  },
};

// ─── Date Range Presets ────────────────────────────────────────────────
type DateRange = "7d" | "30d" | "90d" | "all";
function getDateRangeStart(range: DateRange): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export default function AdminPayments() {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Payment history state
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [searchQuery, setSearchQuery] = useState("");

  // Webhook events state
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [webhookLoading, setWebhookLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const fetchWebhookEvents = async () => {
    setWebhookLoading(true);
    const { data } = await supabase
      .from("razorpay_webhook_events" as any)
      .select("*")
      .order("received_at", { ascending: false })
      .limit(100);
    setWebhookEvents((data as any) ?? []);
    setWebhookLoading(false);
  };

  useEffect(() => {
    fetchWebhookEvents();
  }, []);

  const webhookStats = useMemo(() => {
    const total = webhookEvents.length;
    const sigFail = webhookEvents.filter((e) => !e.signature_valid).length;
    const procFail = webhookEvents.filter((e) => e.signature_valid && !e.processed).length;
    const ok = webhookEvents.filter((e) => e.signature_valid && e.processed).length;
    const last = webhookEvents[0];
    return { total, sigFail, procFail, ok, last };
  }, [webhookEvents]);

  useEffect(() => {
    const fetchProviders = async () => {
      const { data } = await supabase
        .from("payment_config")
        .select("*")
        .order("provider");
      setProviders((data as any[]) ?? []);
      setLoading(false);
    };

    const fetchPayments = async () => {
      setPaymentsLoading(true);
      // Fetch subscriptions
      const { data: subs } = await supabase
        .from("user_subscriptions" as any)
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch profiles for user names/emails
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      const enriched: PaymentRecord[] = ((subs as any[]) || []).map((s) => {
        const profile = profileMap.get(s.user_id);
        return {
          ...s,
          user_email: profile?.email || "",
          user_name: profile?.full_name || "",
        };
      });

      setPayments(enriched);
      setPaymentsLoading(false);
    };

    fetchProviders();
    fetchPayments();
  }, []);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    let result = payments;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Date range filter
    const rangeStart = getDateRangeStart(dateRange);
    if (rangeStart) {
      result = result.filter((p) => p.created_at >= rangeStart);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.user_email || "").toLowerCase().includes(q) ||
          (p.user_name || "").toLowerCase().includes(q) ||
          (p.payment_order_id || "").toLowerCase().includes(q) ||
          (p.payment_id || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [payments, statusFilter, dateRange, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const totalRevenue = filteredPayments
      .filter((p) => p.status === "active")
      .reduce((sum, p) => sum + Number(p.amount_paid), 0);
    const activeCount = filteredPayments.filter((p) => p.status === "active").length;
    const pendingCount = filteredPayments.filter((p) => p.status === "pending").length;
    const totalCount = filteredPayments.length;
    return { totalRevenue, activeCount, pendingCount, totalCount };
  }, [filteredPayments]);

  const updateField = (providerId: string, key: string, value: string) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? { ...p, config: { ...p.config, [key]: value } }
          : p
      )
    );
  };

  const toggleEnabled = (providerId: string) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId ? { ...p, is_enabled: !p.is_enabled } : p
      )
    );
  };

  const saveProvider = async (provider: PaymentProvider) => {
    setSaving(provider.id);
    const { error } = await supabase
      .from("payment_config")
      .update({
        is_enabled: provider.is_enabled,
        config: provider.config as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", provider.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `${provider.provider} config updated.` });
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">Payments</h1>
      <p className="font-body text-muted-foreground mb-6">
        Payment history and gateway configuration.
      </p>

      <Tabs defaultValue="history" className="space-y-6">
        <TabsList className="bg-card border border-border/50">
          <TabsTrigger value="history" className="font-body text-sm">
            <Receipt className="w-4 h-4 mr-1.5" /> Payment History
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="font-body text-sm">
            <Webhook className="w-4 h-4 mr-1.5" /> Webhooks
          </TabsTrigger>
          <TabsTrigger value="gateways" className="font-body text-sm">
            <CreditCard className="w-4 h-4 mr-1.5" /> Gateways
          </TabsTrigger>
        </TabsList>

        {/* ─── Payment History Tab ─── */}
        <TabsContent value="history">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald" />
                  <span className="font-body text-xs text-muted-foreground">Total Revenue</span>
                </div>
                <p className="font-display text-xl font-bold text-foreground">
                  ₹{stats.totalRevenue.toLocaleString("en-IN")}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-gold" />
                  <span className="font-body text-xs text-muted-foreground">Active</span>
                </div>
                <p className="font-display text-xl font-bold text-foreground">{stats.activeCount}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Receipt className="w-4 h-4 text-muted-foreground" />
                  <span className="font-body text-xs text-muted-foreground">Pending</span>
                </div>
                <p className="font-display text-xl font-bold text-foreground">{stats.pendingCount}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <IndianRupee className="w-4 h-4 text-muted-foreground" />
                  <span className="font-body text-xs text-muted-foreground">Total</span>
                </div>
                <p className="font-display text-xl font-bold text-foreground">{stats.totalCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 font-body text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] font-body text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              {(["7d", "30d", "90d", "all"] as DateRange[]).map((r) => (
                <Button
                  key={r}
                  variant={dateRange === r ? "default" : "outline"}
                  size="sm"
                  className={`font-body text-xs h-8 ${dateRange === r ? "bg-gold text-primary-foreground hover:bg-gold/90" : ""}`}
                  onClick={() => setDateRange(r)}
                >
                  {r === "all" ? "All" : r === "7d" ? "7 days" : r === "30d" ? "30 days" : "90 days"}
                </Button>
              ))}
            </div>
          </div>

          {/* Payments Table */}
          <Card className="border-border/50">
            <CardContent className="p-0">
              {paymentsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-body text-sm text-muted-foreground">No payments found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-body text-xs">User</TableHead>
                        <TableHead className="font-body text-xs">Order ID</TableHead>
                        <TableHead className="font-body text-xs">Plan</TableHead>
                        <TableHead className="font-body text-xs">Amount</TableHead>
                        <TableHead className="font-body text-xs">Status</TableHead>
                        <TableHead className="font-body text-xs">Provider</TableHead>
                        <TableHead className="font-body text-xs">Date</TableHead>
                        <TableHead className="font-body text-xs">Expires</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-body text-sm">
                            <div>
                              <p className="font-medium text-foreground truncate max-w-[160px]">
                                {p.user_name || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                                {p.user_email || "—"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-[11px] text-muted-foreground">
                            {p.payment_order_id ? p.payment_order_id.slice(-12) : "—"}
                          </TableCell>
                          <TableCell className="font-body text-xs capitalize">
                            {(p.plan || "").replace(/_/g, " ")}
                          </TableCell>
                          <TableCell className="font-display text-sm font-semibold">
                            {p.amount_paid > 0 ? `₹${Number(p.amount_paid).toLocaleString("en-IN")}` : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`font-body text-[10px] ${
                                p.status === "active"
                                  ? "bg-emerald/15 text-emerald border-emerald/30"
                                  : p.status === "pending"
                                  ? "bg-gold/15 text-gold border-gold/30"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-body text-xs text-muted-foreground capitalize">
                            {p.provider}
                          </TableCell>
                          <TableCell className="font-body text-xs text-muted-foreground">
                            {p.started_at
                              ? format(new Date(p.started_at), "dd MMM yyyy")
                              : p.created_at
                              ? format(new Date(p.created_at), "dd MMM yyyy")
                              : "—"}
                          </TableCell>
                          <TableCell className="font-body text-xs text-muted-foreground">
                            {p.expires_at ? format(new Date(p.expires_at), "dd MMM yyyy") : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Gateways Tab ─── */}
        <TabsContent value="gateways">
          <div className="grid gap-6">
            {providers.map((p) => {
              const meta = providerMeta[p.provider];
              if (!meta) return null;
              const Icon = meta.icon;

              return (
                <Card key={p.id} className={`border-border/50 ${p.is_enabled ? "ring-1 ring-[hsl(var(--gold))]/30" : ""}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <CardTitle className="font-display text-lg">{meta.label}</CardTitle>
                          <CardDescription className="font-body text-xs">
                            {p.provider === "razorpay" && "UPI, Cards, Netbanking — India"}
                            {p.provider === "phonepe" && "UPI payments — India"}
                            {p.provider === "paypal" && "International cards & PayPal"}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={p.is_enabled ? "default" : "outline"} className={p.is_enabled ? "bg-emerald/20 text-emerald border-emerald/30" : ""}>
                          {p.is_enabled ? "Active" : "Disabled"}
                        </Badge>
                        <Switch checked={p.is_enabled} onCheckedChange={() => toggleEnabled(p.id)} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {meta.fields.map((f) => (
                        <div key={f.key} className="space-y-1.5">
                          <Label className="font-body text-sm">{f.label}</Label>
                          <Input
                            type={f.type ?? "text"}
                            value={p.config[f.key] ?? ""}
                            onChange={(e) => updateField(p.id, f.key, e.target.value)}
                            placeholder={`Enter ${f.label.toLowerCase()}`}
                            className="font-body"
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => saveProvider(p)}
                      disabled={saving === p.id}
                    >
                      {saving === p.id ? "Saving..." : "Save Configuration"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
