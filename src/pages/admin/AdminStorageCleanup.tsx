import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type PerUser = {
  user_id: string;
  deleted: number;
  freed_bytes: number;
  orphans?: Array<{ key: string; url: string; size_bytes: number; created_at: string }>;
};

type Run = {
  id: string;
  started_at: string;
  finished_at: string | null;
  dry_run: boolean;
  users_scanned: number;
  total_deleted: number;
  total_freed_bytes: number;
  per_user: PerUser[];
  error: string | null;
};

function fmtBytes(n: number) {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 2 : 1)} ${units[i]}`;
}

export default function AdminStorageCleanup() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("r2_cleanup_runs" as any)
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50);
    if (error) toast.error(error.message);
    else setRuns((data as unknown as Run[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-display text-2xl font-bold text-foreground">Storage Cleanup Runs</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Nightly at 03:15 UTC, orphan R2 files older than 24h are swept for users active in the last
        30 days. Manual triggers happen server-side (pg_cron) — this page is read-only history.
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : runs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No cleanup runs recorded yet. The next nightly run will appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => (
            <Card key={run.id} className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-base font-body">
                      {new Date(run.started_at).toLocaleString()}
                      {run.dry_run && (
                        <Badge variant="outline" className="ml-2">
                          <Eye className="w-3 h-3 mr-1" /> dry run
                        </Badge>
                      )}
                      {run.error && (
                        <Badge variant="destructive" className="ml-2">
                          error
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {run.finished_at
                        ? `Finished in ${Math.round(
                            (new Date(run.finished_at).getTime() -
                              new Date(run.started_at).getTime()) /
                              1000,
                          )}s`
                        : "In progress…"}
                    </p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Users</div>
                      <div className="font-mono">{run.users_scanned}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">
                        {run.dry_run ? "Would delete" : "Deleted"}
                      </div>
                      <div className="font-mono">{run.total_deleted}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">
                        {run.dry_run ? "Would free" : "Freed"}
                      </div>
                      <div className="font-mono">{fmtBytes(run.total_freed_bytes)}</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {run.per_user?.length > 0 && (
                <CardContent className="pt-0">
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Show per-user breakdown ({run.per_user.length})
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User ID</TableHead>
                            <TableHead className="text-right">
                              {run.dry_run ? "Would delete" : "Deleted"}
                            </TableHead>
                            <TableHead className="text-right">
                              {run.dry_run ? "Would free" : "Freed"}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {run.per_user.map((u) => (
                            <TableRow key={u.user_id}>
                              <TableCell className="font-mono text-xs">{u.user_id}</TableCell>
                              <TableCell className="text-right">{u.deleted}</TableCell>
                              <TableCell className="text-right">
                                {fmtBytes(u.freed_bytes)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              )}
              {run.error && (
                <CardContent className="pt-0">
                  <pre className="text-xs text-destructive bg-destructive/5 p-2 rounded overflow-x-auto">
                    {run.error}
                  </pre>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}