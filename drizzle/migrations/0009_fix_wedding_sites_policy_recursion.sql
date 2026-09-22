DROP POLICY IF EXISTS "Public can view published unprotected sites" ON public.wedding_sites;
DROP POLICY IF EXISTS "Authenticated can view published unprotected sites" ON public.wedding_sites;

CREATE POLICY "Public can view published unprotected sites"
ON public.wedding_sites FOR SELECT TO anon
USING (is_published = true AND status = 'active' AND NOT public.site_has_password(id));

CREATE POLICY "Authenticated can view published unprotected sites"
ON public.wedding_sites FOR SELECT TO authenticated
USING (is_published = true AND status = 'active' AND NOT public.site_has_password(id));