
CREATE TABLE public.razorpay_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at timestamptz NOT NULL DEFAULT now(),
  event_type text,
  razorpay_event_id text,
  razorpay_order_id text,
  razorpay_payment_id text,
  signature_valid boolean NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  status_code int NOT NULL,
  error text,
  payload jsonb
);
CREATE INDEX razorpay_webhook_events_received_at_idx ON public.razorpay_webhook_events (received_at DESC);
GRANT SELECT ON public.razorpay_webhook_events TO authenticated;
GRANT ALL ON public.razorpay_webhook_events TO service_role;
ALTER TABLE public.razorpay_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read webhook events" ON public.razorpay_webhook_events FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
