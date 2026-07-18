
CREATE TABLE public.guest_invite_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_id UUID NOT NULL REFERENCES public.guest_invites(id) ON DELETE CASCADE,
  wedding_site_id UUID NOT NULL REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp')),
  recipient TEXT,
  message_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('queued','sent','failed')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_guest_invite_sends_invite ON public.guest_invite_sends(invite_id);
CREATE INDEX idx_guest_invite_sends_site ON public.guest_invite_sends(wedding_site_id);
CREATE INDEX idx_guest_invite_sends_message ON public.guest_invite_sends(message_id) WHERE message_id IS NOT NULL;

GRANT SELECT, INSERT ON public.guest_invite_sends TO authenticated;
GRANT ALL ON public.guest_invite_sends TO service_role;

ALTER TABLE public.guest_invite_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners view invite sends"
  ON public.guest_invite_sends FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.wedding_sites ws
    WHERE ws.id = guest_invite_sends.wedding_site_id AND ws.user_id = auth.uid()
  ));

CREATE POLICY "Site owners log invite sends"
  ON public.guest_invite_sends FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.wedding_sites ws
    WHERE ws.id = guest_invite_sends.wedding_site_id AND ws.user_id = auth.uid()
  ));
