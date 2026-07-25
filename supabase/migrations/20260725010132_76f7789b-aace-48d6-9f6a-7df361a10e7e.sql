CREATE TABLE public.dodo_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.dodo_webhook_events TO service_role;
ALTER TABLE public.dodo_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read dodo webhook events"
  ON public.dodo_webhook_events FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));