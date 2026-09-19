import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { downloadCsv } from "@/lib/csv";
import {
  Plus, Search, Ticket, TrendingUp, Download, RefreshCw, Copy,
  Pencil, Trash2, Pause, Play, Archive, History,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type Redemption = {
  id: string;
  coupon_id: string;
  user_id: string;
  discount_applied: number;
  currency: string;
  original_amount: number;
  final_amount: number;
  created_at: string;
  coupon_code?: string;
  user_email?: string;
};

type Coupon = {
  id: string; code: string; name: string; description: string;
  discount_type: string; discount_value: number; currency: string;
  scope: string; usage_type: string; max_uses: number | null;
  times_used: number; min_order_value: number | null;
  max_discount_cap: number | null; status: string;
  expires_at: string | null; notes: string;
  created_at: string; updated_at: string;
};

const empty: Partial<Coupon> = {
  code: "", name: "", description: "", discount_type: "percentage",
  discount_value: 0, currency: "INR", scope: "global",
  usage_type: "unlimited", max_uses: null, min_order_value: null,
  max_discount_cap: null, status: "active", expires_at: null, notes: "",
};

const statusColor: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  paused: "bg-amber-500/10 text-amber-700 border-amber-200",
  expired: "bg-red-500/10 text-red-700 border-red-200",
  archived: "bg-muted text-muted-foreground border-border",
};

