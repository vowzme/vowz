// Admin-triggered Razorpay refund creation.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const publicClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await publicClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isAdmin } = await adminClient.rpc("is_admin", { _user_id: userData.user.id });
    if (!isAdmin) return json({ error: "Admin access required" }, 403);

    const body = await req.json().catch(() => ({}));
    const paymentId = (body?.payment_id || "").toString().trim();
    const amountMajor = body?.amount != null ? Number(body.amount) : null;
    const speed = (body?.speed || "normal").toString();
    const reason = (body?.reason || "").toString().slice(0, 500);
    if (!paymentId) return json({ error: "payment_id is required" }, 400);

    const { data: sub } = await adminClient
      .from("user_subscriptions")
      .select("id, user_id, payment_order_id, currency, amount_paid, status")
      .eq("payment_id", paymentId)
      .maybeSingle();

    // Idempotency: block if a non-failed refund already exists for this payment.
    const { data: existingRefunds, error: existingErr } = await adminClient
      .from("razorpay_refunds")
      .select("id, razorpay_refund_id, status, amount, created_at")
      .eq("razorpay_payment_id", paymentId)
      .neq("status", "failed")
      .order("created_at", { ascending: false });
    if (existingErr) {
      console.error("razorpay-refund: existing refund check failed", existingErr);
      return json({ error: "Could not verify existing refunds" }, 500);
    }
    if (existingRefunds && existingRefunds.length > 0) {
      return json(
        {
          error: "A refund for this payment is already in progress or completed.",
          existing_refund: existingRefunds[0],
        },
        409
      );
    }

    const { data: providerConfig } = await adminClient
      .from("payment_config")
      .select("is_enabled, config")
      .eq("provider", "razorpay")
      .maybeSingle();
    const razorpayConfig = (providerConfig?.config || {}) as Record<string, string>;
    const keyId = (razorpayConfig.key_id || "").trim();
    const keySecret = (razorpayConfig.key_secret || "").trim();
    if (!keyId || !keySecret) return json({ error: "Razorpay credentials are missing." }, 400);

    const authBasic = `Basic ${btoa(`${keyId}:${keySecret}`)}`;
    const rzpBody: Record<string, unknown> = {
      speed,
      notes: {
        initiated_by: userData.user.email || userData.user.id,
        subscription_id: sub?.id || "",
        reason: reason || "admin_refund",
      },
    };
    if (amountMajor != null && Number.isFinite(amountMajor) && amountMajor > 0) {
      rzpBody.amount = Math.round(amountMajor * 100);
    }

    const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: "POST",
      headers: { Authorization: authBasic, "Content-Type": "application/json" },
      body: JSON.stringify(rzpBody),
    });
    const rzpJson = await rzpRes.json().catch(() => ({}));

    if (!rzpRes.ok) {
      console.error("Razorpay refund error", rzpRes.status, rzpJson);
      await adminClient.from("razorpay_refunds").insert({
        subscription_id: sub?.id || null,
        user_id: sub?.user_id || null,
        razorpay_payment_id: paymentId,
        razorpay_order_id: sub?.payment_order_id || null,
        amount: amountMajor ?? Number(sub?.amount_paid ?? 0),
        currency: sub?.currency || "INR",
        status: "failed",
        speed,
        reason,
        error_code: rzpJson?.error?.code || null,
        error_description: rzpJson?.error?.description || `HTTP ${rzpRes.status}`,
        initiated_by: userData.user.id,
      });
      return json(
        { error: rzpJson?.error?.description || "Could not create refund", details: rzpJson },
        rzpRes.status
      );
    }

    const refundAmountMajor = Number(rzpJson?.amount ?? (amountMajor != null ? amountMajor * 100 : 0)) / 100;
    const status = (rzpJson?.status as string) || "pending";
    const nowISO = new Date().toISOString();

    await adminClient.from("razorpay_refunds").upsert(
      {
        subscription_id: sub?.id || null,
        user_id: sub?.user_id || null,
        razorpay_payment_id: paymentId,
        razorpay_order_id: sub?.payment_order_id || null,
        razorpay_refund_id: rzpJson?.id,
        amount: refundAmountMajor,
        currency: (rzpJson?.currency as string) || sub?.currency || "INR",
        status,
        speed: (rzpJson?.speed_processed as string) || speed,
        reason,
        notes: rzpJson?.notes || {},
        processed_at: status === "processed" ? nowISO : null,
        initiated_by: userData.user.id,
      },
      { onConflict: "razorpay_refund_id" }
    );

    if (sub?.id) {
      await adminClient
        .from("user_subscriptions")
        .update({
          status: status === "processed" ? "refunded" : "refund_pending",
        })
        .eq("id", sub.id);
    }

    return json({ success: true, refund: rzpJson });
  } catch (err) {
    console.error("razorpay-refund error", err);
    return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});