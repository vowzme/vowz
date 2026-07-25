import { useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

interface Props {
  productType: "premium" | "storage_addon";
  currency: "USD" | "EUR" | "GBP";
  finalAmount: number;
  couponCode?: string;
  affiliateRef?: string | null;
  onSuccess?: () => void;
  disabled?: boolean;
  label?: string;
}

const DodoCheckoutButton = ({
  productType,
  currency,
  finalAmount,
  couponCode,
  affiliateRef,
  onSuccess,
  disabled,
  label = "Pay with Dodo",
}: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to continue." });
      return;
    }
    setLoading(true);
    try {
      const returnUrl = `${window.location.origin}/dashboard/payments?dodo=return`;
      const { data, error } = await supabase.functions.invoke("dodo-payment", {
        body: {
          product_type: productType,
          currency,
          final_amount: Math.round(finalAmount * 100),
          coupon_code: couponCode,
          affiliate_ref: affiliateRef,
          return_url: returnUrl,
        },
      });
      if (error) throw new Error(error.message || "Could not start Dodo checkout.");
      if (!data?.success) throw new Error(data?.error || "Could not start Dodo checkout.");
      if (data.already_premium) {
        toast({ title: "Premium already active", description: "Your account is already upgraded." });
        onSuccess?.();
        return;
      }
      if (!data.payment_link) throw new Error("No checkout link returned.");

      // Open Dodo hosted checkout in a new tab so the user can return to the
      // app and we can refresh entitlement. The return_url sends them to
      // /dashboard/payments when Dodo finishes.
      window.open(data.payment_link, "_blank", "noopener,noreferrer");
      toast({
        title: "Checkout opened",
        description: "Complete payment on Dodo. Return here to see your receipt.",
      });
      onSuccess?.();
    } catch (e: any) {
      toast({ title: "Dodo checkout failed", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      className="w-full"
      variant="outline"
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…</>
      ) : (
        <><ExternalLink className="w-4 h-4 mr-2" /> {label}</>
      )}
    </Button>
  );
};

export default DodoCheckoutButton;
