import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { PaymentSuccessEmail } from "../_shared/email-templates/payment-success.tsx";
import { getBillingTerms, plusMonthsISO } from "../_shared/billing-terms.ts";
import { sendRawEmail } from '../_shared/managed-email.ts'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Pricing per currency in smallest unit (paise/cents)
const PREMIUM_PRICING: Record<string, { amount: number; currency: string; symbol: string; displayAmount: number }> = {
  INR: { amount: 99900, currency: "INR", symbol: "₹", displayAmount: 999 },
  USD: { amount: 2000, currency: "USD", symbol: "$", displayAmount: 20 },
};

const STORAGE_ADDON_PRICING: Record<string, { amount: number; currency: string; symbol: string; displayAmount: number }> = {
  INR: { amount: 49900, currency: "INR", symbol: "₹", displayAmount: 499 },
  USD: { amount: 500, currency: "USD", symbol: "$", displayAmount: 5 },
};

const LUXE_PRICING: Record<string, { amount: number; currency: string; symbol: string; displayAmount: number }> = {
  INR: { amount: 49900, currency: "INR", symbol: "₹", displayAmount: 499 },
  USD: { amount: 1000, currency: "USD", symbol: "$", displayAmount: 10 },
};

const LUXE_PLAN = "luxe_cards_lifetime";
const PREMIUM_PLAN = "premium_6mo";
const STORAGE_ADDON_PLAN = "storage_addon_2gb";
const STORAGE_ADDON_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

const signPayment = async (secret: string, payload: string) => {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(signature);
};

