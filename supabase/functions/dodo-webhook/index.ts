// Dodo Payments webhook. Verifies HMAC signature (Standard Webhooks spec),
// records events for idempotency, and fulfills premium / storage add-on orders.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getBillingTerms } from "../_shared/billing-terms.ts";

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
    const eventId = wId || `${event?.business_id}:${data?.payment_id}`;

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
    // Dodo amounts are in smallest currency unit (cents/paisa).
    const amountCents = Number(data?.total_amount || metadata.final_amount_cents || 0);
    const amountPaid = amountCents >= 100 ? amountCents / 100 : amountCents;
    const paymentId = data?.payment_id as string | undefined;

    if (eventType === "payment.succeeded" && userId && paymentId) {
      const marker = `DODO:${paymentId}`;
      const terms = await getBillingTerms(admin);

      if (productType === "premium") {
        await admin
          .from("user_subscriptions")
          .update({ status: "cancelled" })
          .eq("user_id", userId)
          .eq("status", "active");
        await admin.from("user_subscriptions").insert({
          user_id: userId,
          plan: PREMIUM_PLAN,
          status: "active",
          provider: "dodo",
          amount_paid: amountPaid,
          currency,
          payment_id: marker,
          payment_order_id: paymentId,
          started_at: new Date().toISOString(),
          expires_at: plusMonthsISO(terms.premium_months),
          duration_months: terms.premium_months,
          metadata: {
            dodo_payment_id: paymentId,
            original_amount_cents: metadata.original_amount_cents,
            final_amount_cents: metadata.final_amount_cents,
            coupon_code: metadata.coupon_code,
            affiliate_ref: metadata.affiliate_ref,
          },
        });
      } else if (productType === "storage_addon") {
        await admin.from("user_storage_addons").insert({
          user_id: userId,
          bytes_added: STORAGE_ADDON_BYTES,
          status: "active",
          provider: "dodo",
          amount_paid: amountPaid,
          currency,
          payment_id: marker,
          payment_order_id: paymentId,
          purchased_at: new Date().toISOString(),
          expires_at: plusMonthsISO(terms.storage_months),
          metadata: {
            dodo_payment_id: paymentId,
            original_amount_cents: metadata.original_amount_cents,
            final_amount_cents: metadata.final_amount_cents,
          },
        });
      }

      // Log coupon redemption and increment usage atomically.
      const couponId = metadata.coupon_id as string | undefined;
      const couponCode = metadata.coupon_code as string | undefined;
      if (couponId && couponCode) {
        try {
          const originalAmountMajor = Number(metadata.original_amount_cents || 0) / 100;
          await admin.from("coupon_redemptions").insert({
            coupon_id: couponId,
            user_id: userId,
            discount_applied: Math.max(0, originalAmountMajor - amountPaid),
            currency,
            original_amount: originalAmountMajor,
            final_amount: amountPaid,
          });
          const { data: cur } = await admin
            .from("coupons")
            .select("times_used")
            .eq("id", couponId)
            .single();
          if (cur) {
            await admin
              .from("coupons")
              .update({ times_used: (cur.times_used || 0) + 1 })
              .eq("id", couponId);
          }
        } catch (e) {
          console.error("Dodo coupon redemption logging failed", e);
        }
      }

      // Affiliate & Franchise commissions.
      const affiliateRef = metadata.affiliate_ref as string | undefined;
      if (affiliateRef) {
        try {
          const { data: referral } = await admin
            .from("affiliate_referrals")
            .select("id, affiliate_id, status")
            .eq("referred_user_id", userId)
            .eq("status", "pending")
            .maybeSingle();

          if (referral) {
            const baseAmount = currency === "INR" ? 999 : 20;
            const affCommission = baseAmount * 0.25;
            const nowISO = new Date().toISOString();
            await admin.from("affiliate_referrals").update({
              status: "converted",
              converted_at: nowISO,
              plan: PREMIUM_PLAN,
              commission_amount: affCommission,
            }).eq("id", referral.id);

            const { data: aff } = await admin
              .from("affiliates")
              .select("id, successful_referrals, total_earnings, pending_earnings, franchise_id")
              .eq("id", referral.affiliate_id)
              .maybeSingle();

            if (aff) {
              await admin.from("affiliates").update({
                successful_referrals: (aff.successful_referrals || 0) + 1,
                total_earnings: (aff.total_earnings || 0) + affCommission,
                pending_earnings: (aff.pending_earnings || 0) + affCommission,
              }).eq("id", aff.id);

              if (aff.franchise_id) {
                const franchiseOverride = Math.round(baseAmount * 0.05 * 100) / 100;
                await admin.from("franchise_commissions").insert({
                  franchise_id: aff.franchise_id,
                  sub_affiliate_id: aff.id,
                  referral_id: referral.id,
                  commission_amount: franchiseOverride,
                  currency,
                  payout_status: "pending",
                });
              }
            }
          }
        } catch (e) {
          console.error("Dodo affiliate tracking failed", e);
        }
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
