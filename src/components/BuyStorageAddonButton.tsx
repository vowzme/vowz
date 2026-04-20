import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, HardDrive, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { usePricingRegion } from "@/hooks/use-pricing-region";

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
  const { region, pricing } = usePricingRegion();
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
            toast({ title: "+2 GB added 🎉", description: "Your storage add-on is active for 6 months." });
            setOpen(false);
            onPurchased?.();
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
            <div className="text-center py-3 bg-muted/30 rounded-lg">
              <p className="text-3xl font-display font-bold text-foreground">{symbol}{price}</p>
              <p className="text-xs text-muted-foreground mt-1">One-time, 6 months validity</p>
            </div>
            <Button className="w-full" onClick={handlePay} disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : `Pay ${symbol}${price}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BuyStorageAddonButton;
