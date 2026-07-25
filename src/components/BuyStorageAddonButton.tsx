import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, HardDrive, Plus, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { usePricingRegion } from "@/hooks/use-pricing-region";
import PayPalCheckoutButton from "@/components/PayPalCheckoutButton";
import DodoCheckoutButton from "@/components/DodoCheckoutButton";

declare global {
  interface Window { Razorpay?: any; }
}

const loadRazorpay = async () => {
  if (window.Razorpay) return true;
  return new Promise<boolean>((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
};

interface Props {
  variant?: "default" | "outline" | "gold" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
  label?: string;
  onPurchased?: () => void;
}

const BuyStorageAddonButton = ({ variant = "outline", size = "sm", className, label = "Buy +2 GB", onPurchased }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { region, setRegion, detectedRegion, isManualOverride, pricing } = usePricingRegion();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const currency = region === "IN" ? "INR" : "USD";
  const symbol = region === "IN" ? "₹" : "$";
  const price = pricing.storageAddonPrice;

  const handleClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setOpen(true);
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("razorpay-payment", {
        body: { action: "create_order", product_type: "storage_addon", currency, final_amount: price * 100 },
      });
      if (error) throw new Error(error.message || "Could not start payment.");
      if (!data?.success) throw new Error(data?.error || "Could not start payment.");

      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) throw new Error("Unable to load checkout.");

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "Vowz",
        description: data.description,
        order_id: data.order_id,
        prefill: data.prefill || { email: user!.email || "" },
        notes: { product_type: "storage_addon" },
        handler: async (response: any) => {
          try {
            const { data: verify, error: vErr } = await supabase.functions.invoke("razorpay-payment", {
              body: {
                action: "verify_payment",
                product_type: "storage_addon",
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              },
            });
            if (vErr) throw new Error(vErr.message);
            if (!verify?.success) throw new Error(verify?.error || "Verification failed.");
            toast({ title: "Payment successful 🎉", description: "+2 GB added. Redirecting to your dashboard…" });
            setOpen(false);
            onPurchased?.();
            navigate("/dashboard");
          } catch (e: any) {
            toast({ title: "Verification failed", description: e?.message, variant: "destructive" });
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        toast({ title: "Payment failed", description: "Please try again.", variant: "destructive" });
      });
      rzp.open();
    } catch (e: any) {
      toast({ title: "Could not start payment", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant={variant as any} size={size as any} className={className} onClick={handleClick}>
        <Plus className="w-4 h-4" /> {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-primary" />
              Buy Storage Add-on
            </DialogTitle>
            <DialogDescription>
              Add <strong>+2 GB</strong> of cloud storage to your account, valid for 6 months. Stackable — buy multiple if you need more.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Country toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Where are you paying from?
                </label>
                {detectedRegion && !isManualOverride && (
                  <span className="text-[10px] inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-3 h-3" /> Auto-detected
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setRegion("IN")}
                  className={`text-sm py-2 rounded-md font-medium transition-all ${
                    region === "IN"
                      ? "bg-background shadow-sm text-foreground ring-1 ring-primary/40"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🇮🇳 India
                </button>
                <button
                  type="button"
                  onClick={() => setRegion("INTL")}
                  className={`text-sm py-2 rounded-md font-medium transition-all ${
                    region === "INTL"
                      ? "bg-background shadow-sm text-foreground ring-1 ring-primary/40"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🌍 International
                </button>
              </div>
            </div>

            <div className="text-center py-3 bg-muted/30 rounded-lg">
              <p className="text-3xl font-display font-bold text-foreground">{symbol}{price}</p>
              <p className="text-xs text-muted-foreground mt-1">One-time, 6 months validity</p>
            </div>
            {region === "IN" ? (
            <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <span className="text-base">🇮🇳</span> India payment
                </p>
                <span className="text-[10px] uppercase tracking-wide bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold">Best for you</span>
              </div>
              <p className="text-xs text-muted-foreground">UPI, Netbanking, Cards or Wallets via Razorpay.</p>
              <Button className="w-full" onClick={handlePay} disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : `Pay with Razorpay · ${symbol}${price}`}
              </Button>
            </div>
            ) : (
              <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <span className="text-base">🌍</span> International payment
                  </p>
                  <span className="text-[10px] uppercase tracking-wide bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold">Best for you</span>
                </div>
                <p className="text-xs text-muted-foreground">Use your international card or PayPal account.</p>
                <PayPalCheckoutButton
                  productType="storage_addon"
                  currency="USD"
                  onSuccess={() => {
                    setOpen(false);
                    onPurchased?.();
                    navigate("/dashboard");
                  }}
                />
                <DodoCheckoutButton
                  productType="storage_addon"
                  currency="USD"
                  finalAmount={price}
                  onSuccess={() => {
                    setOpen(false);
                    onPurchased?.();
                  }}
                  label={`Pay with Card (Dodo) · $${price}`}
                />
              </div>
            )}
            <p className="text-[11px] text-center text-muted-foreground">
              Not the right region?{" "}
              <button
                type="button"
                className="underline hover:text-foreground"
                onClick={() => setRegion(region === "IN" ? "INTL" : "IN")}
              >
                Switch to {region === "IN" ? "International 🌍" : "India 🇮🇳"}
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BuyStorageAddonButton;
