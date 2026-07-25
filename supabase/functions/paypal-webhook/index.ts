import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getBillingTerms } from "../_shared/billing-terms.ts";

const PAYPAL_BASE =
  (Deno.env.get("PAYPAL_ENV") || "live").toLowerCase() === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

const PREMIUM_PLAN = "premium_6mo";
const STORAGE_ADDON_BYTES = 2 * 1024 * 1024 * 1024;

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
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal auth failed: ${data.error_description || res.status}`);
  return data.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const rawBody = await req.text();
    const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID");

    // Verify signature with PayPal if webhook id is configured
    if (webhookId) {
      const token = await getAccessToken();
      const verifyRes = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_algo: req.headers.get("paypal-auth-algo"),
          cert_url: req.headers.get("paypal-cert-url"),
          transmission_id: req.headers.get("paypal-transmission-id"),
          transmission_sig: req.headers.get("paypal-transmission-sig"),
          transmission_time: req.headers.get("paypal-transmission-time"),
          webhook_id: webhookId,
          webhook_event: JSON.parse(rawBody),
        }),
      });
      const verify = await verifyRes.json();
      if (verify?.verification_status !== "SUCCESS") {
        return new Response("Signature verification failed", { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event?.event_type as string;
    const resource = event?.resource || {};
    const eventId = event?.id as string;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Idempotency: skip if we've already processed this event id
    if (eventId) {
      const { data: existing } = await admin
        .from("paypal_webhook_events")
        .select("id, processed")
        .eq("event_id", eventId)
        .maybeSingle();
      if (existing?.processed) {
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      await admin.from("paypal_webhook_events").upsert(
        {
          event_id: eventId,
          event_type: eventType,
          resource_id: resource?.id || null,
          payload: event,
        },
        { onConflict: "event_id" },
      );
    }

    let handlerError: string | null = null;
    try {
      // Successful capture — write subscription/addon (authoritative, idempotent).
      if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
        const terms = await getBillingTerms(admin);
        let custom: any = {};
        try {
          custom = JSON.parse(resource?.custom_id || "{}");
        } catch { /* ignore */ }
        const userId = custom?.user_id as string | undefined;
        const productType = (custom?.product_type as string) || "premium";
        const captureId = resource?.id as string | undefined;
        const paidAmount = Number(resource?.amount?.value || "0");
        const paidCurrency = resource?.amount?.currency_code || "USD";

        if (userId && captureId) {
          if (productType === "storage_addon") {
            const { data: dup } = await admin
              .from("user_storage_addons")
              .select("id")
              .contains("metadata", { paypal_capture_id: captureId })
              .maybeSingle();
            if (!dup) {
              await admin.from("user_storage_addons").insert({
                user_id: userId,
                bytes_added: STORAGE_ADDON_BYTES,
                status: "active",
                provider: "paypal",
                amount_paid: paidAmount,
                currency: paidCurrency,
                expires_at: plusMonthsISO(terms.storage_months),
                metadata: { paypal_capture_id: captureId },
              });
            }
          } else {
            const { data: dup } = await admin
              .from("user_subscriptions")
              .select("id")
              .contains("metadata", { paypal_capture_id: captureId })
              .maybeSingle();
            if (!dup) {
              await admin
                .from("user_subscriptions")
                .update({ status: "cancelled" })
                .eq("user_id", userId)
                .eq("status", "active");
              await admin.from("user_subscriptions").insert({
                user_id: userId,
                plan: PREMIUM_PLAN,
                provider: "paypal",
                status: "active",
                amount_paid: paidAmount,
                currency: paidCurrency,
                started_at: new Date().toISOString(),
                expires_at: plusMonthsISO(terms.premium_months),
                duration_months: terms.premium_months,
                metadata: { paypal_capture_id: captureId },
              });
            }
          }
        }
      }

      // Refund or reversal — cancel matching subscription or addon.
      if (eventType === "PAYMENT.CAPTURE.REFUNDED" || eventType === "PAYMENT.CAPTURE.REVERSED") {
        const captureId =
          resource?.links?.find((l: any) => l.rel === "up")?.href?.split("/")?.pop() ||
          resource?.id;
        if (captureId) {
          await admin
            .from("user_subscriptions")
            .update({ status: "cancelled" })
            .contains("metadata", { paypal_capture_id: captureId });
          await admin
            .from("user_storage_addons")
            .update({ status: "refunded", expires_at: new Date().toISOString() })
            .contains("metadata", { paypal_capture_id: captureId });
        }
      }
    } catch (e) {
      handlerError = (e as Error).message;
    }

    if (eventId) {
      await admin
        .from("paypal_webhook_events")
        .update({
          processed: !handlerError,
          processed_at: new Date().toISOString(),
          error: handlerError,
        })
        .eq("event_id", eventId);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});