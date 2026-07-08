DROP POLICY IF EXISTS "Anyone can read slug redirects" ON public.slug_redirects;
CREATE POLICY "Public can read redirects for published sites"
ON public.slug_redirects
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.wedding_sites ws
    WHERE ws.id = slug_redirects.wedding_site_id
      AND ws.is_published = true
  )
  OR EXISTS (
    SELECT 1 FROM public.wedding_sites ws
    WHERE ws.id = slug_redirects.wedding_site_id
      AND ws.user_id = auth.uid()
  )
);