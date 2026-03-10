import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Site {
  id: string;
  partner1: string;
  partner2: string;
  slug: string | null;
  theme: string;
  is_published: boolean;
  custom_domain: string | null;
  created_at: string;
}

export default function AdminSites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("wedding_sites")
        .select("id, partner1, partner2, slug, theme, is_published, custom_domain, created_at")
        .order("created_at", { ascending: false });
      setSites(data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Site Management</h1>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-body text-base">
            All Sites ({sites.length})
          </CardTitle>
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
                    <TableHead className="font-body">Domain</TableHead>
                    <TableHead className="font-body">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sites.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-body font-medium">
                        {s.partner1 && s.partner2
                          ? `${s.partner1} & ${s.partner2}`
                          : s.partner1 || s.partner2 || "—"}
                      </TableCell>
                      <TableCell className="font-body text-muted-foreground font-mono text-xs">
                        {s.slug || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-body capitalize">
                          {s.theme}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={s.is_published ? "default" : "outline"}
                          className={`font-body ${s.is_published ? "bg-emerald/20 text-emerald border-emerald/30" : ""}`}
                        >
                          {s.is_published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-body text-muted-foreground text-sm">
                        {s.custom_domain || "—"}
                      </TableCell>
                      <TableCell className="font-body text-muted-foreground text-sm">
                        {format(new Date(s.created_at), "MMM dd, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
