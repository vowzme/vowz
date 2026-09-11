import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Crown, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { usePricingRegion } from "@/hooks/use-pricing-region";
import PayPalCheckoutButton from "@/components/PayPalCheckoutButton";
import CheckoutSteps from "@/components/CheckoutSteps";
import PaymentHelpModal from "@/components/PaymentHelpModal";

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

const BuyLuxeButton = ({
  variant = "gold", size = "default", className, label = "Unlock LUXE cards", onPurchased,
}: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { region, setRegion, detectedRegion, isManualOverride, pricing } = usePricingRegion();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const currency = region === "IN" ? "INR" : "USD";
  const symbol = region === "IN" ? "₹" : "$";
  const price = pricing.luxePrice;

  const handleClick = () => {
    if (!user) { navigate("/auth"); return; }
    setOpen(true);
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("razorpay-payment", {
        body: { action: "create_order", product_type: "luxe_cards", currency, final_amount: price * 100 },
      });
      if (error) throw new Error(error.message || "Could not start payment.");
      if (!data?.success) throw new Error(data?.error || "Could not start payment.");
      if (data.already_owned) {
        toast({ title: "You already have LUXE", description: "Your LUXE designs are unlocked." });
        setOpen(false);
        onPurchased?.();
        return;
      }

      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) throw new Error("Unable to load checkout.");

      const rzp = new window.Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "Vowz",
        description: data.description,
        order_id: data.order_id,
        prefill: data.prefill || { email: user!.email || "" },
        notes: { product_type: "luxe_cards" },
        handler: async (response: any) => {
          try {
            const { data: verify, error: vErr } = await supabase.functions.invoke("razorpay-payment", {
              body: {
                action: "verify_payment",
                product_type: "luxe_cards",
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              },
            });
            if (vErr) throw new Error(vErr.message);
            if (!verify?.success) throw new Error(verify?.error || "Verification failed.");
            toast({ title: "LUXE unlocked 👑", description: "Your opening-reveal designs are ready." });
            setOpen(false);
            onPurchased?.();
          } catch (e: any) {
            toast({ title: "Verification failed", description: e?.message, variant: "destructive" });
          }
        },
      });
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
        <Crown className="w-4 h-4" /> {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Crown className="w-5 h-5 text-gold" /> Unlock LUXE invitation cards
            </DialogTitle>
            <DialogDescription>
              A one-time unlock for the LUXE designs — guests pull a rope, ring a bell, break a wax seal
              or part a curtain before your invitation appears. Yours for life, on every card you make.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <CheckoutSteps current={1} />

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
                    region === "IN" ? "bg-background shadow-sm text-foreground ring-1 ring-primary/40" : "text-muted-foreground hover:text-foreground"
                  }`}
                >🇮🇳 India</button>
                <button
                  type="button"
                  onClick={() => setRegion("INTL")}
                  className={`text-sm py-2 rounded-md font-medium transition-all ${
                    region === "INTL" ? "bg-background shadow-sm text-foreground ring-1 ring-primary/40" : "text-muted-foreground hover:text-foreground"
                  }`}
                >🌍 International</button>
              </div>
            </div>

            <div className="text-center py-3 bg-muted/30 rounded-lg">
              <p className="text-3xl font-display font-bold text-foreground">{symbol}{price}</p>
              <p className="text-xs text-muted-foreground mt-1">One-time · no renewal</p>
            </div>

            <div className="rounded-md bg-muted/40 border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  {region === "IN" ? <><span>🇮🇳</span> India payments</> : <><span>🌍</span> International payments</>}
                </p>
                <PaymentHelpModal />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {region === "IN"
                  ? "Razorpay is recommended for India — UPI, NetBanking, cards and wallets. If it doesn't work, switch to International above."
                  : "Pay with your international card or PayPal account."}
              </p>
            </div>

            {region === "IN" ? (
              <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold flex items-center gap-1.5"><span className="text-base">🇮🇳</span> India payment</p>
                  <span className="text-[10px] uppercase tracking-wide bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold">Best for you</span>
                </div>
                <Button className="w-full" onClick={handlePay} disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : `Pay with Razorpay · ${symbol}${price}`}
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold flex items-center gap-1.5"><span className="text-base">🌍</span> International payment</p>
                  <span className="text-[10px] uppercase tracking-wide bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold">Best for you</span>
                </div>
                <PayPalCheckoutButton
                  productType="luxe_cards"
                  currency="USD"
                  onSuccess={() => {
                    toast({ title: "LUXE unlocked 👑", description: "Your opening-reveal designs are ready." });
                    setOpen(false);
                    onPurchased?.();
                  }}
                />
              </div>
            )}

            <p className="text-[11px] text-center text-muted-foreground">
              Not the right region?{" "}
              <button type="button" className="underline hover:text-foreground" onClick={() => setRegion(region === "IN" ? "INTL" : "IN")}>
                Switch to {region === "IN" ? "International 🌍" : "India 🇮🇳"}
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BuyLuxeButton;
