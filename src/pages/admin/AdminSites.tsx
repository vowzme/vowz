import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Search, Pause, Play, Trash2, ExternalLink, Edit3, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Site {
  id: string;
  partner1: string;
  partner2: string;
  slug: string | null;
  theme: string;
  is_published: boolean;
  custom_domain: string | null;
  created_at: string;
  status?: string;
  user_id: string;
}

const PAGE_SIZE = 15;

export default function AdminSites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [editSite, setEditSite] = useState<Site | null>(null);
  const [editForm, setEditForm] = useState({ partner1: "", partner2: "", slug: "", theme: "" });
  const [detailSite, setDetailSite] = useState<Site | null>(null);

  const fetchSites = async () => {
    const { data } = await supabase
      .from("wedding_sites")
      .select("id, partner1, partner2, slug, theme, is_published, custom_domain, created_at, status, user_id")
      .order("created_at", { ascending: false });
    setSites((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchSites(); }, []);

  const handlePause = async (id: string) => {
    const { error } = await supabase.from("wedding_sites").update({ status: "paused", is_published: false } as any).eq("id", id);
    if (!error) {
      setSites((prev) => prev.map((s) => s.id === id ? { ...s, status: "paused", is_published: false } : s));
      toast({ title: "Site paused" });
    }
  };

  const handleReactivate = async (id: string) => {
    const { error } = await supabase.from("wedding_sites").update({ status: "active", is_published: true } as any).eq("id", id);
    if (!error) {
      setSites((prev) => prev.map((s) => s.id === id ? { ...s, status: "active", is_published: true } : s));
      toast({ title: "Site reactivated" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this site? This cannot be undone. All associated RSVPs, blessings, and analytics will also be removed.")) return;
    // Delete related data first (blessings, rsvps, analytics, etc.)
    await Promise.all([
      supabase.from("guest_blessings").delete().eq("wedding_site_id", id),
      supabase.from("rsvps").delete().eq("wedding_site_id", id),
      supabase.from("site_analytics").delete().eq("wedding_site_id", id),
      supabase.from("guestbook").delete().eq("wedding_site_id", id),
      supabase.from("slug_redirects").delete().eq("wedding_site_id", id),
      supabase.from("wedding_polls").delete().eq("wedding_site_id", id),
      supabase.from("wedding_checklist").delete().eq("wedding_site_id", id),
      supabase.from("wedding_expenses").delete().eq("wedding_site_id", id),
      supabase.from("wedding_budget").delete().eq("wedding_site_id", id),
      supabase.from("wedding_reminders").delete().eq("wedding_site_id", id),
      supabase.from("wedding_family_members").delete().eq("wedding_site_id", id),
    ]);
    const { error } = await supabase.from("wedding_sites").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setSites((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Site deleted permanently" });
  };

  const handleEditOpen = (s: Site) => {
    setEditSite(s);
    setEditForm({ partner1: s.partner1, partner2: s.partner2, slug: s.slug || "", theme: s.theme });
  };

  const saveEdit = async () => {
    if (!editSite) return;
    const { error } = await supabase.from("wedding_sites").update({
      partner1: editForm.partner1,
      partner2: editForm.partner2,
      slug: editForm.slug || null,
      theme: editForm.theme,
    } as any).eq("id", editSite.id);
    if (!error) {
      setSites((prev) => prev.map((s) => s.id === editSite.id ? { ...s, ...editForm } : s));
      setEditSite(null);
      toast({ title: "Site updated" });
    }
  };

  const filtered = sites.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || s.partner1?.toLowerCase().includes(q) || s.partner2?.toLowerCase().includes(q) || s.slug?.toLowerCase().includes(q);
    const status = (s as any).status || "active";
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "published" && s.is_published) ||
      (statusFilter === "draft" && !s.is_published && status !== "paused") ||
      (statusFilter === "paused" && status === "paused");
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const getStatusBadge = (site: Site) => {
    const status = (site as any).status || "active";
    if (status === "paused") return <Badge variant="outline" className="font-body text-amber-600 border-amber-300 bg-amber-50">Paused</Badge>;
    if (site.is_published) return <Badge variant="default" className="font-body bg-emerald-500/20 text-emerald-700 border-emerald-300">Published</Badge>;
    return <Badge variant="outline" className="font-body">Draft</Badge>;
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Site Management</h1>
      <Card className="border-border/50">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-3">
          <CardTitle className="font-body text-base flex-1">
            All Sites ({filtered.length})
          </CardTitle>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-32 font-body text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9 font-body text-sm"
              />
            </div>
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
                      <TableHead className="font-body">Couple</TableHead>
                      <TableHead className="font-body">Slug</TableHead>
                      <TableHead className="font-body">Theme</TableHead>
                      <TableHead className="font-body">Status</TableHead>
                      <TableHead className="font-body">Created</TableHead>
                      <TableHead className="font-body">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((s) => (
                      <TableRow key={s.id} className="cursor-pointer" onClick={() => setDetailSite(s)}>
                        <TableCell className="font-body font-medium">
                          {s.partner1 && s.partner2 ? `${s.partner1} & ${s.partner2}` : s.partner1 || s.partner2 || "—"}
                        </TableCell>
                        <TableCell className="font-body text-muted-foreground font-mono text-xs">
                          {s.slug || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-body capitalize">{s.theme}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(s)}</TableCell>
                        <TableCell className="font-body text-muted-foreground text-sm">
                          {format(new Date(s.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {s.slug && s.is_published && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={`/site/${s.slug}`} target="_blank" rel="noopener"><ExternalLink className="w-3.5 h-3.5" /></a>
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleEditOpen(s)} title="Edit site">
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            {((s as any).status || "active") !== "paused" ? (
                              <Button variant="ghost" size="sm" onClick={() => handlePause(s.id)} title="Pause site">
                                <Pause className="w-3.5 h-3.5 text-amber-600" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => handleReactivate(s.id)} title="Reactivate site">
                                <Play className="w-3.5 h-3.5 text-emerald-500" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} title="Delete site">
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {paginated.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground font-body py-8">
                          No sites found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

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

      {/* Edit Site Dialog */}
      <Dialog open={!!editSite} onOpenChange={(v) => !v && setEditSite(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Site</DialogTitle>
            <DialogDescription className="font-body text-sm">Update site details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="font-body text-sm font-medium block mb-1">Partner 1</label>
              <Input value={editForm.partner1} onChange={(e) => setEditForm({ ...editForm, partner1: e.target.value })} className="font-body" />
            </div>
            <div>
              <label className="font-body text-sm font-medium block mb-1">Partner 2</label>
              <Input value={editForm.partner2} onChange={(e) => setEditForm({ ...editForm, partner2: e.target.value })} className="font-body" />
            </div>
            <div>
              <label className="font-body text-sm font-medium block mb-1">Slug</label>
              <Input value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} className="font-body font-mono" />
            </div>
            <div>
              <label className="font-body text-sm font-medium block mb-1">Theme</label>
              <Input value={editForm.theme} onChange={(e) => setEditForm({ ...editForm, theme: e.target.value })} className="font-body" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditSite(null)}>Cancel</Button>
              <Button variant="gold" onClick={saveEdit}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailSite} onOpenChange={(v) => !v && setDetailSite(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {detailSite ? `${detailSite.partner1} & ${detailSite.partner2}` : "Site Details"}
            </DialogTitle>
          </DialogHeader>
          {detailSite && (
            <div className="space-y-3 font-body text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Slug</span><span className="font-mono">{detailSite.slug || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Theme</span><Badge variant="secondary" className="capitalize">{detailSite.theme}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span>{getStatusBadge(detailSite)}</div>
              <div className="flex justify-between"><span className="text-muted-foreground">Domain</span><span>{detailSite.custom_domain || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{format(new Date(detailSite.created_at), "MMM dd, yyyy")}</span></div>
              <div className="flex gap-2 pt-3">
                <Button variant="outline" size="sm" onClick={() => { setDetailSite(null); handleEditOpen(detailSite); }}>
                  <Edit3 className="w-4 h-4 mr-1" /> Edit
                </Button>
                {detailSite.slug && detailSite.is_published && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/site/${detailSite.slug}`} target="_blank" rel="noopener">
                      <ExternalLink className="w-4 h-4 mr-1" /> View Site
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
