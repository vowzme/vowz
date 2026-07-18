
ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS plus_ones JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.rsvps DROP CONSTRAINT IF EXISTS rsvps_plus_ones_shape;
ALTER TABLE public.rsvps
  ADD CONSTRAINT rsvps_plus_ones_shape
  CHECK (jsonb_typeof(plus_ones) = 'array' AND jsonb_array_length(plus_ones) <= 20)
  NOT VALID;

DROP FUNCTION IF EXISTS public.submit_rsvp_by_invite(uuid, boolean, integer, text, jsonb, text);
DROP FUNCTION IF EXISTS public.update_rsvp_by_token(uuid, uuid, boolean, integer, text, jsonb, text);
DROP FUNCTION IF EXISTS public.get_invite_by_token(uuid);

CREATE OR REPLACE FUNCTION public.submit_rsvp_by_invite(
  _token uuid,
  _attending boolean,
  _guest_count integer,
  _meal_preference text,
  _selected_events jsonb,
  _message text,
  _plus_ones jsonb DEFAULT '[]'::jsonb
)
 RETURNS TABLE(rsvp_id uuid, edit_token uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _invite RECORD;
  _rsvp_id uuid;
  _edit_token uuid;
  _max_count int;
  _clean_plus_ones jsonb;
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

  IF _plus_ones IS NULL OR jsonb_typeof(_plus_ones) <> 'array' THEN
    _clean_plus_ones := '[]'::jsonb;
  ELSE
    SELECT COALESCE(jsonb_agg(entry ORDER BY ord), '[]'::jsonb)
      INTO _clean_plus_ones
      FROM (
        SELECT entry, ord
          FROM jsonb_array_elements(_plus_ones) WITH ORDINALITY AS t(entry, ord)
         WHERE jsonb_typeof(entry) = 'object'
         LIMIT GREATEST(0, _guest_count - 1)
      ) s;
  END IF;

  IF _invite.rsvp_id IS NOT NULL THEN
    UPDATE public.rsvps
       SET attending = _attending,
           guest_count = _guest_count,
           meal_preference = _meal_preference,
           selected_events = COALESCE(_selected_events, '[]'::jsonb),
           message = _message,
           plus_ones = COALESCE(_clean_plus_ones, '[]'::jsonb)
     WHERE id = _invite.rsvp_id
     RETURNING id, edit_token INTO _rsvp_id, _edit_token;
  ELSE
    _edit_token := gen_random_uuid();
    INSERT INTO public.rsvps (
      wedding_site_id, guest_name, guest_email, attending, guest_count,
      meal_preference, selected_events, message, edit_token, plus_ones
    ) VALUES (
      _invite.wedding_site_id,
      _invite.guest_name,
      COALESCE(_invite.guest_email, ''),
      _attending,
      _guest_count,
      _meal_preference,
      COALESCE(_selected_events, '[]'::jsonb),
      _message,
      _edit_token,
      COALESCE(_clean_plus_ones, '[]'::jsonb)
    )
    RETURNING id INTO _rsvp_id;

    UPDATE public.guest_invites SET rsvp_id = _rsvp_id WHERE id = _invite.id;
  END IF;

  RETURN QUERY SELECT _rsvp_id, _edit_token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_rsvp_by_token(
  _rsvp_id uuid,
  _edit_token uuid,
  _attending boolean,
  _guest_count integer,
  _meal_preference text,
  _selected_events jsonb,
  _message text,
  _plus_ones jsonb DEFAULT '[]'::jsonb
)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _updated int;
  _clean_plus_ones jsonb;
  _capped_count int;
BEGIN
  IF _edit_token IS NULL THEN RETURN false; END IF;
  _capped_count := GREATEST(1, LEAST(20, COALESCE(_guest_count, 1)));

  IF _plus_ones IS NULL OR jsonb_typeof(_plus_ones) <> 'array' THEN
    _clean_plus_ones := '[]'::jsonb;
  ELSE
    SELECT COALESCE(jsonb_agg(entry ORDER BY ord), '[]'::jsonb)
      INTO _clean_plus_ones
      FROM (
        SELECT entry, ord
          FROM jsonb_array_elements(_plus_ones) WITH ORDINALITY AS t(entry, ord)
         WHERE jsonb_typeof(entry) = 'object'
         LIMIT GREATEST(0, _capped_count - 1)
      ) s;
  END IF;

  UPDATE public.rsvps
  SET attending = _attending,
      guest_count = _capped_count,
      meal_preference = _meal_preference,
      selected_events = _selected_events,
      message = _message,
      plus_ones = COALESCE(_clean_plus_ones, '[]'::jsonb)
  WHERE id = _rsvp_id
    AND edit_token = _edit_token
    AND EXISTS (
      SELECT 1 FROM public.wedding_sites ws
      WHERE ws.id = rsvps.wedding_site_id
        AND ws.is_published = true
        AND ws.status = 'active'
    );

  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated > 0;
END;
$function$;

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
   rsvp_message text,
   rsvp_plus_ones jsonb
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    r.message,
    r.plus_ones
  FROM public.guest_invites gi
  JOIN public.wedding_sites ws ON ws.id = gi.wedding_site_id
  LEFT JOIN public.rsvps r ON r.id = gi.rsvp_id
  WHERE gi.token = _token
    AND ws.is_published = true
    AND ws.status = 'active';
$function$;

REVOKE ALL ON FUNCTION public.submit_rsvp_by_invite(uuid, boolean, integer, text, jsonb, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_rsvp_by_invite(uuid, boolean, integer, text, jsonb, text, jsonb) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.update_rsvp_by_token(uuid, uuid, boolean, integer, text, jsonb, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_rsvp_by_token(uuid, uuid, boolean, integer, text, jsonb, text, jsonb) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_invite_by_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(uuid) TO anon, authenticated, service_role;
