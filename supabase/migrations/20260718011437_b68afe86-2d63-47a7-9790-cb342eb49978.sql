
CREATE TABLE public.rsvp_reminder_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_site_id uuid NOT NULL UNIQUE REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  wedding_date date,
  offsets_days integer[] NOT NULL DEFAULT ARRAY[30,14,7,3,1]::integer[],
  send_hour integer NOT NULL DEFAULT 10,
  subject_override text,
  body_override text,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rsvp_reminder_send_hour_range CHECK (send_hour BETWEEN 0 AND 23),
  CONSTRAINT rsvp_reminder_offsets_len CHECK (array_length(offsets_days, 1) IS NULL OR array_length(offsets_days, 1) <= 12)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rsvp_reminder_schedules TO authenticated;
GRANT ALL ON public.rsvp_reminder_schedules TO service_role;

ALTER TABLE public.rsvp_reminder_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners manage reminder schedules"
  ON public.rsvp_reminder_schedules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wedding_sites ws
      WHERE ws.id = rsvp_reminder_schedules.wedding_site_id
        AND ws.user_id = auth.uid()
    ) OR public.is_admin(auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wedding_sites ws
      WHERE ws.id = rsvp_reminder_schedules.wedding_site_id
        AND ws.user_id = auth.uid()
    ) OR public.is_admin(auth.uid())
  );

CREATE TRIGGER rsvp_reminder_schedules_updated_at
  BEFORE UPDATE ON public.rsvp_reminder_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.rsvp_reminder_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_site_id uuid NOT NULL REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  invite_id uuid NOT NULL REFERENCES public.guest_invites(id) ON DELETE CASCADE,
  offset_day integer NOT NULL,
  recipient text NOT NULL,
  message_id text,
  status text NOT NULL DEFAULT 'queued',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rsvp_reminder_sends_status_check CHECK (status IN ('queued','sent','failed','skipped'))
);

CREATE UNIQUE INDEX rsvp_reminder_sends_unique
  ON public.rsvp_reminder_sends (invite_id, offset_day);
CREATE INDEX rsvp_reminder_sends_site_idx
  ON public.rsvp_reminder_sends (wedding_site_id, created_at DESC);

GRANT SELECT ON public.rsvp_reminder_sends TO authenticated;
GRANT ALL ON public.rsvp_reminder_sends TO service_role;

ALTER TABLE public.rsvp_reminder_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners view reminder sends"
  ON public.rsvp_reminder_sends
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wedding_sites ws
      WHERE ws.id = rsvp_reminder_sends.wedding_site_id
        AND ws.user_id = auth.uid()
    ) OR public.is_admin(auth.uid())
  );
