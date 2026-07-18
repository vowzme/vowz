CREATE TABLE IF NOT EXISTS public.paypal_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  resource_id TEXT,
  processed BOOLEAN NOT NULL DEFAULT false,
  payload JSONB NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

GRANT ALL ON public.paypal_webhook_events TO service_role;

ALTER TABLE public.paypal_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
ON public.paypal_webhook_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_paypal_webhook_events_type ON public.paypal_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_paypal_webhook_events_resource ON public.paypal_webhook_events(resource_id);