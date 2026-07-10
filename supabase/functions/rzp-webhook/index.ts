// Razorpay webhook receiver
// Public endpoint (no JWT). Verifies X-Razorpay-Signature (HMAC-SHA256) with RAZORPAY_WEBHOOK_SECRET.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature, x-razorpay-event-id",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const logEvent = async (row: {
    event_type?: string | null;
    razorpay_event_id?: string | null;
    razorpay_order_id?: string | null;
    razorpay_payment_id?: string | null;
    signature_valid: boolean;
    processed: boolean;
    status_code: number;
    error?: string | null;
    payload?: unknown;
  }) => {
    try {
      await supabaseAdmin.from("razorpay_webhook_events").insert(row as any);
    } catch (e) {
      console.error("Failed to log webhook event", e);
    }
  };

  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
    await logEvent({ signature_valid: false, processed: false, status_code: 500, error: "RAZORPAY_WEBHOOK_SECRET not configured" });
    return json({ error: "Webhook not configured" }, 500);
  }

  const signature = req.headers.get("x-razorpay-signature");
  const eventIdHeader = req.headers.get("x-razorpay-event-id");
  if (!signature) {
    await logEvent({ razorpay_event_id: eventIdHeader, signature_valid: false, processed: false, status_code: 400, error: "Missing X-Razorpay-Signature header" });
    return json({ error: "Missing signature" }, 400);
  }

  const rawBody = await req.text();
  const expected = await hmacSha256Hex(secret, rawBody);
  if (!timingSafeEqual(signature, expected)) {
    console.warn("Razorpay webhook signature mismatch");
    await logEvent({ razorpay_event_id: eventIdHeader, signature_valid: false, processed: false, status_code: 401, error: "Signature mismatch" });
    return json({ error: "Invalid signature" }, 401);
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    await logEvent({ razorpay_event_id: eventIdHeader, signature_valid: true, processed: false, status_code: 400, error: "Invalid JSON body" });
    return json({ error: "Invalid JSON" }, 400);
  }

  const supabase = supabaseAdmin;

  const eventId = eventIdHeader || event?.id || null;
  console.log("Razorpay webhook received", { event: event?.event, eventId });
  const entity = event?.payload?.payment?.entity || event?.payload?.refund?.entity || event?.payload?.order?.entity;
  let processError: string | null = null;

  try {
    switch (event?.event) {
      case "payment.captured":
      case "order.paid": {
        const payment = event?.payload?.payment?.entity;
        console.log("[rzp-webhook] payment.captured/order.paid payload", {
          eventId,
          event: event?.event,
          razorpay_payment_id: payment?.id,
          razorpay_order_id: payment?.order_id,
          amount: payment?.amount,
          currency: payment?.currency,
          method: payment?.method,
          status: payment?.status,
          email: payment?.email,
          contact: payment?.contact,
          notes: payment?.notes,
          created_at: payment?.created_at,
        });
        if (payment?.order_id) {
          const { data, error } = await supabase
            .from("razorpay_payments")
            .update({
              status: "captured",
              razorpay_payment_id: payment.id,
              amount: payment.amount,
              currency: payment.currency,
              method: payment.method,
              captured_at: new Date().toISOString(),
            })
            .eq("razorpay_order_id", payment.order_id)
            .select("id, razorpay_order_id, razorpay_payment_id, status, amount, currency");
          if (error) {
            console.error("[rzp-webhook] DB update failed for captured payment", {
              razorpay_order_id: payment.order_id,
              error: error.message,
            });
          } else if (!data || data.length === 0) {
            console.warn("[rzp-webhook] No matching razorpay_payments row for order", {
              razorpay_order_id: payment.order_id,
              razorpay_payment_id: payment.id,
            });
          } else {
            console.log("[rzp-webhook] Marked payment captured", { rows: data });
          }
        } else {
          console.warn("[rzp-webhook] Missing order_id on payment entity", { eventId });
        }
        break;
      }
      case "payment.failed": {
        const payment = event?.payload?.payment?.entity;
        console.log("[rzp-webhook] payment.failed payload", {
          eventId,
          razorpay_payment_id: payment?.id,
          razorpay_order_id: payment?.order_id,
          amount: payment?.amount,
          currency: payment?.currency,
          method: payment?.method,
          error_code: payment?.error_code,
          error_description: payment?.error_description,
          error_source: payment?.error_source,
          error_step: payment?.error_step,
          error_reason: payment?.error_reason,
          email: payment?.email,
          contact: payment?.contact,
          notes: payment?.notes,
        });
        if (payment?.order_id) {
          const { data, error } = await supabase
            .from("razorpay_payments")
            .update({
              status: "failed",
              razorpay_payment_id: payment.id,
              error_code: payment.error_code,
              error_description: payment.error_description,
            })
            .eq("razorpay_order_id", payment.order_id)
            .select("id, razorpay_order_id, razorpay_payment_id, status");
          if (error) {
            console.error("[rzp-webhook] DB update failed for failed payment", {
              razorpay_order_id: payment.order_id,
              error: error.message,
            });
          } else if (!data || data.length === 0) {
            console.warn("[rzp-webhook] No matching razorpay_payments row for failed order", {
              razorpay_order_id: payment.order_id,
              razorpay_payment_id: payment.id,
            });
          } else {
            console.log("[rzp-webhook] Marked payment failed", { rows: data });
          }
        } else {
          console.warn("[rzp-webhook] payment.failed missing order_id", { eventId });
        }
        break;
      }
      case "refund.created":
      case "refund.processed": {
        const refund = event?.payload?.refund?.entity;
        if (refund?.payment_id) {
          await supabase
            .from("razorpay_payments")
            .update({ status: "refunded", refunded_at: new Date().toISOString() })
            .eq("razorpay_payment_id", refund.payment_id);
        }
        break;
      }
      default:
        // Acknowledge unhandled events so Razorpay stops retrying
        break;
    }
  } catch (err) {
    console.error("Webhook processing error", err);
    processError = err instanceof Error ? err.message : String(err);
    // Return 200 anyway to avoid Razorpay retry storms; log for investigation.
  }

  await logEvent({
    event_type: event?.event ?? null,
    razorpay_event_id: eventId,
    razorpay_order_id: entity?.order_id ?? null,
    razorpay_payment_id: entity?.id ?? entity?.payment_id ?? null,
    signature_valid: true,
    processed: !processError,
    status_code: 200,
    error: processError,
    payload: event,
  });

  return json({ received: true });
});