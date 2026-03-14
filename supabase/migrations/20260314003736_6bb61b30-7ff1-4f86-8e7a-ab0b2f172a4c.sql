CREATE POLICY "Authenticated can view published sites"
ON public.wedding_sites
FOR SELECT
TO authenticated
USING (is_published = true);