
-- Create public storage bucket for wedding photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('wedding-photos', 'wedding-photos', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload wedding photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'wedding-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own photos
CREATE POLICY "Users can update own wedding photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'wedding-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'wedding-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own photos
CREATE POLICY "Users can delete own wedding photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'wedding-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (for published sites)
CREATE POLICY "Public can view wedding photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'wedding-photos');
