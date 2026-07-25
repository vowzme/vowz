import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { CalendarClock, Loader2, Save } from "lucide-react";

export default function BillingTermsCard() {
  const [premium, setPremium] = useState<number>(6);
  const [storage, setStorage] = useState<number>(6);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("billing_terms")
      .select("premium_months, storage_months, updated_at")
      .eq("id", 1)
      .maybeSingle();
    if (error) {
      toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    } else if (data) {
      setPremium(Number(data.premium_months) || 6);
      setStorage(Number(data.storage_months) || 6);
      setUpdatedAt(data.updated_at || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const clamp = (n: number) => Math.min(60, Math.max(1, Math.round(n || 0)));

  const save = async () => {
    const p = clamp(premium);
    const s = clamp(storage);
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await (supabase as any)
      .from("billing_terms")
      .upsert(
        {
          id: 1,
          premium_months: p,
          storage_months: s,
          updated_at: new Date().toISOString(),
          updated_by: userRes.user?.id ?? null,
        },
        { onConflict: "id" },
      );
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Billing terms updated",
        description: `Premium ${p}m · Storage ${s}m. New checkouts use these terms immediately.`,
      });
      setPremium(p);
      setStorage(s);
      load();
    }
  };

  return (
    <Card className="border-border/50 max-w-2xl mt-6">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(var(--navy))] to-[hsl(var(--maroon-light))] flex items-center justify-center">
            <CalendarClock className="w-5 h-5 text-[hsl(var(--gold))]" />
          </div>
          <div>
            <CardTitle className="font-display text-lg">Subscription Term Lengths</CardTitle>
            <CardDescription className="font-body">
              How many months a paid Premium subscription and a storage add-on stay active
              after a successful checkout. Applies to Razorpay, PayPal and Dodo. Existing
              subscriptions keep their original expiry.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="premium-months" className="font-body">
                  Premium plan (months)
                </Label>
                <Input
                  id="premium-months"
                  type="number"
                  min={1}
                  max={60}
                  value={premium}
                  onChange={(e) => setPremium(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground font-body">
                  Currently: {premium} month{premium === 1 ? "" : "s"}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="storage-months" className="font-body">
                  Storage add-on (months)
                </Label>
                <Input
                  id="storage-months"
                  type="number"
                  min={1}
                  max={60}
                  value={storage}
                  onChange={(e) => setStorage(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground font-body">
                  Currently: {storage} month{storage === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground font-body">
                {updatedAt ? `Last updated ${new Date(updatedAt).toLocaleString()}` : ""}
              </p>
              <Button variant="gold" size="sm" onClick={save} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Save terms
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}