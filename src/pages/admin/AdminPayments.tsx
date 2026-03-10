import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { CreditCard, IndianRupee, Wallet } from "lucide-react";

interface PaymentProvider {
  id: string;
  provider: string;
  is_enabled: boolean;
  config: Record<string, string>;
}

const providerMeta: Record<string, { label: string; icon: React.ElementType; fields: { key: string; label: string; type?: string }[] }> = {
  razorpay: {
    label: "Razorpay",
    icon: IndianRupee,
    fields: [
      { key: "key_id", label: "Key ID" },
      { key: "key_secret", label: "Key Secret", type: "password" },
    ],
  },
  phonepe: {
    label: "PhonePe",
    icon: Wallet,
    fields: [
      { key: "merchant_id", label: "Merchant ID" },
      { key: "salt_key", label: "Salt Key", type: "password" },
      { key: "salt_index", label: "Salt Index" },
    ],
  },
  paypal: {
    label: "PayPal",
    icon: CreditCard,
    fields: [
      { key: "client_id", label: "Client ID" },
      { key: "client_secret", label: "Client Secret", type: "password" },
      { key: "mode", label: "Mode (sandbox/live)" },
    ],
  },
};

export default function AdminPayments() {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("payment_config")
        .select("*")
        .order("provider");
      setProviders((data as any[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const updateField = (providerId: string, key: string, value: string) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? { ...p, config: { ...p.config, [key]: value } }
          : p
      )
    );
  };

  const toggleEnabled = (providerId: string) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId ? { ...p, is_enabled: !p.is_enabled } : p
      )
    );
  };

  const saveProvider = async (provider: PaymentProvider) => {
    setSaving(provider.id);
    const { error } = await supabase
      .from("payment_config")
      .update({
        is_enabled: provider.is_enabled,
        config: provider.config as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", provider.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `${provider.provider} config updated.` });
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">Payment Gateways</h1>
      <p className="font-body text-muted-foreground mb-6">
        Configure payment providers for premium subscriptions.
      </p>

      <div className="grid gap-6">
        {providers.map((p) => {
          const meta = providerMeta[p.provider];
          if (!meta) return null;
          const Icon = meta.icon;

          return (
            <Card key={p.id} className={`border-border/50 ${p.is_enabled ? "ring-1 ring-[hsl(var(--gold))]/30" : ""}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="font-display text-lg">{meta.label}</CardTitle>
                      <CardDescription className="font-body text-xs">
                        {p.provider === "razorpay" && "UPI, Cards, Netbanking — India"}
                        {p.provider === "phonepe" && "UPI payments — India"}
                        {p.provider === "paypal" && "International cards & PayPal"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.is_enabled ? "default" : "outline"} className={p.is_enabled ? "bg-emerald/20 text-emerald border-emerald/30" : ""}>
                      {p.is_enabled ? "Active" : "Disabled"}
                    </Badge>
                    <Switch checked={p.is_enabled} onCheckedChange={() => toggleEnabled(p.id)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {meta.fields.map((f) => (
                    <div key={f.key} className="space-y-1.5">
                      <Label className="font-body text-sm">{f.label}</Label>
                      <Input
                        type={f.type ?? "text"}
                        value={p.config[f.key] ?? ""}
                        onChange={(e) => updateField(p.id, f.key, e.target.value)}
                        placeholder={`Enter ${f.label.toLowerCase()}`}
                        className="font-body"
                      />
                    </div>
                  ))}
                </div>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => saveProvider(p)}
                  disabled={saving === p.id}
                >
                  {saving === p.id ? "Saving..." : "Save Configuration"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
