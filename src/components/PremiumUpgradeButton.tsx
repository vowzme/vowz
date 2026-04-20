import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Crown, Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { usePricingRegion } from "@/hooks/use-pricing-region";
import { getStoredAffiliateRef } from "@/hooks/use-affiliate";
import CouponCodeInput from "@/components/CouponCodeInput";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

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

const AFFILIATE_DISCOUNT = { IN: 250, INTL: 5 };

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
  const { region, pricing } = usePricingRegion();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [couponResult, setCouponResult] = useState<any>(null);
  const [affiliateRef, setAffiliateRef] = useState<string | null>(null);

  const originalPrice = pricing.premiumPrice;
  const currency = region === "IN" ? "INR" : "USD";
  const symbol = region === "IN" ? "₹" : "$";
  const affiliateDiscount = AFFILIATE_DISCOUNT[region];

  // Check for stored affiliate ref
  useEffect(() => {
    const ref = getStoredAffiliateRef();
    if (ref) setAffiliateRef(ref);
  }, []);

  // Calculate final price: affiliate discount first, then coupon on top
  const hasAffiliate = !!affiliateRef;
  const afterAffiliatePrice = hasAffiliate ? originalPrice - affiliateDiscount : originalPrice;
  const finalPrice = couponResult?.valid ? couponResult.final_price : afterAffiliatePrice;

  const handleClick = () => {
    if (!user) {
      const basePath = `${location.pathname}${location.search || ""}`;
      const redirect = basePath.includes("?") ? `${basePath}&upgrade=1` : `${basePath}?upgrade=1`;
      navigate(`/auth?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    setCheckoutOpen(true);
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("razorpay-payment", {
        body: {
          action: "create_order",
          currency,
          coupon_code: couponResult?.valid ? couponResult.code : undefined,
          affiliate_ref: affiliateRef || undefined,
          final_amount: Math.round(finalPrice * 100),
        },
      });

      if (error) throw new Error(error.message || "Could not start payment.");
      if (!data?.success) throw new Error(data?.error || "Could not start payment.");

      if (data.already_premium) {
        toast({ title: "Premium already active", description: "Your account is already upgraded." });
        onUpgraded?.();
        setCheckoutOpen(false);
        return;
      }

      // Log coupon redemption
      if (couponResult?.valid && couponResult.coupon_id) {
        await supabase.from("coupon_redemptions").insert({
          coupon_id: couponResult.coupon_id,
          user_id: user!.id,
          discount_applied: couponResult.discount_amount,
          currency,
          original_amount: originalPrice,
          final_amount: finalPrice,
        });
        const { data: couponData } = await supabase.from("coupons").select("times_used").eq("id", couponResult.coupon_id).single();
        if (couponData) {
          await supabase.from("coupons").update({ times_used: (couponData as any).times_used + 1 }).eq("id", couponResult.coupon_id);
        }
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
        description: data.description || "Premium Plan (6 Months)",
        order_id: data.order_id,
        prefill: data.prefill || { email: user!.email || "" },
        notes: { plan: "premium_6mo", coupon: couponResult?.code || "", affiliate: affiliateRef || "" },
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
            setCheckoutOpen(false);

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
    <>
      <Button variant={variant} size={size} className={className} onClick={handleClick} disabled={loading}>
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
        ) : (
          <>{showIcon && <Crown className="w-4 h-4" />} {label}</>
        )}
      </Button>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Upgrade to Premium</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-3">
              <p className="text-sm text-muted-foreground">Premium Plan (6 Months)</p>

              {hasAffiliate && (
                <div className="mt-2 mb-1 inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full text-xs font-medium">
                  🎉 Referral discount: {symbol}{affiliateDiscount} off!
                </div>
              )}

              {couponResult?.valid ? (
                <div className="space-y-1 mt-2">
                  <p className="text-2xl font-display font-bold text-foreground">
                    {symbol}{finalPrice}
                  </p>
                  <p className="text-sm text-muted-foreground line-through">{symbol}{originalPrice}</p>
                  <p className="text-xs text-emerald-600">
                    You save {symbol}{originalPrice - finalPrice}!
                  </p>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-2xl font-display font-bold text-foreground">{symbol}{afterAffiliatePrice}</p>
                  {hasAffiliate && (
                    <p className="text-sm text-muted-foreground line-through">{symbol}{originalPrice}</p>
                  )}
                </div>
              )}
            </div>

            <CouponCodeInput
              originalPrice={afterAffiliatePrice}
              currency={currency}
              onApply={setCouponResult}
            />

            <Button className="w-full" onClick={handlePay} disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : `Pay ${symbol}${finalPrice}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PremiumUpgradeButton;
