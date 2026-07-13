
ALTER TABLE public.guest_album_posts
  ADD COLUMN IF NOT EXISTS guest_email TEXT;

CREATE TABLE public.guest_moderation_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID,
  wedding_site_id UUID,
  action TEXT NOT NULL CHECK (action IN ('approved','hidden','deleted','pending')),
  guest_email TEXT,
  message_id TEXT,
  actor_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.guest_moderation_events TO service_role;
GRANT SELECT, INSERT ON public.guest_moderation_events TO authenticated;
ALTER TABLE public.guest_moderation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site owners read own moderation events"
  ON public.guest_moderation_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wedding_sites ws
      WHERE ws.id = guest_moderation_events.wedding_site_id
        AND (ws.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );
CREATE POLICY "Site owners insert own moderation events"
  ON public.guest_moderation_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wedding_sites ws
      WHERE ws.id = guest_moderation_events.wedding_site_id
        AND (ws.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );
CREATE INDEX guest_moderation_events_site_idx ON public.guest_moderation_events(wedding_site_id, created_at DESC);
