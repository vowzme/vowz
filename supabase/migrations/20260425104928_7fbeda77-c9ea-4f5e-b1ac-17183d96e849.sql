-- Replace the permissive INSERT policy on guest_blessings with one that
-- pins photo_url to the wedding site's own folder in blessing-photos.
DROP POLICY IF EXISTS "Anyone can post blessings to published site" ON public.guest_blessings;

CREATE POLICY "Anyone can post blessings to published site"
ON public.guest_blessings
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.wedding_sites
    WHERE wedding_sites.id = guest_blessings.wedding_site_id
      AND wedding_sites.is_published = true
  )
  AND (
    photo_url IS NULL
    OR photo_url ~ ('^https://[^/]+/storage/v1/object/public/blessing-photos/' || guest_blessings.wedding_site_id::text || '/')
  )
);