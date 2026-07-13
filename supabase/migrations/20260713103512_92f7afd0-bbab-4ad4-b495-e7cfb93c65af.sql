ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS edit_token uuid;

CREATE OR REPLACE FUNCTION public.update_rsvp_by_token(
  _rsvp_id uuid,
  _edit_token uuid,
  _attending boolean,
  _guest_count integer,
  _meal_preference text,
  _selected_events jsonb,
  _message text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _updated int;
BEGIN
  IF _edit_token IS NULL THEN RETURN false; END IF;

  UPDATE public.rsvps
  SET attending = _attending,
      guest_count = GREATEST(1, LEAST(20, COALESCE(_guest_count, 1))),
      meal_preference = _meal_preference,
      selected_events = _selected_events,
      message = _message
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
$$;

GRANT EXECUTE ON FUNCTION public.update_rsvp_by_token(uuid, uuid, boolean, integer, text, jsonb, text) TO anon, authenticated;