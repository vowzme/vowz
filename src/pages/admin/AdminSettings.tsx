import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Shield } from "lucide-react";

interface AdminEmail {
  id: string;
  email: string;
  created_at: string;
}

export default function AdminSettings() {
  const [emails, setEmails] = useState<AdminEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);

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
    </div>
  );
}
