
-- Unique refund ID (partial to allow NULLs before Razorpay assigns one)
CREATE UNIQUE INDEX IF NOT EXISTS razorpay_refunds_refund_id_key
  ON public.razorpay_refunds (razorpay_refund_id)
  WHERE razorpay_refund_id IS NOT NULL;

-- Only one non-failed refund per payment
CREATE UNIQUE INDEX IF NOT EXISTS razorpay_refunds_one_active_per_payment
  ON public.razorpay_refunds (razorpay_payment_id)
  WHERE status <> 'failed';
