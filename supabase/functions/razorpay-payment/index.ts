import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PREMIUM_AMOUNT_PAISE = 59900;
const PREMIUM_PLAN = "premium_yearly";

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const signPayment = async (secret: string, payload: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(signature);
};

const plusOneYearISO = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const publicClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await publicClient.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const user = userData.user;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const action = body?.action as string;

    const { data: providerConfig, error: providerError } = await adminClient
      .from("payment_config")
      .select("is_enabled, config")
      .eq("provider", "razorpay")
      .maybeSingle();

    if (providerError) throw providerError;
    if (!providerConfig?.is_enabled) {
      return json({ error: "Razorpay is currently disabled. Please contact support." }, 400);
    }

    const razorpayConfig = (providerConfig.config || {}) as Record<string, string>;
    const keyId = (razorpayConfig.key_id || "").trim();
    const keySecret = (razorpayConfig.key_secret || "").trim();

    if (!keyId || !keySecret) {
      return json({ error: "Razorpay credentials are missing. Please contact support." }, 400);
    }

    const authBasic = `Basic ${btoa(`${keyId}:${keySecret}`)}`;

    if (action === "create_order") {
      const { data: existingActive, error: existingError } = await adminClient
        .from("user_subscriptions")
        .select("status, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existingActive) {
        const isStillActive =
          !existingActive.expires_at || new Date(existingActive.expires_at).getTime() > Date.now();
        if (isStillActive) {
          return json({ success: true, already_premium: true });
        }
      }

      const receipt = `vowz_${user.id.slice(0, 8)}_${Date.now()}`;

      const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: authBasic,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: PREMIUM_AMOUNT_PAISE,
          currency: "INR",
          receipt,
          notes: {
            user_id: user.id,
            plan: PREMIUM_PLAN,
          },
        }),
      });

      if (!orderRes.ok) {
        const errorBody = await orderRes.text();
        console.error("Razorpay order error", orderRes.status, errorBody);
        return json({ error: "Could not create payment order." }, 500);
      }

      const order = await orderRes.json();

      const { error: saveOrderError } = await adminClient.from("user_subscriptions").upsert(
        {
          user_id: user.id,
          plan: PREMIUM_PLAN,
          provider: "razorpay",
          status: "pending",
          amount_paid: 0,
          currency: "INR",
          payment_order_id: order.id,
          expires_at: plusOneYearISO(),
          metadata: {
            receipt,
            created_via: "razorpay_checkout",
          },
        },
        { onConflict: "payment_order_id" }
      );

      if (saveOrderError) throw saveOrderError;

      return json({
        success: true,
        key_id: keyId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        name: "Vowz",
        description: "Premium Plan (1 Year)",
        prefill: {
          name: user.user_metadata?.full_name || "",
          email: user.email || "",
        },
      });
    }

    if (action === "verify_payment") {
      const orderId = (body?.order_id || "") as string;
      const paymentId = (body?.payment_id || "") as string;
      const signature = (body?.signature || "") as string;

      if (!orderId || !paymentId || !signature) {
        return json({ error: "order_id, payment_id and signature are required." }, 400);
      }

      const expected = await signPayment(keySecret, `${orderId}|${paymentId}`);
      if (expected !== signature) {
        return json({ error: "Invalid payment signature." }, 400);
      }

      const paymentRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        headers: { Authorization: authBasic },
      });

      if (!paymentRes.ok) {
        const errorBody = await paymentRes.text();
        console.error("Razorpay payment lookup error", paymentRes.status, errorBody);
        return json({ error: "Could not verify payment details." }, 500);
      }

      const payment = await paymentRes.json();

      if (payment.order_id !== orderId) {
        return json({ error: "Payment does not match order." }, 400);
      }

      if (!["authorized", "captured"].includes(payment.status)) {
        return json({ error: "Payment is not completed." }, 400);
      }

      const amountPaid = Number(payment.amount || PREMIUM_AMOUNT_PAISE) / 100;
      const nowISO = new Date().toISOString();
      const expiresAt = plusOneYearISO();

      const { error: activateError } = await adminClient.from("user_subscriptions").upsert(
        {
          user_id: user.id,
          plan: PREMIUM_PLAN,
          provider: "razorpay",
          status: "active",
          amount_paid: amountPaid,
          currency: payment.currency || "INR",
          payment_order_id: orderId,
          payment_id: paymentId,
          payment_signature: signature,
          started_at: nowISO,
          expires_at: expiresAt,
          metadata: {
            payment_status: payment.status,
            method: payment.method,
            email: payment.email,
            contact: payment.contact,
            verified_at: nowISO,
          },
        },
        { onConflict: "payment_order_id" }
      );

      if (activateError) throw activateError;

      return json({ success: true, expires_at: expiresAt });
    }

    return json({ error: "Invalid action." }, 400);
  } catch (error) {
    console.error("razorpay-payment error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