const generateCode = (len = 10) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterScope, setFilterScope] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<Partial<Coupon>>(empty);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const pageSize = 15;
  const [activeTab, setActiveTab] = useState("coupons");

  // Redemptions state
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);
  const [redemptionSearch, setRedemptionSearch] = useState("");
  const [redemptionPage, setRedemptionPage] = useState(0);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setCoupons(data as unknown as Coupon[]);
    setLoading(false);
  };

  const fetchRedemptions = async () => {
    setRedemptionsLoading(true);
    const { data, error } = await supabase
      .from("coupon_redemptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Enrich with coupon codes and user emails
      const couponMap = new Map(coupons.map(c => [c.id, c.code]));
      
      // Fetch user emails for all unique user_ids
      const userIds = [...new Set((data as any[]).map(r => r.user_id))];
      let emailMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", userIds);
        if (profiles) {
          emailMap = new Map(profiles.map((p: any) => [p.id, p.email]));
        }
      }

      setRedemptions((data as any[]).map(r => ({
        ...r,
        coupon_code: couponMap.get(r.coupon_id) || r.coupon_id.slice(0, 8),
        user_email: emailMap.get(r.user_id) || r.user_id.slice(0, 8),
      })));
    }
    setRedemptionsLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  useEffect(() => {
    if (activeTab === "redemptions" && coupons.length > 0) {
      fetchRedemptions();
    }
  }, [activeTab, coupons]);

  const filtered = useMemo(() => {
    let list = coupons;
    if (filterStatus !== "all") list = list.filter(c => c.status === filterStatus);
    if (filterScope !== "all") list = list.filter(c => c.scope === filterScope);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
    }
    return list;
  }, [coupons, filterStatus, filterScope, search]);

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  // Stats
  const activeCoupons = coupons.filter(c => c.status === "active").length;
  const totalRedemptions = coupons.reduce((s, c) => s + c.times_used, 0);
  const topCoupon = [...coupons].sort((a, b) => b.times_used - a.times_used)[0];

  const openCreate = () => { setEditing(null); setForm({ ...empty, code: generateCode() }); setDialogOpen(true); };
  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      ...c,
      expires_at: c.expires_at ? new Date(c.expires_at).toISOString().slice(0, 16) : null,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discount_value) {
      toast({ title: "Missing fields", description: "Code and discount value are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload: any = {
      code: form.code!.toUpperCase().trim(),
      name: form.name || "",
      description: form.description || "",
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      currency: form.discount_type === "fixed" ? form.currency : "INR",
      scope: form.scope,
      usage_type: form.usage_type,
      max_uses: form.usage_type === "limited" ? Number(form.max_uses) || 1 : form.usage_type === "one_time" ? 1 : null,
      min_order_value: form.min_order_value ? Number(form.min_order_value) : null,
      max_discount_cap: form.max_discount_cap ? Number(form.max_discount_cap) : null,
      status: form.status || "active",
      expires_at: form.expires_at ? new Date(form.expires_at as string).toISOString() : null,
      notes: form.notes || "",
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("coupons").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("coupons").insert(payload));
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editing ? "Coupon updated" : "Coupon created" });
      setDialogOpen(false);
      fetchCoupons();
    }
    setSaving(false);
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon permanently?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    fetchCoupons();
  };

  const bulkAction = async (action: string) => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    if (action === "delete") {
      if (!confirm(`Delete ${ids.length} coupon(s)?`)) return;
      await supabase.from("coupons").delete().in("id", ids);
    } else {
      await supabase.from("coupons").update({ status: action }).in("id", ids);
    }
    setSelected(new Set());
    fetchCoupons();
  };

  const exportCSV = () => {
    const headers = ["Code", "Name", "Type", "Value", "Scope", "Status", "Used", "Max Uses", "Expires"];
    const rows = filtered.map(c => [
      c.code, c.name, c.discount_type, c.discount_value, c.scope,
      c.status, c.times_used, c.max_uses ?? "∞",
      c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never",
    ]);
    downloadCsv("coupons.csv", [headers, ...rows]);
  };

  const exportRedemptionsCSV = () => {
    const headers = ["Date", "Coupon Code", "User Email", "Original", "Discount", "Final", "Currency"];
    const rows = filteredRedemptions.map(r => [
      new Date(r.created_at).toLocaleString(), r.coupon_code, r.user_email,
      r.original_amount, r.discount_applied, r.final_amount, r.currency,
    ]);
    downloadCsv("coupon-redemptions.csv", [headers, ...rows]);
  };

  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const toggleAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map(c => c.id)));
  };

  const setField = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const filteredRedemptions = useMemo(() => {
    if (!redemptionSearch) return redemptions;
    const q = redemptionSearch.toLowerCase();
    return redemptions.filter(r =>
      (r.coupon_code || "").toLowerCase().includes(q) ||
      (r.user_email || "").toLowerCase().includes(q)
    );
  }, [redemptions, redemptionSearch]);

  const redemptionPaged = filteredRedemptions.slice(redemptionPage * pageSize, (redemptionPage + 1) * pageSize);
  const redemptionTotalPages = Math.ceil(filteredRedemptions.length / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">Coupon Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={activeTab === "redemptions" ? exportRedemptionsCSV : exportCSV}>
            <Download className="w-4 h-4 mr-1" />Export
          </Button>
          <Button variant="outline" size="sm" onClick={activeTab === "redemptions" ? fetchRedemptions : fetchCoupons}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          {activeTab === "coupons" && (
            <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />New Coupon</Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground">Active Coupons</CardTitle>
            <Ticket className="h-5 w-5 text-[hsl(var(--gold))]" />
          </CardHeader>
          <CardContent><div className="font-display text-3xl font-bold">{activeCoupons}</div></CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground">Total Redemptions</CardTitle>
            <TrendingUp className="h-5 w-5 text-[hsl(var(--gold))]" />
          </CardHeader>
          <CardContent><div className="font-display text-3xl font-bold">{totalRedemptions}</div></CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground">Top Coupon</CardTitle>
            <Ticket className="h-5 w-5 text-[hsl(var(--gold))]" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-lg font-bold">{topCoupon?.code || "—"}</div>
            <p className="text-xs text-muted-foreground">{topCoupon ? `${topCoupon.times_used} uses` : ""}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="coupons" className="gap-1.5"><Ticket className="w-4 h-4" />Coupons</TabsTrigger>
          <TabsTrigger value="redemptions" className="gap-1.5"><History className="w-4 h-4" />Redemptions</TabsTrigger>
        </TabsList>

        {/* ===== COUPONS TAB ===== */}
        <TabsContent value="coupons" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search code or name…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterScope} onValueChange={setFilterScope}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Scope" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scopes</SelectItem>
                <SelectItem value="india">India</SelectItem>
                <SelectItem value="international">International</SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk actions */}
          {selected.size > 0 && (
            <div className="flex gap-2 items-center text-sm">
              <span className="text-muted-foreground">{selected.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => bulkAction("active")}><Play className="w-3 h-3 mr-1" />Activate</Button>
              <Button size="sm" variant="outline" onClick={() => bulkAction("paused")}><Pause className="w-3 h-3 mr-1" />Pause</Button>
              <Button size="sm" variant="outline" onClick={() => bulkAction("archived")}><Archive className="w-3 h-3 mr-1" />Archive</Button>
              <Button size="sm" variant="destructive" onClick={() => bulkAction("delete")}><Trash2 className="w-3 h-3 mr-1" />Delete</Button>
            </div>
          )}

          {/* Table */}
          <Card className="border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={paged.length > 0 && selected.size === paged.length} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                ) : paged.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No coupons found</TableCell></TableRow>
                ) : paged.map(c => (
                  <TableRow key={c.id}>
                    <TableCell><Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm">{c.code}</span>
                        <button onClick={() => { navigator.clipboard.writeText(c.code); toast({ title: "Copied!" }); }}>
                          <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                      {c.name && <p className="text-xs text-muted-foreground">{c.name}</p>}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {c.discount_type === "percentage" ? `${c.discount_value}%` : `${c.scope === "india" ? "₹" : c.scope === "international" ? "$" : "₹/$"}${c.discount_value}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{c.scope === "india" ? "🇮🇳 India" : c.scope === "international" ? "🌍 Intl" : "🌐 Global"}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{c.times_used}/{c.max_uses ?? "∞"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs capitalize ${statusColor[c.status]}`}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteCoupon(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="flex items-center text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </TabsContent>

        {/* ===== REDEMPTIONS TAB ===== */}
        <TabsContent value="redemptions" className="space-y-4 mt-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by coupon code or user email…"
              value={redemptionSearch}
              onChange={e => setRedemptionSearch(e.target.value)}
            />
          </div>

          <Card className="border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Coupon Code</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Original</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Final</TableHead>
                  <TableHead>Currency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptionsLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                ) : redemptionPaged.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No redemptions yet</TableCell></TableRow>
                ) : redemptionPaged.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()}{" "}
                      <span className="text-xs">{new Date(r.created_at).toLocaleTimeString()}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-semibold text-sm">{r.coupon_code}</span>
                    </TableCell>
                    <TableCell className="text-sm">{r.user_email}</TableCell>
                    <TableCell className="text-sm">{r.currency === "INR" ? "₹" : "$"}{r.original_amount}</TableCell>
                    <TableCell className="text-sm font-medium text-destructive">
                      -{r.currency === "INR" ? "₹" : "$"}{r.discount_applied}
                    </TableCell>
                    <TableCell className="text-sm font-semibold">{r.currency === "INR" ? "₹" : "$"}{r.final_amount}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{r.currency}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {redemptionTotalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="outline" disabled={redemptionPage === 0} onClick={() => setRedemptionPage(p => p - 1)}>Previous</Button>
              <span className="flex items-center text-sm text-muted-foreground">Page {redemptionPage + 1} of {redemptionTotalPages}</span>
              <Button size="sm" variant="outline" disabled={redemptionPage >= redemptionTotalPages - 1} onClick={() => setRedemptionPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Code</Label>
                <div className="flex gap-1">
                  <Input className="font-mono uppercase" value={form.code || ""} onChange={e => setField("code", e.target.value.toUpperCase())} />
                  <Button size="icon" variant="outline" onClick={() => setField("code", generateCode())} title="Generate"><RefreshCw className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.name || ""} onChange={e => setField("name", e.target.value)} placeholder="e.g. Diwali Special" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description || ""} onChange={e => setField("description", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Discount Type</Label>
                <Select value={form.discount_type} onValueChange={v => setField("discount_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Discount Value</Label>
                <Input type="number" min={0} value={form.discount_value || ""} onChange={e => setField("discount_value", e.target.value)} />
              </div>
            </div>

            {form.discount_type === "fixed" && (
              <div className="space-y-1.5">
                <Label>Currency (for fixed)</Label>
                <Select value={form.currency} onValueChange={v => setField("currency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">₹ INR</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Scope</Label>
                <Select value={form.scope} onValueChange={v => setField("scope", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">🌐 Global</SelectItem>
                    <SelectItem value="india">🇮🇳 India Only</SelectItem>
                    <SelectItem value="international">🌍 International Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Usage Type</Label>
                <Select value={form.usage_type} onValueChange={v => setField("usage_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-time</SelectItem>
                    <SelectItem value="limited">Limited</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.usage_type === "limited" && (
                <div className="space-y-1.5">
                  <Label>Max Uses</Label>
                  <Input type="number" min={1} value={form.max_uses || ""} onChange={e => setField("max_uses", e.target.value)} />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Expiry Date</Label>
              <Input type="datetime-local" value={(form.expires_at as string) || ""} onChange={e => setField("expires_at", e.target.value || null)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Min Order Value</Label>
                <Input type="number" min={0} placeholder="Optional" value={form.min_order_value || ""} onChange={e => setField("min_order_value", e.target.value || null)} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Discount Cap</Label>
                <Input type="number" min={0} placeholder="Optional" value={form.max_discount_cap || ""} onChange={e => setField("max_discount_cap", e.target.value || null)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Internal Notes</Label>
              <Textarea rows={2} value={form.notes || ""} onChange={e => setField("notes", e.target.value)} />
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Update Coupon" : "Create Coupon"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
