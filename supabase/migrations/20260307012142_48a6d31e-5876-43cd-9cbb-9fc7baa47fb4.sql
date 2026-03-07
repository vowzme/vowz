
-- Add logo_url column to wedding_sites (optional, nullable)
ALTER TABLE public.wedding_sites ADD COLUMN IF NOT EXISTS logo_url text DEFAULT NULL;

-- Create storage bucket for wedding logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('wedding-logos', 'wedding-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wedding-logos');

-- Allow anyone to view logos (public bucket)
CREATE POLICY "Anyone can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'wedding-logos');

-- Allow users to delete their own logos
CREATE POLICY "Users can delete own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'wedding-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to update their own logos
CREATE POLICY "Users can update own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'wedding-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
