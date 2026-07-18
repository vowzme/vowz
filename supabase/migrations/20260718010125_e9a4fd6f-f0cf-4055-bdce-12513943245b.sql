
-- Per-guest tokenized RSVP invites
CREATE TABLE public.guest_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_site_id UUID NOT NULL REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  plus_ones_allowed INTEGER NOT NULL DEFAULT 0,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  rsvp_id UUID REFERENCES public.rsvps(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT guest_invites_name_len CHECK (char_length(guest_name) <= 120),
  CONSTRAINT guest_invites_plus_ones_range CHECK (plus_ones_allowed >= 0 AND plus_ones_allowed <= 20)
);

CREATE INDEX idx_guest_invites_site ON public.guest_invites(wedding_site_id);
CREATE INDEX idx_guest_invites_token ON public.guest_invites(token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_invites TO authenticated;
GRANT ALL ON public.guest_invites TO service_role;

ALTER TABLE public.guest_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners manage invites"
  ON public.guest_invites FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.wedding_sites ws WHERE ws.id = wedding_site_id AND ws.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.wedding_sites ws WHERE ws.id = wedding_site_id AND ws.user_id = auth.uid()));

CREATE POLICY "Admins view all invites"
  ON public.guest_invites FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER guest_invites_updated_at
  BEFORE UPDATE ON public.guest_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Lookup an invite by its token (public, security definer).
-- Returns invite + existing RSVP details so the public form can pre-fill and prevent duplicates.
CREATE OR REPLACE FUNCTION public.get_invite_by_token(_token uuid)
RETURNS TABLE(
  invite_id uuid,
  wedding_site_id uuid,
  guest_name text,
  guest_email text,
  guest_phone text,
  plus_ones_allowed integer,
  rsvp_id uuid,
  rsvp_edit_token uuid,
  rsvp_attending boolean,
  rsvp_guest_count integer,
  rsvp_meal_preference text,
  rsvp_selected_events jsonb,
  rsvp_message text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    gi.id,
    gi.wedding_site_id,
    gi.guest_name,
    gi.guest_email,
    gi.guest_phone,
    gi.plus_ones_allowed,
    r.id,
    r.edit_token,
    r.attending,
    r.guest_count,
    r.meal_preference,
    r.selected_events,
    r.message
  FROM public.guest_invites gi
  JOIN public.wedding_sites ws ON ws.id = gi.wedding_site_id
  LEFT JOIN public.rsvps r ON r.id = gi.rsvp_id
  WHERE gi.token = _token
    AND ws.is_published = true
    AND ws.status = 'active';
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_by_token(uuid) TO anon, authenticated;

-- Submit or update an RSVP via invite token. Prevents duplicates by linking
-- the invite to a single rsvps row; further calls update that row.
CREATE OR REPLACE FUNCTION public.submit_rsvp_by_invite(
  _token uuid,
  _attending boolean,
  _guest_count integer,
  _meal_preference text,
  _selected_events jsonb,
  _message text
)
RETURNS TABLE(rsvp_id uuid, edit_token uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _invite RECORD;
  _rsvp_id uuid;
  _edit_token uuid;
  _max_count int;
BEGIN
  SELECT gi.*, ws.is_published, ws.status
    INTO _invite
    FROM public.guest_invites gi
    JOIN public.wedding_sites ws ON ws.id = gi.wedding_site_id
    WHERE gi.token = _token;

  IF NOT FOUND OR _invite.is_published <> true OR _invite.status <> 'active' THEN
    RAISE EXCEPTION 'Invite not found or site inactive';
  END IF;

  _max_count := GREATEST(1, LEAST(20, 1 + COALESCE(_invite.plus_ones_allowed, 0)));
  _guest_count := GREATEST(1, LEAST(_max_count, COALESCE(_guest_count, 1)));

  IF _invite.rsvp_id IS NOT NULL THEN
    UPDATE public.rsvps
       SET attending = _attending,
           guest_count = _guest_count,
           meal_preference = _meal_preference,
           selected_events = COALESCE(_selected_events, '[]'::jsonb),
           message = _message
     WHERE id = _invite.rsvp_id
     RETURNING id, edit_token INTO _rsvp_id, _edit_token;
  ELSE
    _edit_token := gen_random_uuid();
    INSERT INTO public.rsvps (
      wedding_site_id, guest_name, guest_email, attending, guest_count,
      meal_preference, selected_events, message, edit_token
    ) VALUES (
      _invite.wedding_site_id,
      _invite.guest_name,
      COALESCE(_invite.guest_email, ''),
      _attending,
      _guest_count,
      _meal_preference,
      COALESCE(_selected_events, '[]'::jsonb),
      _message,
      _edit_token
    )
    RETURNING id INTO _rsvp_id;

    UPDATE public.guest_invites SET rsvp_id = _rsvp_id WHERE id = _invite.id;
  END IF;

  RETURN QUERY SELECT _rsvp_id, _edit_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_rsvp_by_invite(uuid, boolean, integer, text, jsonb, text) TO anon, authenticated;
