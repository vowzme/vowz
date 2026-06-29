-- Hash wedding-site guest passwords with bcrypt (pgcrypto) and update RPCs
-- to compare hashes instead of plaintext equality.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Migrate any existing plaintext passwords to bcrypt hashes.
-- A bcrypt hash always starts with "$2"; rows already hashed are skipped.
UPDATE public.wedding_site_passwords
SET password = extensions.crypt(password, extensions.gen_salt('bf', 10))
WHERE password IS NOT NULL
  AND password <> ''
  AND password NOT LIKE '$2%';

-- Replace verify_site_password to use constant-time bcrypt comparison.
CREATE OR REPLACE FUNCTION public.verify_site_password(_site_id uuid, _password text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.wedding_site_passwords wsp
    JOIN public.wedding_sites ws ON ws.id = wsp.wedding_site_id
    WHERE wsp.wedding_site_id = _site_id
      AND ws.is_published = true
      AND wsp.password IS NOT NULL
      AND wsp.password <> ''
      AND wsp.password = extensions.crypt(_password, wsp.password)
  );
$function$;

-- Trigger: hash any plaintext password written to wedding_site_passwords
CREATE OR REPLACE FUNCTION public.hash_site_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
BEGIN
  IF NEW.password IS NOT NULL
     AND NEW.password <> ''
     AND NEW.password NOT LIKE '$2%' THEN
    NEW.password := extensions.crypt(NEW.password, extensions.gen_salt('bf', 10));
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS hash_site_password_trg ON public.wedding_site_passwords;
CREATE TRIGGER hash_site_password_trg
BEFORE INSERT OR UPDATE OF password ON public.wedding_site_passwords
FOR EACH ROW EXECUTE FUNCTION public.hash_site_password();