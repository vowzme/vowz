import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Crown, Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { usePricingRegion } from "@/hooks/use-pricing-region";

interface PremiumUpgradeButtonProps {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  label?: string;
  showIcon?: boolean;
  onUpgraded?: () => void;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const loadRazorpayCheckout = async () => {
  if (window.Razorpay) return true;

  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PremiumUpgradeButton = ({
  variant = "gold",
  size = "lg",
  className,
  label = "Upgrade to Premium",
  showIcon = true,
  onUpgraded,
}: PremiumUpgradeButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { region } = usePricingRegion();

  const handleUpgrade = async () => {
    if (!user) {
      const basePath = `${location.pathname}${location.search || ""}`;
      const redirect = basePath.includes("?") ? `${basePath}&upgrade=1` : `${basePath}?upgrade=1`;
      navigate(`/auth?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("razorpay-payment", {
        body: { action: "create_order", currency: region === "IN" ? "INR" : "USD" },
      });

      if (error) throw new Error(error.message || "Could not start payment.");
      if (!data?.success) throw new Error(data?.error || "Could not start payment.");

      if (data.already_premium) {
        toast({ title: "Premium already active", description: "Your account is already upgraded." });
        onUpgraded?.();
        return;
      }

      const sdkLoaded = await loadRazorpayCheckout();
      if (!sdkLoaded || !window.Razorpay) {
        throw new Error("Unable to load checkout. Please disable blockers and try again.");
      }

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: data.name || "Vowz",
        description: data.description || "Premium Plan (1 Year)",
        order_id: data.order_id,
        prefill: data.prefill || { email: user.email || "" },
        notes: { plan: "premium_yearly" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke("razorpay-payment", {
              body: {
                action: "verify_payment",
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              },
            });

            if (verifyError) throw new Error(verifyError.message || "Payment verification failed.");
            if (!verifyData?.success) throw new Error(verifyData?.error || "Payment verification failed.");

            toast({ title: "Payment successful 🎉", description: "Premium has been activated." });
            onUpgraded?.();

            if (!onUpgraded) {
              navigate("/dashboard");
            }
          } catch (verifyErr: any) {
            toast({
              title: "Payment verification failed",
              description: verifyErr?.message || "Please contact support with your payment details.",
              variant: "destructive",
            });
          }
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", () => {
        toast({
          title: "Payment failed",
          description: "Your payment was not completed. Please try again.",
          variant: "destructive",
        });
      });
      paymentObject.open();
    } catch (err: any) {
      toast({
        title: "Unable to start payment",
        description: err?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handleUpgrade} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Processing...
        </>
      ) : (
        <>
          {showIcon && <Crown className="w-4 h-4" />} {label}
        </>
      )}
    </Button>
  );
};

export default PremiumUpgradeButton;
