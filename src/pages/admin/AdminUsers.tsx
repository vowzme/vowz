import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Search, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  partner_name: string;
  wedding_date: string | null;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      setUsers(data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.partner_name?.toLowerCase().includes(q);
  });

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
                    <TableHead className="font-body">Name</TableHead>
                    <TableHead className="font-body">Email</TableHead>
                    <TableHead className="font-body">Partner</TableHead>
                    <TableHead className="font-body">Wedding Date</TableHead>
                    <TableHead className="font-body">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-body font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell className="font-body text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="font-body">{u.partner_name || "—"}</TableCell>
                      <TableCell className="font-body">
                        {u.wedding_date ? (
                          <Badge variant="outline" className="font-body">
                            {format(new Date(u.wedding_date), "MMM dd, yyyy")}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="font-body text-muted-foreground text-sm">
                        {format(new Date(u.created_at), "MMM dd, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground font-body py-8">
                        No users found matching "{search}"
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
