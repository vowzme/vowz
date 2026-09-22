-- Keep guest invite tags in sync with the guest's RSVP so broadcasts can target
-- "Attending", "Declined" or "Plus ones" without manual tagging.
CREATE OR REPLACE FUNCTION public.sync_invite_tags_from_rsvp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text[];
  extra text[] := '{}';
BEGIN
  SELECT COALESCE(gi.tags, '{}') INTO base
  FROM public.guest_invites gi
  WHERE gi.rsvp_id = NEW.id;

  IF base IS NULL THEN
    RETURN NEW;
  END IF;

  base := ARRAY(
    SELECT t FROM unnest(base) AS t
    WHERE t NOT IN ('Attending', 'Declined', 'Plus ones')
  );

  IF NEW.attending THEN
    extra := array_append(extra, 'Attending');
  ELSE
    extra := array_append(extra, 'Declined');
  END IF;

  IF COALESCE(NEW.guest_count, 1) > 1 OR jsonb_array_length(COALESCE(NEW.plus_ones, '[]'::jsonb)) > 0 THEN
    extra := array_append(extra, 'Plus ones');
  END IF;

  UPDATE public.guest_invites
  SET tags = base || extra, updated_at = now()
  WHERE rsvp_id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_invite_tags_from_rsvp ON public.rsvps;
CREATE TRIGGER trg_sync_invite_tags_from_rsvp
AFTER INSERT OR UPDATE ON public.rsvps
FOR EACH ROW EXECUTE FUNCTION public.sync_invite_tags_from_rsvp();