// Dodo Payments — create hosted checkout for premium & storage add-ons.
// Returns a payment_link the client redirects to. Fulfillment happens in
// the dodo-webhook function on `payment.succeeded`.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PREMIUM_PRICING: Record<string, { amount: number; currency: string }> = {
  USD: { amount: 20, currency: "USD" },
  EUR: { amount: 19, currency: "EUR" },
  GBP: { amount: 16, currency: "GBP" },
};
const STORAGE_PRICING: Record<string, { amount: number; currency: string }> = {
  USD: { amount: 5, currency: "USD" },
  EUR: { amount: 5, currency: "EUR" },
  GBP: { amount: 4, currency: "GBP" },
};

const DODO_BASE =
  (Deno.env.get("DODO_ENVIRONMENT") || "live").toLowerCase() === "test"
    ? "https://test.dodopayments.com"
    : "https://live.dodopayments.com";

const PREMIUM_PRODUCT_ID = Deno.env.get("DODO_PREMIUM_PRODUCT_ID") || "";
const STORAGE_PRODUCT_ID = Deno.env.get("DODO_STORAGE_PRODUCT_ID") || "";

const json = (b: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const publicClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userError } = await publicClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);
    const user = userData.user;

    const apiKey = Deno.env.get("DODO_API_KEY");
    if (!apiKey) return json({ error: "Dodo not configured" }, 500);

    const body = await req.json().catch(() => ({}));
    const productType: "premium" | "storage_addon" =
      body.product_type === "storage_addon" ? "storage_addon" : "premium";
    const currency = (body.currency || "USD").toUpperCase();
    const returnUrl = body.return_url || `${new URL(req.url).origin}/dashboard/payments`;

    const pricingTable = productType === "premium" ? PREMIUM_PRICING : STORAGE_PRICING;
    const price = pricingTable[currency] || pricingTable.USD;
    const productId = productType === "premium" ? PREMIUM_PRODUCT_ID : STORAGE_PRODUCT_ID;

    if (!productId) {
      return json(
        { error: `Missing Dodo product ID for ${productType}. Set DODO_PREMIUM_PRODUCT_ID / DODO_STORAGE_PRODUCT_ID.` },
        500,
      );
    }

    // Dodo one-time payment via hosted checkout.
    const payload = {
      payment_link: true,
      billing: {
        city: "NA", country: "US", state: "NA", street: "NA", zipcode: "00000",
      },
      customer: { email: user.email || `${user.id}@vowz.me`, name: user.email || "Vowz Customer" },
      product_cart: [{ product_id: productId, quantity: 1 }],
      return_url: returnUrl,
      metadata: {
        user_id: user.id,
        product_type: productType,
        currency: price.currency,
        amount: String(price.amount),
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
      return json({ error: data?.message || "Dodo checkout failed" }, 400);
    }

    return json({
      success: true,
      payment_link: data.payment_link,
      payment_id: data.payment_id,
      amount: price.amount,
      currency: price.currency,
    });
  } catch (e) {
    console.error("dodo-payment error", e);
    return json({ error: (e as Error).message || "Server error" }, 500);
  }
});