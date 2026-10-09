DROP POLICY IF EXISTS "Anyone can post to album on published site" ON public.guest_album_posts;
CREATE POLICY "Anyone can post to album on published site" ON public.guest_album_posts FOR INSERT TO anon, authenticated
WITH CHECK (status = ANY (ARRAY['pending','approved'])
  AND EXISTS (SELECT 1 FROM public.wedding_sites ws WHERE ws.id = guest_album_posts.wedding_site_id AND ws.is_published = true AND ws.status = 'active')
  AND (photo_url ~ ('^https://[^/]+/guests/' || wedding_site_id::text || '/')
    OR photo_url ~ ('^https://[^/]+/storage/v1/object/public/blessing-photos/' || wedding_site_id::text || '/')));
DROP POLICY IF EXISTS "Anyone can post blessings to published site" ON public.guest_blessings;
CREATE POLICY "Anyone can post blessings to published site" ON public.guest_blessings FOR INSERT TO anon, authenticated
WITH CHECK (status = 'pending'
  AND EXISTS (SELECT 1 FROM public.wedding_sites w WHERE w.id = guest_blessings.wedding_site_id AND w.is_published = true AND w.status = 'active')
  AND (photo_url IS NULL
    OR photo_url ~ ('^https://[^/]+/guests/' || wedding_site_id::text || '/')
    OR photo_url ~ ('^https://[^/]+/storage/v1/object/public/blessing-photos/' || wedding_site_id::text || '/')));