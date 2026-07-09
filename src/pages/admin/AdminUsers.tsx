import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Search, Trash2, Edit3, ChevronLeft, ChevronRight, Eye, Crown, ArrowDownCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  partner_name: string;
  wedding_date: string | null;
  created_at: string;
  subscription_status?: string;
}

const PAGE_SIZE = 15;

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", partner_name: "", wedding_date: "" });
  const [detailUser, setDetailUser] = useState<Profile | null>(null);
  const [planUser, setPlanUser] = useState<Profile | null>(null);
  const [planForm, setPlanForm] = useState<{ plan: string; durationMonths: number }>({ plan: "premium_yearly", durationMonths: 12 });
  const [planBusy, setPlanBusy] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch subscriptions to show status
      const { data: subs } = await supabase
        .from("user_subscriptions")
        .select("user_id, status, plan");

      const subMap: Record<string, string> = {};
      (subs || []).forEach((s: any) => {
        if (s.status === "active") subMap[s.user_id] = s.plan;
      });

      const enriched = (profiles || []).map((p: any) => ({
        ...p,
        subscription_status: subMap[p.id] || "free",
      }));

      setUsers(enriched);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.partner_name?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleEdit = (u: Profile) => {
    setEditUser(u);
    setEditForm({
      full_name: u.full_name || "",
      email: u.email || "",
      partner_name: u.partner_name || "",
      wedding_date: u.wedding_date || "",
    });
  };

  const saveEdit = async () => {
    if (!editUser) return;
    const { error } = await supabase.from("profiles").update({
      full_name: editForm.full_name,
      partner_name: editForm.partner_name,
      wedding_date: editForm.wedding_date || null,
    }).eq("id", editUser.id);
    if (!error) {
      setUsers((prev) => prev.map((u) => u.id === editUser.id ? { ...u, ...editForm } : u));
      setEditUser(null);
      toast({ title: "User updated" });
    } else {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete user "${name}"? This will remove their account, wedding sites, and all associated data. This cannot be undone.`)) return;
    try {
      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { userId: id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast({ title: "User permanently deleted" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const openPlanDialog = (u: Profile) => {
    setPlanUser(u);
    setPlanForm({ plan: "premium_yearly", durationMonths: 12 });
  };

  const applyUpgrade = async () => {
    if (!planUser) return;
    setPlanBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-set-subscription", {
        body: { userId: planUser.id, action: "upgrade", plan: planForm.plan, durationMonths: planForm.durationMonths },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setUsers((prev) => prev.map((u) => u.id === planUser.id ? { ...u, subscription_status: planForm.plan } : u));
      toast({ title: "User upgraded", description: `${planUser.email} → ${planForm.plan}` });
      setPlanUser(null);
    } catch (err: any) {
      toast({ title: "Upgrade failed", description: err.message, variant: "destructive" });
    } finally {
      setPlanBusy(false);
    }
  };

  const applyDowngrade = async (u: Profile) => {
    if (!confirm(`Downgrade "${u.full_name || u.email}" to Free? Any active premium subscription will be cancelled immediately.`)) return;
    try {
      const { data, error } = await supabase.functions.invoke("admin-set-subscription", {
        body: { userId: u.id, action: "downgrade" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, subscription_status: "free" } : x));
      toast({ title: "User downgraded to Free" });
    } catch (err: any) {
      toast({ title: "Downgrade failed", description: err.message, variant: "destructive" });
    }
  };

  const getSubBadge = (status?: string) => {
    if (status === "premium_yearly" || status === "premium_monthly") {
      return <Badge className="font-body text-xs bg-[hsl(var(--gold))]/20 text-[hsl(var(--gold-dark))] border-[hsl(var(--gold))]/30">Premium</Badge>;
    }
    return <Badge variant="outline" className="font-body text-xs">Free</Badge>;
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">User Management</h1>
      <Card className="border-border/50">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-3">
          <CardTitle className="font-body text-base flex-1">
            All Users ({filtered.length})
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9 font-body text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-body">Name</TableHead>
                      <TableHead className="font-body">Email</TableHead>
                      <TableHead className="font-body">Partner</TableHead>
                      <TableHead className="font-body">Plan</TableHead>
                      <TableHead className="font-body">Joined</TableHead>
                      <TableHead className="font-body">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((u) => (
                      <TableRow key={u.id} className="cursor-pointer" onClick={() => setDetailUser(u)}>
                        <TableCell className="font-body font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell className="font-body text-muted-foreground text-sm">{u.email}</TableCell>
                        <TableCell className="font-body">{u.partner_name || "—"}</TableCell>
                        <TableCell>{getSubBadge(u.subscription_status)}</TableCell>
                        <TableCell className="font-body text-muted-foreground text-sm">
                          {format(new Date(u.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(u)} title="Edit user">
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            {u.subscription_status === "free" ? (
                              <Button variant="ghost" size="sm" onClick={() => openPlanDialog(u)} title="Upgrade to premium (free)">
                                <Crown className="w-3.5 h-3.5 text-[hsl(var(--gold-dark))]" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => applyDowngrade(u)} title="Downgrade to free">
                                <ArrowDownCircle className="w-3.5 h-3.5 text-muted-foreground" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id, u.full_name)} title="Delete user">
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {paginated.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground font-body py-8">
                          No users found{search ? ` matching "${search}"` : ""}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                  <span className="font-body text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(v) => !v && setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit User</DialogTitle>
            <DialogDescription className="font-body text-sm">Update user profile details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="font-body text-sm font-medium block mb-1">Full Name</label>
              <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="font-body" />
            </div>
            <div>
              <label className="font-body text-sm font-medium block mb-1">Email (read-only)</label>
              <Input value={editForm.email} readOnly className="font-body bg-muted" />
            </div>
            <div>
              <label className="font-body text-sm font-medium block mb-1">Partner Name</label>
              <Input value={editForm.partner_name} onChange={(e) => setEditForm({ ...editForm, partner_name: e.target.value })} className="font-body" />
            </div>
            <div>
              <label className="font-body text-sm font-medium block mb-1">Wedding Date</label>
              <Input type="date" value={editForm.wedding_date} onChange={(e) => setEditForm({ ...editForm, wedding_date: e.target.value })} className="font-body" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button variant="gold" onClick={saveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailUser} onOpenChange={(v) => !v && setDetailUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{detailUser?.full_name || "User Details"}</DialogTitle>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-3 font-body text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{detailUser.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Partner</span><span>{detailUser.partner_name || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Plan</span>{getSubBadge(detailUser.subscription_status)}</div>
              <div className="flex justify-between"><span className="text-muted-foreground">Wedding Date</span><span>{detailUser.wedding_date ? format(new Date(detailUser.wedding_date), "MMM dd, yyyy") : "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><span>{format(new Date(detailUser.created_at), "MMM dd, yyyy")}</span></div>
              <div className="flex flex-wrap gap-2 pt-3">
                <Button variant="outline" size="sm" onClick={() => { setDetailUser(null); handleEdit(detailUser); }}>
                  <Edit3 className="w-4 h-4 mr-1" /> Edit
                </Button>
                {detailUser.subscription_status === "free" ? (
                  <Button variant="gold" size="sm" onClick={() => { const u = detailUser; setDetailUser(null); openPlanDialog(u); }}>
                    <Crown className="w-4 h-4 mr-1" /> Upgrade (free)
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => { const u = detailUser; setDetailUser(null); applyDowngrade(u); }}>
                    <ArrowDownCircle className="w-4 h-4 mr-1" /> Downgrade
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={!!planUser} onOpenChange={(v) => !v && setPlanUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Grant Premium (Free)</DialogTitle>
            <DialogDescription className="font-body text-sm">
              Comp a premium plan to {planUser?.full_name || planUser?.email}. No charge is made; any existing active plan is cancelled first.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="font-body text-sm font-medium block mb-1">Plan</label>
              <Select
                value={planForm.plan}
                onValueChange={(v) => setPlanForm({ plan: v, durationMonths: v === "premium_yearly" ? 12 : v === "premium_6mo" ? 6 : 1 })}
              >
                <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium">Premium (monthly)</SelectItem>
                  <SelectItem value="premium_6mo">Premium 6 months</SelectItem>
                  <SelectItem value="premium_yearly">Premium yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-body text-sm font-medium block mb-1">Duration (months)</label>
              <Input
                type="number"
                min={1}
                max={60}
                value={planForm.durationMonths}
                onChange={(e) => setPlanForm({ ...planForm, durationMonths: Math.max(1, Number(e.target.value) || 1) })}
                className="font-body"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPlanUser(null)} disabled={planBusy}>Cancel</Button>
              <Button variant="gold" onClick={applyUpgrade} disabled={planBusy}>
                {planBusy ? "Granting…" : "Grant Premium"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
