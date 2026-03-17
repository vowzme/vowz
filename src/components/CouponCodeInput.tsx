import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Check, X, Loader2 } from "lucide-react";
import { usePricingRegion } from "@/hooks/use-pricing-region";

interface CouponResult {
  valid: boolean;
  code: string;
  discount_type: string;
  discount_value: number;
  final_price: number;
  original_price: number;
  discount_amount: number;
  message: string;
  coupon_id: string;
}

interface CouponCodeInputProps {
  originalPrice: number;
  currency: string;
  onApply: (result: CouponResult | null) => void;
}

export default function CouponCodeInput({ originalPrice, currency, onApply }: CouponCodeInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CouponResult | null>(null);
  const [error, setError] = useState("");
  const { region } = usePricingRegion();

  const validate = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const trimmed = code.trim().toUpperCase();

      const { data: coupon, error: fetchErr } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", trimmed)
        .eq("status", "active")
        .maybeSingle();

      if (fetchErr || !coupon) {
        setError("Invalid coupon code.");
        onApply(null);
        setLoading(false);
        return;
      }

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at as string) < new Date()) {
        setError("This coupon has expired.");
        onApply(null);
        setLoading(false);
        return;
      }

      // Check scope
      const userScope = region === "IN" ? "india" : "international";
      if ((coupon as any).scope !== "global" && (coupon as any).scope !== userScope) {
        setError("This coupon is not valid for your region.");
        onApply(null);
        setLoading(false);
        return;
      }

      // Check usage
      if ((coupon as any).usage_type !== "unlimited") {
        const maxUses = (coupon as any).max_uses ?? 1;
        if ((coupon as any).times_used >= maxUses) {
          setError("This coupon has reached its usage limit.");
          onApply(null);
          setLoading(false);
          return;
        }
      }

      // Check min order value
      if ((coupon as any).min_order_value && originalPrice < Number((coupon as any).min_order_value)) {
        setError(`Minimum order value is ${currency === "INR" ? "₹" : "$"}${(coupon as any).min_order_value}.`);
        onApply(null);
        setLoading(false);
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if ((coupon as any).discount_type === "percentage") {
        discountAmount = (originalPrice * Number((coupon as any).discount_value)) / 100;
      } else {
        // Fixed amount - use as-is (admin sets currency-appropriate value)
        discountAmount = Number((coupon as any).discount_value);
      }

      // Apply max cap
      if ((coupon as any).max_discount_cap && discountAmount > Number((coupon as any).max_discount_cap)) {
        discountAmount = Number((coupon as any).max_discount_cap);
      }

      discountAmount = Math.min(discountAmount, originalPrice);
      const finalPrice = Math.max(0, originalPrice - discountAmount);

      const res: CouponResult = {
        valid: true,
        code: trimmed,
        discount_type: (coupon as any).discount_type,
        discount_value: Number((coupon as any).discount_value),
        final_price: finalPrice,
        original_price: originalPrice,
        discount_amount: discountAmount,
        message: `${(coupon as any).discount_type === "percentage" ? `${(coupon as any).discount_value}%` : `${currency === "INR" ? "₹" : "$"}${(coupon as any).discount_value}`} discount applied!`,
        coupon_id: coupon.id,
      };

      setResult(res);
      onApply(res);
    } catch {
      setError("Something went wrong. Try again.");
      onApply(null);
    }
    setLoading(false);
  };

  const clear = () => {
    setCode("");
    setResult(null);
    setError("");
    onApply(null);
  };

  const symbol = currency === "INR" ? "₹" : "$";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Ticket className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Have a coupon code?</span>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Enter code"
          className="font-mono uppercase"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
          disabled={!!result}
        />
        {result ? (
          <Button variant="outline" size="sm" onClick={clear}><X className="w-4 h-4" /></Button>
        ) : (
          <Button size="sm" onClick={validate} disabled={loading || !code.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {result && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <Check className="w-4 h-4 text-emerald-600" />
          <span className="text-sm text-emerald-700 dark:text-emerald-400">{result.message}</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {symbol}{result.original_price} → <strong>{symbol}{result.final_price}</strong>
          </Badge>
        </div>
      )}
    </div>
  );
}
