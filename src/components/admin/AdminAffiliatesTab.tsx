import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, IndianRupee, Search, Download, Eye, X, Check, DollarSign, ChevronDown, ChevronRight } from "lucide-react";

export default function AdminAffiliatesTab() {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailDialog, setDetailDialog] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [affRes, refRes] = await Promise.all([
      supabase.from("affiliates").select("*").order("created_at", { ascending: false }),
      supabase.from("affiliate_referrals").select("*").order("created_at", { ascending: false }),
    ]);
    setAffiliates(affRes.data || []);
    setReferrals(refRes.data || []);
    setLoading(false);
  };

  const handleToggleActive = async (aff: any) => {
    const { error } = await supabase
      .from("affiliates")
      .update({ is_active: !aff.is_active })
      .eq("id", aff.id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: aff.is_active ? "Affiliate deactivated" : "Affiliate activated ✅" });
      loadData();
    }
  };

  const handleMarkReferralPaid = async (refId: string) => {
    const { error } = await supabase
      .from("affiliate_referrals")
      .update({ payout_status: "paid", commission_paid: true, paid_at: new Date().toISOString() })
      .eq("id", refId);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Marked as paid ✅" });
      loadData();
    }
  };

  const getAffReferrals = (affId: string) => referrals.filter(r => r.affiliate_id === affId);

  const filtered = affiliates.filter(a =>
    (a.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.referral_code || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalAffiliates = affiliates.length;
  const activeAffiliates = affiliates.filter(a => a.is_active).length;
  const totalEarnings = affiliates.reduce((s, a) => s + Number(a.total_earnings || 0), 0);
  const pendingPayouts = referrals.filter(r => r.payout_status === "pending" && r.status === "converted").length;

  const exportCSV = () => {
    const rows = [["Name", "Email", "Code", "Active", "Total Referrals", "Successful", "Total Earnings", "Pending", "Paid", "UPI", "PayPal", "Franchise", "Joined"]];
    affiliates.forEach(a => {
      rows.push([
        a.full_name, a.email, a.referral_code, a.is_active ? "Yes" : "No",
        a.total_referrals, a.successful_referrals, a.total_earnings, a.pending_earnings, a.paid_earnings,
        a.payout_upi || "", a.payout_paypal || "", a.is_franchise ? "Yes" : "No",
        new Date(a.created_at).toLocaleDateString()
      ]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "affiliates_export.csv";
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-body font-medium text-muted-foreground">Total Affiliates</CardTitle></CardHeader>
          <CardContent><p className="font-display text-3xl font-bold">{loading ? "—" : totalAffiliates}</p></CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-body font-medium text-muted-foreground">Active</CardTitle></CardHeader>
          <CardContent><p className="font-display text-3xl font-bold text-emerald-600">{loading ? "—" : activeAffiliates}</p></CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-body font-medium text-muted-foreground">Total Earnings</CardTitle></CardHeader>
          <CardContent><p className="font-display text-3xl font-bold">{loading ? "—" : `₹${totalEarnings.toLocaleString()}`}</p></CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-body font-medium text-muted-foreground">Pending Payouts</CardTitle></CardHeader>
          <CardContent><p className="font-display text-3xl font-bold text-amber-500">{loading ? "—" : pendingPayouts}</p></CardContent>
        </Card>
      </div>

      {/* Search + Export */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search affiliates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body text-xs w-8"></TableHead>
                <TableHead className="font-body text-xs">Name</TableHead>
                <TableHead className="font-body text-xs">Email</TableHead>
                <TableHead className="font-body text-xs">Code</TableHead>
                <TableHead className="font-body text-xs text-center">Sales</TableHead>
                <TableHead className="font-body text-xs text-center">Status</TableHead>
                <TableHead className="font-body text-xs text-right">Earnings</TableHead>
                <TableHead className="font-body text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(a => {
                const affRefs = getAffReferrals(a.id);
                const isExpanded = expandedId === a.id;
                return (
                  <>
                    <TableRow key={a.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setExpandedId(isExpanded ? null : a.id)}>
                      <TableCell>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell className="font-body text-sm font-medium">
                        {a.full_name || "—"}
                        {a.is_franchise && <Badge className="ml-2 bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px]">Franchise</Badge>}
                      </TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">{a.email}</TableCell>
                      <TableCell><code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{a.referral_code}</code></TableCell>
                      <TableCell className="text-center font-body text-sm">{a.successful_referrals || 0}/{a.total_referrals || 0}</TableCell>
                      <TableCell className="text-center">
                        {a.is_active ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-body text-sm font-semibold">₹{Number(a.total_earnings || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDetailDialog(a)}>
                            <Eye className="w-3 h-3 mr-1" /> View
                          </Button>
                          <Button variant="ghost" size="sm" className={`h-7 text-xs ${a.is_active ? 'text-destructive' : 'text-emerald-600'}`} onClick={() => handleToggleActive(a)}>
                            {a.is_active ? <><X className="w-3 h-3 mr-1" /> Deactivate</> : <><Check className="w-3 h-3 mr-1" /> Activate</>}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow key={`${a.id}-detail`}>
                        <TableCell colSpan={8} className="bg-muted/20 p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div className="bg-card rounded-lg p-3 border border-border/30">
                              <p className="font-body text-xs text-muted-foreground">Pending</p>
                              <p className="font-body text-sm font-semibold">₹{Number(a.pending_earnings || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-card rounded-lg p-3 border border-border/30">
                              <p className="font-body text-xs text-muted-foreground">Paid</p>
                              <p className="font-body text-sm font-semibold text-emerald-600">₹{Number(a.paid_earnings || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-card rounded-lg p-3 border border-border/30">
                              <p className="font-body text-xs text-muted-foreground">UPI</p>
                              <p className="font-body text-sm font-medium truncate">{a.payout_upi || "Not set"}</p>
                            </div>
                            <div className="bg-card rounded-lg p-3 border border-border/30">
                              <p className="font-body text-xs text-muted-foreground">PayPal</p>
                              <p className="font-body text-sm font-medium truncate">{a.payout_paypal || "Not set"}</p>
                            </div>
                          </div>

                          {affRefs.length > 0 ? (
                            <>
                              <p className="font-body text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Referrals & Payouts</p>
                              <div className="space-y-1 max-h-60 overflow-y-auto">
                                {affRefs.map(r => (
                                  <div key={r.id} className="flex items-center justify-between bg-card rounded-lg px-3 py-2 border border-border/30">
                                    <div>
                                      <p className="font-body text-sm">{r.referred_email || "Unknown"}</p>
                                      <p className="font-body text-xs text-muted-foreground">
                                        {r.plan} • {new Date(r.created_at).toLocaleDateString()} •
                                        <Badge variant="secondary" className="ml-1 text-[10px]">{r.status}</Badge>
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-body text-sm font-semibold">₹{Number(r.commission_amount).toLocaleString()}</span>
                                      <Badge variant={r.payout_status === "paid" ? "default" : "secondary"} className="text-xs">{r.payout_status}</Badge>
                                      {r.payout_status === "pending" && r.status === "converted" && (
                                        <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => handleMarkReferralPaid(r.id)}>
                                          Mark Paid
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <p className="font-body text-sm text-muted-foreground text-center py-2">No referrals yet</p>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <p className="font-body text-sm text-muted-foreground">No affiliates found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Affiliate Details</DialogTitle>
          </DialogHeader>
          {detailDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="font-body text-xs text-muted-foreground">Name</p><p className="font-body text-sm font-medium">{detailDialog.full_name}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">Email</p><p className="font-body text-sm font-medium">{detailDialog.email}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">Phone</p><p className="font-body text-sm font-medium">{detailDialog.phone || "—"}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">Referral Code</p><p className="font-mono text-sm">{detailDialog.referral_code}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">Custom Coupon</p><p className="font-body text-sm">{detailDialog.custom_coupon || "—"}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">Joined</p><p className="font-body text-sm">{new Date(detailDialog.created_at).toLocaleDateString()}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">Total Earnings</p><p className="font-body text-sm font-semibold">₹{Number(detailDialog.total_earnings).toLocaleString()}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">Pending</p><p className="font-body text-sm font-semibold text-amber-500">₹{Number(detailDialog.pending_earnings).toLocaleString()}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">UPI / GPay</p><p className="font-body text-sm">{detailDialog.payout_upi || "Not set"}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">PayPal</p><p className="font-body text-sm">{detailDialog.payout_paypal || "Not set"}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">Franchise</p><p className="font-body text-sm">{detailDialog.is_franchise ? "Yes ✅" : "No"}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">Status</p><p className="font-body text-sm">{detailDialog.is_active ? "Active ✅" : "Inactive ❌"}</p></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
