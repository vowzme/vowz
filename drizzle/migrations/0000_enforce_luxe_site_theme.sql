CREATE OR REPLACE FUNCTION public.enforce_luxe_site_theme()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.theme IS NOT NULL AND NEW.theme LIKE 'luxe-%' THEN
    IF NOT public.is_admin(NEW.user_id) AND NOT public.user_has_luxe(NEW.user_id) THEN
      RAISE EXCEPTION 'LUXE design "%" requires the LUXE unlock', NEW.theme
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_luxe_site_theme_trg ON public.wedding_sites;
CREATE TRIGGER enforce_luxe_site_theme_trg
BEFORE INSERT OR UPDATE OF theme ON public.wedding_sites
FOR EACH ROW EXECUTE FUNCTION public.enforce_luxe_site_theme();