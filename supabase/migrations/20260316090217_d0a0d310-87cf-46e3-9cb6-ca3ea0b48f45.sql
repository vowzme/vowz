
-- Guest blessings table for the enhanced blessing wall
CREATE TABLE public.guest_blessings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wedding_site_id UUID NOT NULL REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  message TEXT NOT NULL,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  owner_reply TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.guest_blessings ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a blessing to a published site
CREATE POLICY "Anyone can post blessings to published site"
  ON public.guest_blessings FOR INSERT
  TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM wedding_sites
    WHERE wedding_sites.id = guest_blessings.wedding_site_id
    AND wedding_sites.is_published = true
  ));

-- Anyone can read approved blessings on published site
CREATE POLICY "Anyone can read approved blessings"
  ON public.guest_blessings FOR SELECT
  TO public
  USING (
    status = 'approved' AND EXISTS (
      SELECT 1 FROM wedding_sites
      WHERE wedding_sites.id = guest_blessings.wedding_site_id
      AND wedding_sites.is_published = true
    )
  );

-- Site owners can read all blessings (for moderation)
CREATE POLICY "Site owners can read all blessings"
  ON public.guest_blessings FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM wedding_sites
    WHERE wedding_sites.id = guest_blessings.wedding_site_id
    AND wedding_sites.user_id = auth.uid()
  ));

-- Site owners can update blessings (approve/reject/reply)
CREATE POLICY "Site owners can update blessings"
  ON public.guest_blessings FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM wedding_sites
    WHERE wedding_sites.id = guest_blessings.wedding_site_id
    AND wedding_sites.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM wedding_sites
    WHERE wedding_sites.id = guest_blessings.wedding_site_id
    AND wedding_sites.user_id = auth.uid()
  ));

-- Site owners can delete blessings
CREATE POLICY "Site owners can delete blessings"
  ON public.guest_blessings FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM wedding_sites
    WHERE wedding_sites.id = guest_blessings.wedding_site_id
    AND wedding_sites.user_id = auth.uid()
  ));

-- Create storage bucket for blessing photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('blessing-photos', 'blessing-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: anyone can upload blessing photos (max size enforced client-side)
CREATE POLICY "Anyone can upload blessing photos"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'blessing-photos');

CREATE POLICY "Anyone can read blessing photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'blessing-photos');
