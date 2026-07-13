
CREATE TABLE public.email_ab_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  variant TEXT NOT NULL CHECK (variant IN ('A','B')),
  event_type TEXT NOT NULL CHECK (event_type IN ('sent','open','click')),
  url TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.email_ab_events TO service_role;
GRANT SELECT ON public.email_ab_events TO authenticated;
ALTER TABLE public.email_ab_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read ab events" ON public.email_ab_events
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE INDEX email_ab_events_template_variant_idx ON public.email_ab_events(template_name, variant, event_type, created_at DESC);
CREATE INDEX email_ab_events_message_idx ON public.email_ab_events(message_id);
