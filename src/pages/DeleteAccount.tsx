import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";
import { AlertTriangle } from "lucide-react";

export default function DeleteAccount() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      toast({ title: "Please type DELETE to confirm", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-my-account", {
        body: { confirm: true },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await signOut().catch(() => {});
      toast({ title: "Your account has been deleted." });
      navigate("/", { replace: true });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <SEOHead
        title="Delete Your Account | Vowz"
        description="Permanently delete your Vowz account and all associated data, including wedding sites, RSVPs, guest blessings, and subscriptions."
      />
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl font-bold mb-2">Delete Your Account</h1>
        <p className="font-body text-muted-foreground mb-6">
          This page lets you permanently delete your Vowz (me.vowz.twa) account and all data associated with it.
        </p>

        <Card className="mb-6 border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg">What will be deleted</CardTitle>
            <CardDescription className="font-body">
              Deletion is permanent and cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="font-body text-sm space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li>Your account and login credentials</li>
              <li>Profile details (name, partner name, wedding date, email)</li>
              <li>All wedding sites you created and their content</li>
              <li>RSVPs, guest blessings, guestbook entries, polls, and analytics</li>
              <li>Uploaded photos, logos, and other media</li>
              <li>Subscription records (active subscriptions are cancelled)</li>
            </ul>
            <p className="pt-3 text-muted-foreground">
              Some records may be retained for a limited period where required by law (for example,
              payment/invoice records for tax compliance) or in aggregated, anonymised form.
            </p>
          </CardContent>
        </Card>

        {user ? (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" /> Delete this account
              </CardTitle>
              <CardDescription className="font-body">
                Signed in as <span className="font-medium">{user.email}</span>. Type <b>DELETE</b> to confirm.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="font-body"
              />
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={busy || confirmText.trim().toUpperCase() !== "DELETE"}
                className="w-full"
              >
                {busy ? "Deleting…" : "Permanently delete my account"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Sign in to delete your account</CardTitle>
              <CardDescription className="font-body">
                For your security, you must sign in to delete your account. If you no longer have access
                to your account, email <a className="underline" href="mailto:support@vowz.me">support@vowz.me</a>{" "}
                from your registered address and we will process the deletion within 30 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="gold" className="w-full">
                <Link to="/auth?redirect=/delete-account">Sign in to continue</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="font-body text-xs text-muted-foreground mt-6">
          App: Vowz (package <code>me.vowz.twa</code>) · Developer: Vowz ·{" "}
          <Link to="/privacy" className="underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}