-- Password-protected wedding sites must no longer be readable directly.
DROP POLICY IF EXISTS "Public can view published sites" ON public.wedding_sites;
DROP POLICY IF EXISTS "Authenticated can view published sites" ON public.wedding_sites;

CREATE POLICY "Public can view published unprotected sites"
ON public.wedding_sites FOR SELECT TO anon
USING (
  is_published = true
  AND status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM public.wedding_site_passwords p WHERE p.wedding_site_id = wedding_sites.id
  )
);

CREATE POLICY "Authenticated can view published unprotected sites"
ON public.wedding_sites FOR SELECT TO authenticated
USING (
  is_published = true
  AND status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM public.wedding_site_passwords p WHERE p.wedding_site_id = wedding_sites.id
  )
);

-- Tells the page what to show without leaking any site content.
CREATE OR REPLACE FUNCTION public.public_site_gate(_slug text)
RETURNS TABLE(found boolean, paused boolean, requires_password boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    true,
    s.status = 'paused',
    EXISTS (SELECT 1 FROM public.wedding_site_passwords p WHERE p.wedding_site_id = s.id)
  FROM public.wedding_sites s
  WHERE s.slug = _slug AND s.is_published = true
  LIMIT 1
$$;

-- Returns the full site only when it is open, or when the correct password is given.
CREATE OR REPLACE FUNCTION public.get_public_site(_slug text, _password text DEFAULT NULL)
RETURNS SETOF public.wedding_sites
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.wedding_sites%ROWTYPE;
BEGIN
  SELECT * INTO s FROM public.wedding_sites
  WHERE slug = _slug AND is_published = true AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.wedding_site_passwords p WHERE p.wedding_site_id = s.id) THEN
    IF _password IS NULL OR NOT public.verify_site_password(s.id, _password) THEN
      RETURN;
    END IF;
  END IF;

  RETURN NEXT s;
END;
$$;

GRANT EXECUTE ON FUNCTION public.public_site_gate(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_site(text, text) TO anon, authenticated;