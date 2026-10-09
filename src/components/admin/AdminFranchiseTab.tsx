import { useEffect, useState } from "react";
import { csvCell, toCsv } from "@/lib/csv";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Network, Users, Search, Download, Check, X, UserPlus, ChevronDown, ChevronRight, Eye } from "lucide-react";

export default function AdminFranchiseTab() {
  const [franchises, setFranchises] = useState<any[]>([]);
  const [allAffiliates, setAllAffiliates] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [grantDialog, setGrantDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState<any>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [affRes, commRes] = await Promise.all([
      supabase.from("affiliates").select("*").order("created_at", { ascending: false }),
      supabase.from("franchise_commissions").select("*").order("created_at", { ascending: false }),
    ]);
    const allAffs = affRes.data || [];
    setAllAffiliates(allAffs);
    setFranchises(allAffs.filter((a: any) => a.is_franchise));
    setCommissions(commRes.data || []);
    setLoading(false);
  };

  const handleToggleFranchise = async (aff: any) => {
    const newVal = !aff.is_franchise;
    const { error } = await supabase
      .from("affiliates")
      .update({ is_franchise: newVal, franchise_approved: newVal })
      .eq("id", aff.id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: newVal ? "Franchise status granted ✅" : "Franchise status removed" });
      loadAll();
    }
  };

  const handleApprove = async (aff: any) => {
    const { error } = await supabase
      .from("affiliates")
      .update({ franchise_approved: true })
      .eq("id", aff.id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Franchise approved ✅" });
      loadAll();
    }
  };

  const handleMarkPaid = async (commissionId: string) => {
    const { error } = await supabase
      .from("franchise_commissions")
      .update({ payout_status: "paid", paid_at: new Date().toISOString() })
      .eq("id", commissionId);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Marked as paid ✅" });
      loadAll();
    }
  };

  const getSubAffiliates = (franchiseId: string) =>
    allAffiliates.filter(a => a.franchise_id === franchiseId);

  const getFranchiseCommissions = (franchiseId: string) =>
    commissions.filter(c => c.franchise_id === franchiseId);

  const filtered = franchises.filter(f =>
    (f.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (f.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (f.referral_code || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalFranchiseEarnings = commissions.reduce((s, c) => s + Number(c.commission_amount), 0);
  const pendingPayouts = commissions.filter(c => c.payout_status === "pending").length;
  const totalSubs = allAffiliates.filter(a => a.franchise_id).length;
  const nonFranchiseAffiliates = allAffiliates.filter(a => !a.is_franchise);

  const exportCSV = () => {
    const rows = [["Franchise Name", "Email", "Code", "Sub-Affiliates", "Approved", "Override Earned", "Pending Payouts", "UPI", "PayPal", "Joined"]];
    franchises.forEach(f => {
      const subs = getSubAffiliates(f.id);
      const fComms = getFranchiseCommissions(f.id);
      const earned = fComms.reduce((s: number, c: any) => s + Number(c.commission_amount), 0);
      const pending = fComms.filter((c: any) => c.payout_status === "pending").length;
      rows.push([
        f.full_name, f.email, f.referral_code, subs.length, f.franchise_approved ? "Yes" : "No",
        earned, pending, f.payout_upi || "", f.payout_paypal || "", new Date(f.created_at).toLocaleDateString()
      ]);
    });
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "franchise_export.csv";
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-body font-medium text-muted-foreground">Total Franchises</CardTitle></CardHeader>
          <CardContent><p className="font-display text-3xl font-bold">{loading ? "—" : franchises.length}</p></CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-body font-medium text-muted-foreground">Total Sub-Affiliates</CardTitle></CardHeader>
          <CardContent><p className="font-display text-3xl font-bold">{loading ? "—" : totalSubs}</p></CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-body font-medium text-muted-foreground">Override Earnings</CardTitle></CardHeader>
          <CardContent><p className="font-display text-3xl font-bold">{loading ? "—" : `₹${totalFranchiseEarnings.toLocaleString()}`}</p></CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-body font-medium text-muted-foreground">Pending Payouts</CardTitle></CardHeader>
          <CardContent><p className="font-display text-3xl font-bold text-amber-500">{loading ? "—" : pendingPayouts}</p></CardContent>
        </Card>
      </div>

      {/* Search + Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search franchise partners..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
          <Button variant="gold" size="sm" onClick={() => setGrantDialog(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" /> Grant Franchise
          </Button>
        </div>
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
                <TableHead className="font-body text-xs text-center">Sub-Affiliates</TableHead>
                <TableHead className="font-body text-xs text-center">Status</TableHead>
                <TableHead className="font-body text-xs text-right">Override Earned</TableHead>
                <TableHead className="font-body text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(f => {
                const subs = getSubAffiliates(f.id);
                const fComms = getFranchiseCommissions(f.id);
                const totalEarned = fComms.reduce((s: number, c: any) => s + Number(c.commission_amount), 0);
                const isExpanded = expandedId === f.id;

                return (
                  <>
                    <TableRow key={f.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setExpandedId(isExpanded ? null : f.id)}>
                      <TableCell>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell className="font-body text-sm font-medium">{f.full_name || "—"}</TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">{f.email}</TableCell>
                      <TableCell><code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{f.referral_code}</code></TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{subs.length}</Badge></TableCell>
                      <TableCell className="text-center">
                        {f.franchise_approved ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Approved</Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-body text-sm font-semibold">₹{totalEarned.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDetailDialog(f)}>
                            <Eye className="w-3 h-3 mr-1" /> View
                          </Button>
                          {!f.franchise_approved && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600" onClick={() => handleApprove(f)}>
                              <Check className="w-3 h-3 mr-1" /> Approve
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => handleToggleFranchise(f)}>
                            <X className="w-3 h-3 mr-1" /> Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow key={`${f.id}-expanded`}>
                        <TableCell colSpan={8} className="bg-muted/20 p-4">
                          {/* Payout info */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div className="bg-card rounded-lg p-3 border border-border/30">
                              <p className="font-body text-xs text-muted-foreground">Own Sales</p>
                              <p className="font-body text-sm font-semibold">{f.successful_referrals || 0}</p>
                            </div>
                            <div className="bg-card rounded-lg p-3 border border-border/30">
                              <p className="font-body text-xs text-muted-foreground">Own Earnings</p>
                              <p className="font-body text-sm font-semibold">₹{Number(f.total_earnings || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-card rounded-lg p-3 border border-border/30">
                              <p className="font-body text-xs text-muted-foreground">UPI</p>
                              <p className="font-body text-sm truncate">{f.payout_upi || "Not set"}</p>
                            </div>
                            <div className="bg-card rounded-lg p-3 border border-border/30">
                              <p className="font-body text-xs text-muted-foreground">PayPal</p>
                              <p className="font-body text-sm truncate">{f.payout_paypal || "Not set"}</p>
                            </div>
                          </div>

                          {/* Sub-Affiliates */}
                          {subs.length > 0 && (
                            <>
                              <p className="font-body text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                                Sub-Affiliates ({subs.length})
                              </p>
                              <div className="space-y-1 mb-4">
                                {subs.map(sub => (
                                  <div key={sub.id} className="flex items-center justify-between bg-card rounded-lg px-3 py-2 border border-border/30">
                                    <div>
                                      <p className="font-body text-sm font-medium">{sub.full_name || "—"}</p>
                                      <p className="font-body text-xs text-muted-foreground">{sub.email} • Joined {new Date(sub.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-body text-sm font-semibold">{sub.successful_referrals || 0} sales</p>
                                      <p className="font-body text-xs text-muted-foreground">{sub.total_referrals || 0} refs</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                          {subs.length === 0 && (
                            <p className="font-body text-sm text-muted-foreground text-center py-2 mb-4">No sub-affiliates onboarded yet</p>
                          )}

                          {/* Override Commissions */}
                          {fComms.length > 0 && (
                            <>
                              <p className="font-body text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                                Override Commissions ({fComms.length})
                              </p>
                              <div className="space-y-1 max-h-48 overflow-y-auto">
                                {fComms.map(c => {
                                  const sub = subs.find(s => s.id === c.sub_affiliate_id);
                                  return (
                                    <div key={c.id} className="flex items-center justify-between bg-card rounded-lg px-3 py-2 border border-border/30">
                                      <div>
                                        <p className="font-body text-sm">
                                          {c.currency === "INR" ? "₹" : "$"}{Number(c.commission_amount).toLocaleString()} from {sub?.full_name || "sub-affiliate"}
                                        </p>
                                        <p className="font-body text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant={c.payout_status === "paid" ? "default" : "secondary"} className="text-xs">{c.payout_status}</Badge>
                                        {c.payout_status === "pending" && (
                                          <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => handleMarkPaid(c.id)}>
                                            Mark Paid
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
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
                    <p className="font-body text-sm text-muted-foreground">No franchise partners found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Grant Franchise Dialog */}
      <Dialog open={grantDialog} onOpenChange={setGrantDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Grant Franchise Status</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground font-body mb-4">
            Select an existing affiliate to promote to franchise partner:
          </p>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {nonFranchiseAffiliates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">All affiliates are already franchise partners</p>
            ) : (
              nonFranchiseAffiliates.map(aff => (
                <div key={aff.id} className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2 border border-border/30">
                  <div>
                    <p className="font-body text-sm font-medium">{aff.full_name || "—"}</p>
                    <p className="font-body text-xs text-muted-foreground">{aff.email}</p>
                  </div>
                  <Button variant="gold" size="sm" className="h-7 text-xs" onClick={() => {
                    handleToggleFranchise(aff);
                    setGrantDialog(false);
                  }}>
                    <Network className="w-3 h-3 mr-1" /> Grant
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Franchise Details</DialogTitle>
          </DialogHeader>
          {detailDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="font-body text-xs text-muted-foreground">Name</p><p className="font-body text-sm font-medium">{detailDialog.full_name}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">Email</p><p className="font-body text-sm font-medium">{detailDialog.email}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">Phone</p><p className="font-body text-sm">{detailDialog.phone || "—"}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">Code</p><p className="font-mono text-sm">{detailDialog.referral_code}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">Sub-Affiliates</p><p className="font-body text-sm font-semibold">{getSubAffiliates(detailDialog.id).length}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">Override Earned</p><p className="font-body text-sm font-semibold">₹{getFranchiseCommissions(detailDialog.id).reduce((s: number, c: any) => s + Number(c.commission_amount), 0).toLocaleString()}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">Own Earnings</p><p className="font-body text-sm font-semibold">₹{Number(detailDialog.total_earnings).toLocaleString()}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">Approved</p><p className="font-body text-sm">{detailDialog.franchise_approved ? "Yes ✅" : "Pending ⏳"}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">UPI</p><p className="font-body text-sm">{detailDialog.payout_upi || "Not set"}</p></div>
                <div><p className="font-body text-xs text-muted-foreground">PayPal</p><p className="font-body text-sm">{detailDialog.payout_paypal || "Not set"}</p></div>
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
