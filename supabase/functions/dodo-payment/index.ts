// Dodo Payments — create hosted checkout for premium & storage add-ons.
// Uses Pay What You Want (PWYW) products so all pricing, coupons and affiliate
// discounts are controlled from our code. Dodo just charges the final amount.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCors } from "../_shared/cors.ts";

const PREMIUM_PRICING: Record<string, { amountCents: number; currency: string; symbol: string }> = {
  USD: { amountCents: 2000, currency: "USD", symbol: "$" },
  EUR: { amountCents: 1900, currency: "EUR", symbol: "€" },
  GBP: { amountCents: 1600, currency: "GBP", symbol: "£" },
};
const STORAGE_PRICING: Record<string, { amountCents: number; currency: string; symbol: string }> = {
  USD: { amountCents: 500, currency: "USD", symbol: "$" },
  EUR: { amountCents: 500, currency: "EUR", symbol: "€" },
  GBP: { amountCents: 400, currency: "GBP", symbol: "£" },
};

const AFFILIATE_DISCOUNT_MAJOR: Record<string, number> = {
  INR: 250,
  USD: 5,
  EUR: 5,
  GBP: 5,
};

const PREMIUM_PLAN = "premium_6mo";
const STORAGE_ADDON_BYTES = 2 * 1024 * 1024 * 1024;

const DODO_BASE =
  (Deno.env.get("DODO_ENVIRONMENT") || "live").toLowerCase() === "test"
    ? "https://test.dodopayments.com"
    : "https://live.dodopayments.com";

const json = (req: Request, b: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(b), {
    status,
    headers: { ...buildCors(req), "Content-Type": "application/json" },
  });

const plusMonthsISO = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
};

Deno.serve(async (req) => {
  const cors = buildCors(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(req, { error: "Unauthorized" }, 401);

    const publicClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userError } = await publicClient.auth.getUser();
    if (userError || !userData.user) return json(req, { error: "Unauthorized" }, 401);
    const user = userData.user;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const apiKey = Deno.env.get("DODO_API_KEY");
    if (!apiKey) return json(req, { error: "Dodo not configured" }, 500);

    const body = await req.json().catch(() => ({}));
    const productType: "premium" | "storage_addon" =
      body.product_type === "storage_addon" ? "storage_addon" : "premium";
    const currency = (body.currency || "USD").toUpperCase();
    const returnUrl = body.return_url || `${new URL(req.url).origin}/dashboard/payments`;
    const couponCode = (body.coupon_code || "").toString().trim().toUpperCase();
    const affiliateRef = (body.affiliate_ref || "").toString().trim();

    const pricingTable = productType === "premium" ? PREMIUM_PRICING : STORAGE_PRICING;
    const tier = pricingTable[currency] || pricingTable.USD;
    const productId = productType === "premium"
      ? Deno.env.get("DODO_PREMIUM_PRODUCT_ID")
      : Deno.env.get("DODO_STORAGE_PRODUCT_ID");

    if (!productId) {
      return json(
        req,
        { error: `Missing Dodo product ID for ${productType}. Set DODO_PREMIUM_PRODUCT_ID / DODO_STORAGE_PRODUCT_ID.` },
        500,
      );
    }

    // Already premium guard (for premium purchases)
    if (productType === "premium") {
      const { data: existing } = await adminClient
        .from("user_subscriptions")
        .select("id, expires_at, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      if (existing && (!existing.expires_at || new Date(existing.expires_at) > new Date())) {
        return json(req, { success: true, already_premium: true });
      }
    }

    // Server-side price computation: list price → affiliate discount → coupon discount.
    let orderAmountCents = tier.amountCents;
    let appliedCouponId: string | null = null;
    let appliedDiscountMajor = 0;
    let affiliateDiscountMajor = 0;

    if (affiliateRef) {
      const affMajor = AFFILIATE_DISCOUNT_MAJOR[currency] || AFFILIATE_DISCOUNT_MAJOR.USD;
      affiliateDiscountMajor = affMajor;
      orderAmountCents = Math.max(1, orderAmountCents - Math.round(affMajor * 100));
    }

    if (couponCode) {
      const { data: coupon } = await adminClient
        .from("coupons")
        .select("id, status, expires_at, usage_type, max_uses, times_used, min_order_value, max_discount_cap, currency, discount_value, discount_type, scope")
        .eq("code", couponCode)
        .maybeSingle();
      const baseMajor = tier.amountCents / 100;
      const valid =
        coupon &&
        coupon.status === "active" &&
        (!coupon.expires_at || new Date(coupon.expires_at).getTime() > Date.now()) &&
        (coupon.usage_type !== "limited" || (coupon.max_uses != null && coupon.times_used < coupon.max_uses)) &&
        (!coupon.currency || coupon.currency === tier.currency);
      if (valid && coupon) {
        if (coupon.min_order_value == null || baseMajor >= Number(coupon.min_order_value)) {
          let discountMajor = 0;
          if (coupon.discount_type === "percentage") {
            discountMajor = (baseMajor * Number(coupon.discount_value)) / 100;
          } else {
            discountMajor = Number(coupon.discount_value);
          }
          if (coupon.max_discount_cap != null) {
            discountMajor = Math.min(discountMajor, Number(coupon.max_discount_cap));
          }
          discountMajor = Math.max(0, Math.min(discountMajor, baseMajor));
          appliedDiscountMajor = discountMajor;
          appliedCouponId = coupon.id;
          orderAmountCents = Math.max(1, Math.round((baseMajor - affiliateDiscountMajor - discountMajor) * 100));
        }
      }
    }

    // Dodo one-time payment via hosted checkout using PWYW amount in cents.
    const payload = {
      payment_link: true,
      billing: {
        city: "NA", country: "US", state: "NA", street: "NA", zipcode: "00000",
      },
      customer: { email: user.email || `${user.id}@vowz.me`, name: user.email || "Vowz Customer" },
      product_cart: [{ product_id: productId, quantity: 1, amount: orderAmountCents }],
      return_url: returnUrl,
      metadata: {
        user_id: user.id,
        product_type: productType,
        currency: tier.currency,
        original_amount_cents: String(tier.amountCents),
        final_amount_cents: String(orderAmountCents),
        coupon_code: couponCode || "",
        coupon_id: appliedCouponId || "",
        discount_applied_major: String(appliedDiscountMajor),
        affiliate_ref: affiliateRef || "",
        affiliate_discount_major: String(affiliateDiscountMajor),
      },
    };

    const res = await fetch(`${DODO_BASE}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Dodo create payment failed", res.status, data);
      return json(req, { error: data?.message || "Dodo checkout failed" }, 400);
    }

    return json(req, {
      success: true,
      payment_link: data.payment_link,
      payment_id: data.payment_id,
      amount_cents: orderAmountCents,
      amount_major: orderAmountCents / 100,
      currency: tier.currency,
      symbol: tier.symbol,
    });
  } catch (e) {
    console.error("dodo-payment error", e);
    return json(req, { error: (e as Error).message || "Server error" }, 500);
  }
});
