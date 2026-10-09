DROP POLICY IF EXISTS "Guests can upload blessing photos to live sites" ON storage.objects;
CREATE POLICY "Guests can upload blessing photos to live sites" ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'blessing-photos'
  AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','gif','heic')
  AND EXISTS (SELECT 1 FROM public.wedding_sites ws WHERE ws.id::text = (storage.foldername(name))[1] AND ws.is_published = true AND ws.status = 'active'));
DROP POLICY IF EXISTS "Owners can upload their blessing photos" ON storage.objects;
CREATE POLICY "Owners can upload their blessing photos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'blessing-photos'
  AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','gif','heic')
  AND ((owner_id = (SELECT auth.uid()::text)) OR ((storage.foldername(name))[1] = (SELECT auth.uid()::text))));