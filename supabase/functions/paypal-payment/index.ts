import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getBillingTerms } from "../_shared/billing-terms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PREMIUM_PRICING: Record<string, { amount: string; currency: string; displayAmount: number }> = {
  USD: { amount: "20.00", currency: "USD", displayAmount: 20 },
  EUR: { amount: "19.00", currency: "EUR", displayAmount: 19 },
  GBP: { amount: "16.00", currency: "GBP", displayAmount: 16 },
};

const STORAGE_ADDON_PRICING: Record<string, { amount: string; currency: string; displayAmount: number }> = {
  USD: { amount: "5.00", currency: "USD", displayAmount: 5 },
  EUR: { amount: "5.00", currency: "EUR", displayAmount: 5 },
  GBP: { amount: "4.00", currency: "GBP", displayAmount: 4 },
};

const LUXE_PRICING: Record<string, { amount: string; currency: string; displayAmount: number }> = {
  USD: { amount: "10.00", currency: "USD", displayAmount: 10 },
  EUR: { amount: "10.00", currency: "EUR", displayAmount: 10 },
  GBP: { amount: "8.00", currency: "GBP", displayAmount: 8 },
};

const LUXE_PLAN = "luxe_cards_lifetime";
const PREMIUM_PLAN = "premium_6mo";
const STORAGE_ADDON_PLAN = "storage_addon_2gb";
const STORAGE_ADDON_BYTES = 2 * 1024 * 1024 * 1024;

const PAYPAL_BASE =
  (Deno.env.get("PAYPAL_ENV") || "live").toLowerCase() === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const plusMonthsISO = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
};

async function getAccessToken(): Promise<string> {
  const id = Deno.env.get("PAYPAL_CLIENT_ID");
  const secret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  if (!id || !secret) throw new Error("PayPal credentials are not configured");
  const auth = btoa(`${id}:${secret}`);
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal auth failed: ${data.error_description || res.status}`);
  return data.access_token as string;
}

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

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const action = body?.action as string;
    const productType = (body?.product_type as string) || "premium";
    const requestedCurrency = ((body?.currency as string) || "USD").toUpperCase();

    const isAddon = productType === "storage_addon";
    const isLuxe = productType === "luxe_cards";
    const pricingTable = isLuxe ? LUXE_PRICING : isAddon ? STORAGE_ADDON_PRICING : PREMIUM_PRICING;
    const tier = pricingTable[requestedCurrency] || pricingTable.USD;

    const terms = await getBillingTerms(adminClient);
    const premiumMonths = terms.premium_months;
    const storageMonths = terms.storage_months;

    if (action === "create_order") {
      // LUXE is a one-time lifetime unlock
      if (isLuxe) {
        const { data: existingLuxe } = await adminClient
          .from("user_luxe_unlocks")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();
        if (existingLuxe) return json({ success: true, already_owned: true });
      }

      // Already premium guard (for premium purchases)
      if (!isAddon && !isLuxe) {
        const { data: existing } = await adminClient
          .from("user_subscriptions")
          .select("id, expires_at, status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();
        if (existing && (!existing.expires_at || new Date(existing.expires_at) > new Date())) {
          return json({ success: true, already_premium: true });
        }
      }

      const token = await getAccessToken();
      const description = isLuxe
        ? "Vowz LUXE Invitation Cards (one-time unlock)"
        : isAddon
        ? `Vowz +2 GB Storage (${storageMonths} months)`
        : `Vowz Premium (${premiumMonths} months)`;

      const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: `${user.id}:${productType}`,
              description,
              amount: { currency_code: tier.currency, value: tier.amount },
              custom_id: JSON.stringify({
                user_id: user.id,
                product_type: productType,
                plan: isLuxe ? LUXE_PLAN : isAddon ? STORAGE_ADDON_PLAN : PREMIUM_PLAN,
              }),
            },
          ],
          application_context: {
            brand_name: "Vowz",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
          },
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        return json({ error: orderData?.message || "Could not create PayPal order" }, 400);
      }

      return json({
        success: true,
        order_id: orderData.id,
        client_id: Deno.env.get("PAYPAL_CLIENT_ID"),
        currency: tier.currency,
        amount: tier.amount,
        description,
      });
    }

    if (action === "capture_order") {
      const orderId = body?.order_id as string;
      if (!orderId) return json({ error: "order_id is required" }, 400);
      const token = await getAccessToken();

      const capRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const capData = await capRes.json();
      if (!capRes.ok || capData?.status !== "COMPLETED") {
        return json({ error: capData?.message || "Capture failed", details: capData }, 400);
      }

      const pu = capData?.purchase_units?.[0];
      const capture = pu?.payments?.captures?.[0];
      const paidAmount = Number(capture?.amount?.value || "0");
      const paidCurrency = capture?.amount?.currency_code || tier.currency;
      let custom: any = {};
      try { custom = JSON.parse(pu?.payments?.captures?.[0]?.custom_id || pu?.custom_id || "{}"); } catch { /* ignore */ }

      // The PayPal order must have been created for this signed-in user. custom_id
      // and reference_id are written server-side at order creation and returned by
      // PayPal, so they bind fulfillment to a provider-confirmed order.
      const orderUserId = (custom?.user_id as string) || String(pu?.reference_id || "").split(":")[0];
      if (!orderUserId || orderUserId !== user.id) {
        console.error("paypal-payment: order/user mismatch", { orderId });
        return json({ error: "Payment does not belong to this account." }, 403);
      }

      const resolvedProduct = custom.product_type || productType;
      const resolvedIsAddon = resolvedProduct === "storage_addon";
      const resolvedIsLuxe = resolvedProduct === "luxe_cards";

      if (resolvedIsLuxe) {
        const { data: already } = await adminClient
          .from("user_luxe_unlocks")
          .select("id")
          .eq("payment_order_id", orderId)
          .limit(1)
          .maybeSingle();

        if (!already) {
          const { error: luxeError } = await adminClient.from("user_luxe_unlocks").insert({
            user_id: user.id,
            provider: "paypal",
            amount_paid: paidAmount,
            currency: paidCurrency,
            payment_id: capture?.id ?? null,
            payment_order_id: orderId,
            purchased_at: new Date().toISOString(),
            status: "active",
          });
          if (luxeError) throw luxeError;
        }

        return json({ success: true, order_id: orderId, capture_id: capture?.id, product_type: "luxe_cards" });
      }

      if (resolvedIsAddon) {
        await adminClient.from("user_storage_addons").insert({
          user_id: user.id,
          bytes_added: STORAGE_ADDON_BYTES,
          status: "active",
          provider: "paypal",
          amount_paid: paidAmount,
          currency: paidCurrency,
          expires_at: plusMonthsISO(storageMonths),
          metadata: { paypal_order_id: orderId, paypal_capture_id: capture?.id },
        });
      } else {
        // Cancel any lingering active subs, then insert new one
        await adminClient
          .from("user_subscriptions")
          .update({ status: "cancelled" })
          .eq("user_id", user.id)
          .eq("status", "active");

        await adminClient.from("user_subscriptions").insert({
          user_id: user.id,
          plan: PREMIUM_PLAN,
          provider: "paypal",
          status: "active",
          amount_paid: paidAmount,
          currency: paidCurrency,
          started_at: new Date().toISOString(),
          expires_at: plusMonthsISO(premiumMonths),
          duration_months: premiumMonths,
          metadata: { paypal_order_id: orderId, paypal_capture_id: capture?.id },
        });
      }

      return json({ success: true, order_id: orderId, capture_id: capture?.id });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message || "Server error" }, 500);
  }
});