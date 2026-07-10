
CREATE TABLE public.razorpay_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  user_id uuid,
  razorpay_payment_id text NOT NULL,
  razorpay_order_id text,
  razorpay_refund_id text UNIQUE,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending',
  speed text,
  reason text,
  notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_code text,
  error_description text,
  initiated_by uuid,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX razorpay_refunds_payment_idx ON public.razorpay_refunds (razorpay_payment_id);
CREATE INDEX razorpay_refunds_status_idx ON public.razorpay_refunds (status);
CREATE INDEX razorpay_refunds_created_at_idx ON public.razorpay_refunds (created_at DESC);
GRANT SELECT ON public.razorpay_refunds TO authenticated;
GRANT ALL ON public.razorpay_refunds TO service_role;
ALTER TABLE public.razorpay_refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read refunds" ON public.razorpay_refunds FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER trg_razorpay_refunds_updated_at BEFORE UPDATE ON public.razorpay_refunds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
