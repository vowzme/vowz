-- Wedding photos: split owner access from the public (guest) access so each
-- rule is bound either to the uploader or to a live, published site folder.
DROP POLICY IF EXISTS "Public can read wedding photos for published sites" ON storage.objects;
DROP POLICY IF EXISTS "Public can read wedding logos for published sites" ON storage.objects;

CREATE POLICY "Owners can read their wedding photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'wedding-photos'
  AND (
    owner_id = (SELECT auth.uid()::text)
    OR (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  )
);

CREATE POLICY "Guests can read wedding photos of live sites"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'wedding-photos'
  AND EXISTS (
    SELECT 1 FROM public.wedding_sites ws
    WHERE ws.user_id::text = (storage.foldername(objects.name))[1]
      AND ws.is_published = true
      AND ws.status = 'active'
  )
);

CREATE POLICY "Owners can read their wedding logos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'wedding-logos'
  AND (
    owner_id = (SELECT auth.uid()::text)
    OR (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  )
);

CREATE POLICY "Guests can read wedding logos of live sites"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'wedding-logos'
  AND EXISTS (
    SELECT 1 FROM public.wedding_sites ws
    WHERE ws.user_id::text = (storage.foldername(objects.name))[1]
      AND ws.is_published = true
      AND ws.status = 'active'
  )
);

-- Blessing photo uploads: signed-in users upload into their own folder,
-- guests may only upload into a live published site's folder.
DROP POLICY IF EXISTS "Anyone can upload blessing photos to published site folder" ON storage.objects;

CREATE POLICY "Owners can upload their blessing photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'blessing-photos'
  AND (
    owner_id = (SELECT auth.uid()::text)
    OR (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  )
);

CREATE POLICY "Guests can upload blessing photos to live sites"
ON storage.objects FOR INSERT TO anon
WITH CHECK (
  bucket_id = 'blessing-photos'
  AND EXISTS (
    SELECT 1 FROM public.wedding_sites ws
    WHERE ws.id::text = (storage.foldername(objects.name))[1]
      AND ws.is_published = true
      AND ws.status = 'active'
  )
);