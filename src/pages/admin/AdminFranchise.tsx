import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Network, Users, IndianRupee, Check, X, Search, Download, Eye, UserPlus, ChevronDown, ChevronRight } from "lucide-react";

export default function AdminFranchise() {
  const [franchises, setFranchises] = useState<any[]>([]);
  const [allAffiliates, setAllAffiliates] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedFranchise, setExpandedFranchise] = useState<string | null>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [approveDialog, setApproveDialog] = useState(false);

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
    const newVal = !(aff as any).is_franchise;
    const { error } = await supabase
      .from("affiliates")
      .update({ is_franchise: newVal, franchise_approved: newVal } as any)
      .eq("id", aff.id);
    if (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    } else {
      toast({ title: newVal ? "Franchise status granted ✅" : "Franchise status removed" });
      loadAll();
    }
  };

  const handleApprove = async (aff: any) => {
    const { error } = await supabase
      .from("affiliates")
      .update({ franchise_approved: true } as any)
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
      .from("franchise_commissions" as any)
      .update({ payout_status: "paid", paid_at: new Date().toISOString() } as any)
      .eq("id", commissionId);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Marked as paid ✅" });
      loadAll();
    }
  };

  const filteredFranchises = franchises.filter((f: any) =>
    (f.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (f.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (f.referral_code || "").toLowerCase().includes(search.toLowerCase())
  );

  const getSubAffiliates = (franchiseId: string) =>
    allAffiliates.filter((a: any) => (a as any).franchise_id === franchiseId);

  const getFranchiseCommissions = (franchiseId: string) =>
    commissions.filter((c: any) => c.franchise_id === franchiseId);

  const totalFranchiseEarnings = commissions.reduce((s, c: any) => s + Number(c.commission_amount), 0);
  const pendingPayouts = commissions.filter((c: any) => c.payout_status === "pending").length;

  // Non-franchise affiliates for granting franchise status
  const nonFranchiseAffiliates = allAffiliates.filter((a: any) => !(a as any).is_franchise);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Franchise Partners</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Manage franchise partners and their sub-affiliate networks
          </p>
        </div>
        <Button variant="gold" size="sm" onClick={() => setApproveDialog(true)}>
          <UserPlus className="w-4 h-4 mr-1.5" /> Grant Franchise Status
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body font-medium text-muted-foreground">Total Franchises</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">{loading ? "—" : franchises.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body font-medium text-muted-foreground">Total Sub-Affiliates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">
              {loading ? "—" : allAffiliates.filter((a: any) => (a as any).franchise_id).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body font-medium text-muted-foreground">Override Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">{loading ? "—" : `₹${totalFranchiseEarnings.toLocaleString()}`}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body font-medium text-muted-foreground">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold text-amber-500">{loading ? "—" : pendingPayouts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search franchise partners..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Franchise Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
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
              {filteredFranchises.map((f: any) => {
                const subs = getSubAffiliates(f.id);
                const fComms = getFranchiseCommissions(f.id);
                const totalEarned = fComms.reduce((s: number, c: any) => s + Number(c.commission_amount), 0);
                const isExpanded = expandedFranchise === f.id;

                return (
                  <>
                    <TableRow key={f.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setExpandedFranchise(isExpanded ? null : f.id)}>
                      <TableCell>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell className="font-body text-sm font-medium">{f.full_name || "—"}</TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">{f.email}</TableCell>
                      <TableCell>
                        <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{f.referral_code}</code>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{subs.length}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {(f as any).franchise_approved ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Approved</Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-body text-sm font-semibold">
                        ₹{totalEarned.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                          {!(f as any).franchise_approved && (
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

                    {/* Expanded: Sub-Affiliates */}
                    {isExpanded && subs.length > 0 && (
                      <TableRow key={`${f.id}-subs`}>
                        <TableCell colSpan={8} className="bg-muted/20 p-4">
                          <p className="font-body text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                            Sub-Affiliates under {f.full_name}
                          </p>
                          <div className="space-y-2">
                            {subs.map((sub: any) => (
                              <div key={sub.id} className="flex items-center justify-between bg-card rounded-lg px-3 py-2 border border-border/30">
                                <div>
                                  <p className="font-body text-sm font-medium">{sub.full_name || "—"}</p>
                                  <p className="font-body text-xs text-muted-foreground">{sub.email} • Joined {new Date(sub.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-body text-sm font-semibold">{sub.successful_referrals || 0} sales</p>
                                  <p className="font-body text-xs text-muted-foreground">{sub.total_referrals || 0} total refs</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Franchise commissions for this franchise */}
                          {fComms.length > 0 && (
                            <>
                              <p className="font-body text-xs font-semibold text-muted-foreground mb-2 mt-4 uppercase tracking-wider">
                                Override Commissions
                              </p>
                              <div className="space-y-1">
                                {fComms.map((c: any) => {
                                  const sub = subs.find((s: any) => s.id === c.sub_affiliate_id);
                                  return (
                                    <div key={c.id} className="flex items-center justify-between bg-card rounded-lg px-3 py-2 border border-border/30">
                                      <div>
                                        <p className="font-body text-sm">
                                          {c.currency === "INR" ? "₹" : "$"}{Number(c.commission_amount).toLocaleString()} from {sub?.full_name || "sub-affiliate"}
                                        </p>
                                        <p className="font-body text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant={c.payout_status === "paid" ? "default" : "secondary"} className="text-xs">
                                          {c.payout_status}
                                        </Badge>
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

                    {isExpanded && subs.length === 0 && (
                      <TableRow key={`${f.id}-empty`}>
                        <TableCell colSpan={8} className="bg-muted/20 p-4 text-center">
                          <p className="font-body text-sm text-muted-foreground">No sub-affiliates onboarded yet</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              {filteredFranchises.length === 0 && (
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
      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
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
              nonFranchiseAffiliates.map((aff: any) => (
                <div key={aff.id} className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2 border border-border/30">
                  <div>
                    <p className="font-body text-sm font-medium">{aff.full_name || "—"}</p>
                    <p className="font-body text-xs text-muted-foreground">{aff.email}</p>
                  </div>
                  <Button variant="gold" size="sm" className="h-7 text-xs" onClick={() => {
                    handleToggleFranchise(aff);
                    setApproveDialog(false);
                  }}>
                    <Network className="w-3 h-3 mr-1" /> Grant
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
