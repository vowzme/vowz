
ALTER TABLE public.template_events DROP CONSTRAINT IF EXISTS template_events_event_type_check;
ALTER TABLE public.template_events ADD CONSTRAINT template_events_event_type_check
  CHECK (event_type IN ('open','preview','use','render','download'));
ALTER TABLE public.template_events ADD COLUMN IF NOT EXISTS meta jsonb;
