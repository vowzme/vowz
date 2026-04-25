
-- 1. Make buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('wedding-photos', 'wedding-logos');

-- 2. Drop existing SELECT policies that may be permissive
DROP POLICY IF EXISTS "Public can read wedding photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read wedding logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view wedding photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view wedding logos" ON storage.objects;
DROP POLICY IF EXISTS "Wedding photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Wedding logos are publicly accessible" ON storage.objects;

-- 3. Owners can read their own files (folder = auth.uid())
CREATE POLICY "Owners can read own wedding photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'wedding-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Owners can read own wedding logos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'wedding-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Public/anon can read only when the file belongs to a PUBLISHED site owner
CREATE POLICY "Public can read wedding photos for published sites"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'wedding-photos'
  AND EXISTS (
    SELECT 1 FROM public.wedding_sites ws
    WHERE ws.user_id::text = (storage.foldername(name))[1]
      AND ws.is_published = true
  )
);

CREATE POLICY "Public can read wedding logos for published sites"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'wedding-logos'
  AND EXISTS (
    SELECT 1 FROM public.wedding_sites ws
    WHERE ws.user_id::text = (storage.foldername(name))[1]
      AND ws.is_published = true
  )
);

-- 5. Fix wedding-logos UPDATE policy to add WITH CHECK preventing cross-folder moves
DROP POLICY IF EXISTS "Users can update own logos" ON storage.objects;
CREATE POLICY "Users can update own logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'wedding-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'wedding-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Apply the same hardening to wedding-photos UPDATE policy if present
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'wedding-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'wedding-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
