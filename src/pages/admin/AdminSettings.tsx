import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Shield, HardDriveUpload, Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AdminEmail {
  id: string;
  email: string;
  created_at: string;
}

export default function AdminSettings() {
  const [emails, setEmails] = useState<AdminEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationReport, setMigrationReport] = useState<any>(null);

  const runR2Migration = async (dryRun: boolean) => {
    setMigrating(true);
    setMigrationReport(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/migrate-to-r2`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ dryRun }),
        }
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        toast({ title: "Migration failed", description: data.error, variant: "destructive" });
      } else {
        setMigrationReport(data.report);
        toast({
          title: dryRun ? "Dry run complete" : "Migration complete",
          description: `Copied ${data.report.copied_files}, skipped ${data.report.skipped_files}, rewrote ${data.report.rewritten_sites} sites.`,
        });
      }
    } catch (e: any) {
      toast({ title: "Migration error", description: e.message, variant: "destructive" });
    } finally {
      setMigrating(false);
    }
  };

  const fetchEmails = async () => {
    const { data } = await supabase.from("admin_emails").select("*").order("created_at");
    setEmails((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const addEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      toast({ title: "Invalid email", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("admin_emails").insert({ email: newEmail.trim().toLowerCase() } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Added", description: `${newEmail} is now an admin.` });
      setNewEmail("");
      fetchEmails();
    }
  };

  const removeEmail = async (id: string, email: string) => {
    const { error } = await supabase.from("admin_emails").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Removed", description: `${email} removed from admins.` });
      fetchEmails();
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Admin Settings</h1>

      <Card className="border-border/50 max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(var(--navy))] to-[hsl(var(--maroon-light))] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[hsl(var(--gold))]" />
            </div>
            <div>
              <CardTitle className="font-display text-lg">Admin Email Whitelist</CardTitle>
              <CardDescription className="font-body">
                Only users with these emails can access the admin panel.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="admin@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEmail()}
              className="font-body"
            />
            <Button variant="gold" size="sm" onClick={addEmail}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : emails.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body py-4 text-center">
              No admin emails configured. Add your email to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {emails.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-body text-xs">Admin</Badge>
                    <span className="font-body text-sm">{e.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeEmail(e.id, e.email)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* R2 Migration Card */}
      <Card className="border-border/50 max-w-2xl mt-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(var(--navy))] to-[hsl(var(--maroon-light))] flex items-center justify-center">
              <HardDriveUpload className="w-5 h-5 text-[hsl(var(--gold))]" />
            </div>
            <div>
              <CardTitle className="font-display text-lg">Migrate Storage to Cloudflare R2</CardTitle>
              <CardDescription className="font-body">
                One-time copy of all wedding-photos, wedding-logos, and blessing-photos from Supabase Storage to Cloudflare R2. Rewrites URLs in published sites. Idempotent — safe to re-run.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={migrating} onClick={() => runR2Migration(true)}>
              {migrating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              Dry run
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="gold" size="sm" disabled={migrating}>
                  {migrating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <HardDriveUpload className="w-4 h-4 mr-1" />}
                  Run migration
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Migrate all storage to R2?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will copy every file from Supabase Storage buckets into Cloudflare R2 under the <code>_migrated/</code> prefix and update URLs in <code>wedding_sites</code>. The operation is idempotent. Old Supabase files are <strong>not deleted</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => runR2Migration(false)}>Run migration</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {migrationReport && (
            <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono space-y-1 mt-3">
              <div>Scanned: <strong>{migrationReport.scanned_files}</strong></div>
              <div>Copied: <strong className="text-primary">{migrationReport.copied_files}</strong></div>
              <div>Skipped (already in R2): <strong>{migrationReport.skipped_files}</strong></div>
              <div>Failed: <strong className={migrationReport.failed_files > 0 ? "text-destructive" : ""}>{migrationReport.failed_files}</strong></div>
              <div>Sites rewritten: <strong>{migrationReport.rewritten_sites}</strong></div>
              {migrationReport.errors?.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-destructive">{migrationReport.errors.length} errors</summary>
                  <ul className="mt-1 list-disc pl-4 text-destructive/90 break-all">
                    {migrationReport.errors.slice(0, 20).map((e: string, i: number) => <li key={i}>{e}</li>)}
                  </ul>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
