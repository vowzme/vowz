import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Crown, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { usePricingRegion } from "@/hooks/use-pricing-region";
import { getStoredAffiliateRef } from "@/hooks/use-affiliate";
import CouponCodeInput from "@/components/CouponCodeInput";
import PayPalCheckoutButton from "@/components/PayPalCheckoutButton";
import DodoCheckoutButton from "@/components/DodoCheckoutButton";
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
  type PayStatus = "idle" | "verifying" | "syncing" | "failed" | "timeout";
  const [payStatus, setPayStatus] = useState<PayStatus>("idle");
  const [payError, setPayError] = useState<string | null>(null);

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
    setPayStatus("idle");
    setPayError(null);
    setCheckoutOpen(true);
  };

  const handlePay = async () => {
    setLoading(true);
    setPayError(null);
    setPayStatus("idle");
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

      // Note: coupon redemption logging and times_used increment are handled
      // server-side in the razorpay-payment edge function after payment verification.

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
            setPayStatus("verifying");
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

            // Confirm the premium entitlement is actually active in the backend
            // before celebrating — protects against a verified payment that
            // failed to persist the subscription row for any reason.
            // Poll up to ~20s to cover webhook latency before redirecting.
            setPayStatus("syncing");
            let entitled = false;
            for (let attempt = 0; attempt < 10 && !entitled; attempt++) {
              const { data: rpcData, error: rpcErr } = await supabase.rpc("user_has_premium", {
                _user_id: user!.id,
              });
              if (!rpcErr && rpcData === true) {
                entitled = true;
                break;
              }
              await new Promise((r) => setTimeout(r, 2000));
            }

            if (!entitled) {
              setPayStatus("timeout");
              setPayError(
                "Payment received but premium is still syncing. This can take a minute — retry the check, or contact support if it doesn't appear."
              );
              return;
            }

            toast({ title: "Payment successful 🎉", description: "Premium has been activated. Redirecting to your dashboard…" });
            onUpgraded?.();
            setCheckoutOpen(false);
            navigate("/dashboard");
          } catch (verifyErr: any) {
            setPayStatus("failed");
            setPayError(verifyErr?.message || "Payment verification failed. Please try again or contact support.");
          }
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", (resp: any) => {
        setPayStatus("failed");
        setPayError(resp?.error?.description || "Your payment was not completed. Please try again.");
      });
      paymentObject.open();
    } catch (err: any) {
      setPayStatus("failed");
      setPayError(err?.message || "Unable to start payment. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const recheckEntitlement = async () => {
    if (!user) return;
    setPayStatus("syncing");
    setPayError(null);
    for (let attempt = 0; attempt < 10; attempt++) {
      const { data: rpcData, error: rpcErr } = await supabase.rpc("user_has_premium", {
        _user_id: user.id,
      });
      if (!rpcErr && rpcData === true) {
        toast({ title: "Premium activated 🎉", description: "Redirecting to your dashboard…" });
        onUpgraded?.();
        setCheckoutOpen(false);
        navigate("/dashboard");
        return;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    setPayStatus("timeout");
    setPayError("Still not active. Please contact support with your payment ID.");
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

            {payStatus === "verifying" || payStatus === "syncing" ? (
              <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 border border-border text-sm">
                <Loader2 className="w-4 h-4 animate-spin mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">
                    {payStatus === "verifying" ? "Verifying payment…" : "Activating premium…"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Please don't close this window.
                  </p>
                </div>
              </div>
            ) : payStatus === "failed" || payStatus === "timeout" ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">
                      {payStatus === "timeout" ? "Still syncing" : "Payment didn't complete"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{payError}</p>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={payStatus === "timeout" ? recheckEntitlement : handlePay}
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Please wait…</>
                  ) : payStatus === "timeout" ? (
                    <><CheckCircle2 className="w-4 h-4" /> Check again</>
                  ) : (
                    "Try again"
                  )}
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={handlePay} disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : `Pay from India · ${symbol}${finalPrice}`}
              </Button>
            )}

            {region === "INTL" && payStatus !== "verifying" && payStatus !== "syncing" && (
              <div className="space-y-2">
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">International payments</span>
                  </div>
                </div>
                <PayPalCheckoutButton
                  productType="premium"
                  currency="USD"
                  onSuccess={() => {
                    onUpgraded?.();
                    setCheckoutOpen(false);
                    navigate("/dashboard");
                  }}
                />
                <DodoCheckoutButton
                  productType="premium"
                  currency="USD"
                  finalAmount={finalPrice}
                  couponCode={couponResult?.valid ? couponResult.code : undefined}
                  affiliateRef={affiliateRef}
                  onSuccess={() => {
                    onUpgraded?.();
                    setCheckoutOpen(false);
                  }}
                  label={`Pay with Dodo · ${symbol}${finalPrice}`}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PremiumUpgradeButton;
