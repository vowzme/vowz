
CREATE TABLE public.reminder_email_dlq (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id TEXT,
  template_name TEXT,
  recipient_email TEXT,
  variant TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.reminder_email_dlq TO service_role;
GRANT SELECT ON public.reminder_email_dlq TO authenticated;
ALTER TABLE public.reminder_email_dlq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read reminder dlq" ON public.reminder_email_dlq
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE INDEX reminder_email_dlq_created_idx ON public.reminder_email_dlq(created_at DESC);
