import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { vendorCategoryLabel, type VendorRow } from "@/lib/vendor-categories";
import { Check, X, Star, ExternalLink, Search, Loader2 } from "lucide-react";

const STATUSES = ["all", "pending", "approved", "rejected", "suspended"] as const;

export default function AdminVendors() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("pending");
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("vendors" as any).select("*").order("created_at", { ascending: false }).limit(500);
    setVendors(((data as any) || []) as VendorRow[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const shown = useMemo(
    () =>
      vendors.filter((v) => {
        if (status !== "all" && v.status !== status) return false;
        if (q && !`${v.business_name} ${v.city || ""}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [vendors, status, q],
  );

  const setVendorField = async (id: string, patch: Record<string, any>, message: string) => {
    const { error } = await supabase.from("vendors" as any).update(patch as any).eq("id", id);
    if (error) {
      toast({ title: "Could not update", description: error.message, variant: "destructive" });
      return;
    }
    setVendors((prev) => prev.map((v) => (v.id === id ? ({ ...v, ...patch } as VendorRow) : v)));
    toast({ title: message });
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle className="font-display">Vendor marketplace</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-center">
          {STATUSES.map((s) => (
            <Button key={s} size="sm" variant={status === s ? "default" : "outline"} className="h-10 capitalize" onClick={() => setStatus(s)}>
              {s} ({s === "all" ? vendors.length : vendors.filter((v) => v.status === s).length})
            </Button>
          ))}
          <div className="relative ml-auto min-w-52">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vendors" className="h-10 pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
          ) : shown.length === 0 ? (
            <p className="py-16 text-center font-body text-muted-foreground">No vendors here.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {v.business_name}
                        {v.is_featured && <Star className="w-3.5 h-3.5 text-gold" />}
                      </div>
                      <a href={`/vendor/${v.slug}`} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        /vendor/{v.slug} <ExternalLink className="w-3 h-3" />
                      </a>
                    </TableCell>
                    <TableCell>{vendorCategoryLabel(v.category)}</TableCell>
                    <TableCell>{v.city || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{v.status}</Badge></TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {v.status !== "approved" && (
                        <Button size="sm" className="h-9 mr-2" onClick={() => setVendorField(v.id, { status: "approved" }, "Vendor approved")}>
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                      )}
                      {v.status === "approved" && (
                        <>
                          <Button size="sm" variant="outline" className="h-9 mr-2" onClick={() => setVendorField(v.id, { is_featured: !v.is_featured }, v.is_featured ? "Removed from featured" : "Marked as featured")}>
                            <Star className="w-4 h-4 mr-1" /> {v.is_featured ? "Unfeature" : "Feature"}
                          </Button>
                          <Button size="sm" variant="outline" className="h-9 mr-2" onClick={() => setVendorField(v.id, { status: "suspended" }, "Vendor suspended")}>
                            Suspend
                          </Button>
                        </>
                      )}
                      {v.status === "pending" && (
                        <Button size="sm" variant="outline" className="h-9" onClick={() => setVendorField(v.id, { status: "rejected" }, "Vendor asked for changes")}>
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
