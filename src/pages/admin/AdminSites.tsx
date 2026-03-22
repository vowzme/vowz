import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Search, Pause, Play, Trash2, ExternalLink } from "lucide-react";
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
}

export default function AdminSites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchSites = async () => {
    const { data } = await supabase
      .from("wedding_sites")
      .select("id, partner1, partner2, slug, theme, is_published, custom_domain, created_at, status")
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
    if (!confirm("Permanently delete this site? This cannot be undone.")) return;
    const { error } = await supabase.from("wedding_sites").delete().eq("id", id);
    if (!error) {
      setSites((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Site deleted permanently" });
    }
  };

  const filtered = sites.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.partner1?.toLowerCase().includes(q) || s.partner2?.toLowerCase().includes(q) || s.slug?.toLowerCase().includes(q);
  });

  const getStatusBadge = (site: Site) => {
    const status = (site as any).status || "active";
    if (status === "paused") return <Badge variant="outline" className="font-body text-amber-600 border-amber-300 bg-amber-50">Paused</Badge>;
    if (site.is_published) return <Badge variant="default" className="font-body bg-emerald/20 text-emerald border-emerald/30">Published</Badge>;
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
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
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
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {s.slug && s.is_published && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={`/site/${s.slug}`} target="_blank" rel="noopener"><ExternalLink className="w-3.5 h-3.5" /></a>
                            </Button>
                          )}
                          {((s as any).status || "active") !== "paused" ? (
                            <Button variant="ghost" size="sm" onClick={() => handlePause(s.id)} title="Pause site">
                              <Pause className="w-3.5 h-3.5 text-amber-600" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => handleReactivate(s.id)} title="Reactivate site">
                              <Play className="w-3.5 h-3.5 text-emerald" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} title="Delete site">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground font-body py-8">
                        No sites found matching "{search}"
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
