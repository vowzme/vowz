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

  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
    return json({ error: "Webhook not configured" }, 500);
  }

  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) return json({ error: "Missing signature" }, 400);

  const rawBody = await req.text();
  const expected = await hmacSha256Hex(secret, rawBody);
  if (!timingSafeEqual(signature, expected)) {
    console.warn("Razorpay webhook signature mismatch");
    return json({ error: "Invalid signature" }, 401);
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const eventId = req.headers.get("x-razorpay-event-id") || event?.id || null;
  console.log("Razorpay webhook received", { event: event?.event, eventId });

  try {
    switch (event?.event) {
      case "payment.captured":
      case "order.paid": {
        const payment = event?.payload?.payment?.entity;
        if (payment?.order_id) {
          await supabase
            .from("razorpay_payments")
            .update({
              status: "captured",
              razorpay_payment_id: payment.id,
              amount: payment.amount,
              currency: payment.currency,
              method: payment.method,
              captured_at: new Date().toISOString(),
            })
            .eq("razorpay_order_id", payment.order_id);
        }
        break;
      }
      case "payment.failed": {
        const payment = event?.payload?.payment?.entity;
        if (payment?.order_id) {
          await supabase
            .from("razorpay_payments")
            .update({
              status: "failed",
              razorpay_payment_id: payment.id,
              error_code: payment.error_code,
              error_description: payment.error_description,
            })
            .eq("razorpay_order_id", payment.order_id);
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
    // Return 200 anyway to avoid Razorpay retry storms; log for investigation.
  }

  return json({ received: true });
});