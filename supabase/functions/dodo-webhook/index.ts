// Dodo Payments webhook. Verifies HMAC signature (Standard Webhooks spec),
// records events for idempotency, and fulfills premium / storage add-on orders.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PREMIUM_PLAN = "premium_6mo";
const STORAGE_ADDON_BYTES = 2 * 1024 * 1024 * 1024;

const plusMonthsISO = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
};

// Standard Webhooks HMAC verification (Dodo follows the standard-webhooks spec).
async function verifySignature(
  secret: string,
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string,
  rawBody: string,
): Promise<boolean> {
  try {
    const cleanSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
    const keyBytes = Uint8Array.from(atob(cleanSecret), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signedPayload = `${webhookId}.${webhookTimestamp}.${rawBody}`;
    const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
    const expected = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
    // Header may include multiple space-separated `v1,<sig>` entries
    return webhookSignature
      .split(" ")
      .map((p) => p.split(",")[1])
      .some((sig) => sig === expected);
  } catch (e) {
    console.error("Dodo signature verify error", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const rawBody = await req.text();
    const secret = Deno.env.get("DODO_WEBHOOK_SECRET");
    const wId = req.headers.get("webhook-id") || "";
    const wTs = req.headers.get("webhook-timestamp") || "";
    const wSig = req.headers.get("webhook-signature") || "";

    if (secret) {
      const ok = await verifySignature(secret, wId, wTs, wSig, rawBody);
      if (!ok) return new Response("Signature verification failed", { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event?.type as string;
    const data = event?.data || {};
    const eventId = wId || event?.business_id + ":" + data?.payment_id;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Idempotency using the same table pattern as PayPal.
    if (eventId) {
      const { data: existing } = await admin
        .from("dodo_webhook_events")
        .select("id, processed")
        .eq("event_id", eventId)
        .maybeSingle();
      if (existing?.processed) return new Response("ok", { status: 200 });
      if (!existing) {
        await admin.from("dodo_webhook_events").insert({
          event_id: eventId,
          event_type: eventType,
          payload: event,
          processed: false,
        });
      }
    }

    const metadata = data?.metadata || {};
    const userId = metadata.user_id as string | undefined;
    const productType = metadata.product_type as string | undefined;
    const currency = (metadata.currency || data?.currency || "USD") as string;
    const amount = Number(metadata.amount || data?.total_amount || 0);
    const paymentId = data?.payment_id as string | undefined;

    if (eventType === "payment.succeeded" && userId && paymentId) {
      if (productType === "premium") {
        await admin.from("user_subscriptions").insert({
          user_id: userId,
          plan: PREMIUM_PLAN,
          status: "active",
          provider: "dodo",
          amount_paid: amount,
          currency,
          payment_id: `DODO:${paymentId}`,
          payment_order_id: paymentId,
          expires_at: plusMonthsISO(6),
        });
      } else if (productType === "storage_addon") {
        await admin.from("user_storage_addons").insert({
          user_id: userId,
          bytes_added: STORAGE_ADDON_BYTES,
          status: "active",
          amount_paid: amount,
          currency,
          payment_id: `DODO:${paymentId}`,
          payment_order_id: paymentId,
          expires_at: plusMonthsISO(6),
        });
      }
    } else if (
      (eventType === "refund.succeeded" || eventType === "payment.refunded") &&
      paymentId
    ) {
      const marker = `DODO:${paymentId}`;
      await admin
        .from("user_subscriptions")
        .update({ status: "cancelled" })
        .eq("payment_id", marker);
      await admin
        .from("user_storage_addons")
        .update({ status: "refunded", expires_at: new Date().toISOString() })
        .eq("payment_id", marker);
    }

    if (eventId) {
      await admin
        .from("dodo_webhook_events")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("event_id", eventId);
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("dodo-webhook error", e);
    return new Response("error", { status: 500 });
  }
});