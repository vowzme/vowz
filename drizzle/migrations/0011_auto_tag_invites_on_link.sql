-- The RSVP row is created before the invite is linked to it, so also refresh
-- tags when an invite gets its rsvp_id.
CREATE OR REPLACE FUNCTION public.sync_invite_tags_on_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.rsvps%ROWTYPE;
  base text[];
  extra text[] := '{}';
BEGIN
  IF NEW.rsvp_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO r FROM public.rsvps WHERE id = NEW.rsvp_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  base := ARRAY(
    SELECT t FROM unnest(COALESCE(NEW.tags, '{}')) AS t
    WHERE t NOT IN ('Attending', 'Declined', 'Plus ones')
  );

  IF r.attending THEN
    extra := array_append(extra, 'Attending');
  ELSE
    extra := array_append(extra, 'Declined');
  END IF;

  IF COALESCE(r.guest_count, 1) > 1 OR jsonb_array_length(COALESCE(r.plus_ones, '[]'::jsonb)) > 0 THEN
    extra := array_append(extra, 'Plus ones');
  END IF;

  NEW.tags := base || extra;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_invite_tags_on_link ON public.guest_invites;
CREATE TRIGGER trg_sync_invite_tags_on_link
BEFORE INSERT OR UPDATE OF rsvp_id ON public.guest_invites
FOR EACH ROW EXECUTE FUNCTION public.sync_invite_tags_on_link();