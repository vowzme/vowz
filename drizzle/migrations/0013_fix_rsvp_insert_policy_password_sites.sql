CREATE OR REPLACE FUNCTION public.site_accepts_rsvp(_site_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.wedding_sites
    WHERE id = _site_id AND is_published = true AND status = 'active'
  );
$$;

DROP POLICY IF EXISTS "Anyone can submit RSVP to published site" ON public.rsvps;

CREATE POLICY "Anyone can submit RSVP to published site"
ON public.rsvps
FOR INSERT
WITH CHECK (public.site_accepts_rsvp(wedding_site_id));