// term length now read from billing_terms at request time

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const publicClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await publicClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);
    const user = userData.user;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const action = body?.action as string;
    const productType = (body?.product_type as string) || "premium"; // "premium" | "storage_addon"
    const requestedCurrency = ((body?.currency as string) || "INR").toUpperCase();

    const terms = await getBillingTerms(adminClient);
    const premiumMonths = terms.premium_months;
    const storageMonths = terms.storage_months;

    const isAddon = productType === "storage_addon";
    const isLuxe = productType === "luxe_cards";
    const pricingTable = isLuxe ? LUXE_PRICING : isAddon ? STORAGE_ADDON_PRICING : PREMIUM_PRICING;
    const pricingTier = pricingTable[requestedCurrency] || pricingTable.INR;
    const planCode = isLuxe ? LUXE_PLAN : isAddon ? STORAGE_ADDON_PLAN : PREMIUM_PLAN;

    const { data: providerConfig, error: providerError } = await adminClient
      .from("payment_config").select("is_enabled, config").eq("provider", "razorpay").maybeSingle();

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
      // LUXE is a one-time lifetime unlock: block if already owned
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

      // For premium only (not addon/luxe): block if already active
      if (!isAddon && !isLuxe) {
        const { data: existingActive } = await adminClient
          .from("user_subscriptions")
          .select("status, expires_at")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingActive) {
          const isStillActive =
            !existingActive.expires_at || new Date(existingActive.expires_at).getTime() > Date.now();
          if (isStillActive) return json({ success: true, already_premium: true });
        }
      }

      const receipt = `vowz_${isLuxe ? "luxe" : isAddon ? "stor" : "prem"}_${user.id.slice(0, 8)}_${Date.now()}`;
      // Server-side coupon validation; never trust client-supplied amounts.
      let orderAmount = pricingTier.amount;
      let appliedCouponId: string | null = null;
      let appliedDiscount = 0;
      const couponCode = (body?.coupon_code || "").toString().trim().toUpperCase();
      if (couponCode) {
        const { data: coupon } = await adminClient
          .from("coupons")
          .select("id, status, expires_at, usage_type, max_uses, times_used, min_order_value, max_discount_cap, currency, discount_value, discount_type, scope")
          .eq("code", couponCode)
          .maybeSingle();
        const valid =
          coupon &&
          coupon.status === "active" &&
          (!coupon.expires_at || new Date(coupon.expires_at).getTime() > Date.now()) &&
          (coupon.usage_type !== "limited" || (coupon.max_uses != null && coupon.times_used < coupon.max_uses)) &&
          (!coupon.currency || coupon.currency === pricingTier.currency);
        if (valid && coupon) {
          const baseMajor = pricingTier.amount / 100; // major units
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
            appliedDiscount = discountMajor;
            appliedCouponId = coupon.id;
            orderAmount = Math.max(100, Math.round((baseMajor - discountMajor) * 100));
          }
        }
      }

      const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { Authorization: authBasic, "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: orderAmount,
          currency: pricingTier.currency,
          receipt,
          notes: {
            user_id: user.id,
            plan: planCode,
            product_type: productType,
            currency: pricingTier.currency,
            coupon_code: couponCode || "",
            coupon_id: appliedCouponId || "",
            discount_applied: String(appliedDiscount),
            expected_amount: String(orderAmount),
            original_amount: String(pricingTier.amount / 100),
            affiliate_ref: body?.affiliate_ref || "",
          },
        }),
      });

      if (!orderRes.ok) {
        const errorBody = await orderRes.text();
        console.error("Razorpay order error", orderRes.status, errorBody);
        return json({ error: "Could not create payment order." }, 500);
      }

      const order = await orderRes.json();

      // Save pending row only for premium (addon/luxe rows created on verify)
      if (!isAddon && !isLuxe) {
        const { error: saveOrderError } = await adminClient.from("user_subscriptions").upsert(
          {
            user_id: user.id,
            plan: planCode,
            provider: "razorpay",
            status: "pending",
            amount_paid: 0,
            currency: pricingTier.currency,
            payment_order_id: order.id,
            duration_months: premiumMonths,
            expires_at: plusMonthsISO(premiumMonths),
            metadata: { receipt, created_via: "razorpay_checkout", requested_currency: pricingTier.currency },
          },
          { onConflict: "payment_order_id" }
        );
        if (saveOrderError) throw saveOrderError;
      }

      return json({
        success: true,
        key_id: keyId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        name: "Vowz",
        description: isLuxe
          ? "LUXE Invitation Cards (one-time unlock)"
          : isAddon
          ? `Storage Add-on (+2 GB / ${storageMonths} months)`
          : `Premium Plan (${premiumMonths} Months)`,
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
      if (expected !== signature) return json({ error: "Invalid payment signature." }, 400);

      const paymentRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        headers: { Authorization: authBasic },
      });
      if (!paymentRes.ok) {
        const errorBody = await paymentRes.text();
        console.error("Razorpay payment lookup error", paymentRes.status, errorBody);
        return json({ error: "Could not verify payment details." }, 500);
      }

      const payment = await paymentRes.json();
      if (payment.order_id !== orderId) return json({ error: "Payment does not match order." }, 400);
      if (!["authorized", "captured"].includes(payment.status)) {
        return json({ error: "Payment is not completed." }, 400);
      }
      // The order must have been created for this signed-in user (notes are set
      // server-side at order creation and returned by Razorpay, not the client).
      const orderUserId = (payment.notes?.user_id as string) || "";
      if (!orderUserId || orderUserId !== user.id) {
        console.error("razorpay-payment: order/user mismatch", { orderId });
        return json({ error: "Payment does not belong to this account." }, 403);
      }

      // Verify the captured amount matches the server-computed expected amount
      const expectedAmountStr = payment.notes?.expected_amount as string | undefined;
      if (expectedAmountStr) {
        const expectedAmount = Number(expectedAmountStr);
        if (Number.isFinite(expectedAmount) && Number(payment.amount) < expectedAmount) {
          console.error("Amount mismatch", { paid: payment.amount, expected: expectedAmount });
          return json({ error: "Payment amount does not match expected order amount." }, 400);
        }
      }

      const paymentCurrency = payment.currency || "INR";
      const amountPaid = Number(payment.amount || pricingTier.amount) / 100;
      const currencySymbol = (PREMIUM_PRICING[paymentCurrency]?.symbol) || paymentCurrency;
      const nowISO = new Date().toISOString();
      // Determine product type from notes (server-side authoritative)
      const notesType = (payment.notes?.product_type as string) || "premium";
      const isAddonPayment = notesType === "storage_addon";
      const isLuxePayment = notesType === "luxe_cards";
      const expiresAt = plusMonthsISO(isAddonPayment ? storageMonths : premiumMonths);

      if (isLuxePayment) {
        const { data: already } = await adminClient
          .from("user_luxe_unlocks")
          .select("id")
          .eq("payment_order_id", orderId)
          .limit(1)
          .maybeSingle();

        if (!already) {
          const { error: luxeError } = await adminClient.from("user_luxe_unlocks").insert({
            user_id: user.id,
            provider: "razorpay",
            amount_paid: amountPaid,
            currency: paymentCurrency,
            payment_id: paymentId,
            payment_order_id: orderId,
            purchased_at: nowISO,
            status: "active",
          });
          if (luxeError) throw luxeError;
        }

        return json({ success: true, product_type: "luxe_cards" });
      }

      if (isAddonPayment) {
        // Insert a stackable storage addon
        const { error: addonError } = await adminClient.from("user_storage_addons").insert({
          user_id: user.id,
          bytes_added: STORAGE_ADDON_BYTES,
          amount_paid: amountPaid,
          currency: paymentCurrency,
          payment_id: paymentId,
          payment_order_id: orderId,
          purchased_at: nowISO,
          expires_at: expiresAt,
          status: "active",
        });
        if (addonError) throw addonError;

        return json({ success: true, expires_at: expiresAt, product_type: "storage_addon" });
      }

      // Premium activation
      const { error: activateError } = await adminClient.from("user_subscriptions").upsert(
        {
          user_id: user.id,
          plan: PREMIUM_PLAN,
          provider: "razorpay",
          status: "active",
          amount_paid: amountPaid,
          currency: paymentCurrency,
          payment_order_id: orderId,
          payment_id: paymentId,
          payment_signature: signature,
          started_at: nowISO,
          expires_at: expiresAt,
          duration_months: premiumMonths,
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

      // Log coupon redemption and increment usage atomically (server-side authoritative)
      const couponIdFromNotes = (payment.notes?.coupon_id as string) || "";
      const couponCodeFromNotes = (payment.notes?.coupon_code as string) || "";
      if (couponIdFromNotes) {
        try {
          await adminClient.from("coupon_redemptions").insert({
            coupon_id: couponIdFromNotes,
            user_id: user.id,
            discount_applied: Math.max(0, (Number(payment.notes?.original_amount || 0)) - amountPaid),
            currency: paymentCurrency,
            original_amount: Number(payment.notes?.original_amount || amountPaid),
            final_amount: amountPaid,
          });
          const { data: cur } = await adminClient
            .from("coupons")
            .select("times_used")
            .eq("id", couponIdFromNotes)
            .single();
          if (cur) {
            await adminClient
              .from("coupons")
              .update({ times_used: (cur.times_used || 0) + 1 })
              .eq("id", couponIdFromNotes);
          }
        } catch (e) {
          console.error("Coupon redemption logging failed", e, { couponCodeFromNotes });
        }
      }

      // Send payment success email
      try {
        const dateLocale = paymentCurrency === "INR" ? "en-IN" : "en-US";
        const paymentDate = new Date().toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" });
        const expiryDate = new Date(expiresAt).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" });

        const emailProps = {
          recipientName: user.user_metadata?.full_name || "there",
          recipientEmail: user.email || "",
          orderId,
          paymentId,
          plan: "Premium (6 Months)",
          amount: `${currencySymbol}${amountPaid}`,
          currency: paymentCurrency,
          paymentDate,
          expiresAt: expiryDate,
          paymentMethod: payment.method || "",
        };

        const emailHtml = await renderAsync(React.createElement(PaymentSuccessEmail, emailProps));
        const emailText = await renderAsync(React.createElement(PaymentSuccessEmail, emailProps), { plainText: true });
        const messageId = crypto.randomUUID();

        const sendResult = await sendRawEmail({
          to: user.email || "",
          subject: "Payment Confirmed — VowZ Premium Activated 🎉",
          html: emailHtml,
          text: emailText,
          label: "payment_success",
          idempotencyKey: `payment-success-${paymentId}`,
        });

        const { error: logError } = await adminClient.from("email_send_log").insert({
          message_id: messageId,
          template_name: "payment_success",
          recipient_email: user.email || "",
          status: sendResult.sent ? "sent" : "suppressed",
        });
        if (logError) console.error("email_send_log insert failed", logError.message);

      } catch (emailErr) {
        const message = emailErr instanceof Error ? emailErr.message : String(emailErr);
        const { error: logError } = await adminClient.from("email_send_log").insert({
          message_id: crypto.randomUUID(),
          template_name: "payment_success",
          recipient_email: user.email || "",
          status: "failed",
          error_message: message.slice(0, 1000),
        });
        if (logError) console.error("email_send_log insert failed", logError.message);
        console.error("Failed to send payment success email (non-blocking)", message);
      }


      // Affiliate & Franchise commissions (use 6mo amount basis)
      try {
        const { data: referral } = await adminClient
          .from("affiliate_referrals")
          .select("id, affiliate_id, status")
          .eq("referred_user_id", user.id)
          .eq("status", "pending")
          .maybeSingle();

        if (referral) {
          const baseAmount = paymentCurrency === "INR" ? 999 : 20;
          const affCommission = baseAmount * 0.25;
          await adminClient.from("affiliate_referrals").update({
            status: "converted",
            converted_at: nowISO,
            plan: PREMIUM_PLAN,
            commission_amount: affCommission,
          }).eq("id", referral.id);

          const { data: aff } = await adminClient.from("affiliates")
            .select("id, successful_referrals, total_earnings, pending_earnings, franchise_id")
            .eq("id", referral.affiliate_id).maybeSingle();

          if (aff) {
            await adminClient.from("affiliates").update({
              successful_referrals: (aff.successful_referrals || 0) + 1,
              total_earnings: (aff.total_earnings || 0) + affCommission,
              pending_earnings: (aff.pending_earnings || 0) + affCommission,
            }).eq("id", aff.id);

            if (aff.franchise_id) {
              const franchiseOverride = Math.round(baseAmount * 0.05 * 100) / 100;
              await adminClient.from("franchise_commissions").insert({
                franchise_id: aff.franchise_id,
                sub_affiliate_id: aff.id,
                referral_id: referral.id,
                commission_amount: franchiseOverride,
                currency: paymentCurrency,
                payout_status: "pending",
              });
            }
          }
        }
      } catch (commErr) {
        console.error("Commission tracking error (non-blocking):", commErr);
      }

      return json({ success: true, expires_at: expiresAt, product_type: "premium" });
    }

    return json({ error: "Invalid action." }, 400);
  } catch (error) {
    console.error("razorpay-payment error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
