-- Create guestbook/wishes table
CREATE TABLE public.guestbook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_site_id uuid NOT NULL REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guestbook ENABLE ROW LEVEL SECURITY;

-- Anyone can post wishes on published sites
CREATE POLICY "Anyone can post wishes to published site"
  ON public.guestbook FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_sites
      WHERE wedding_sites.id = guestbook.wedding_site_id
      AND wedding_sites.is_published = true
    )
  );

-- Anyone can read wishes on published sites  
CREATE POLICY "Anyone can read wishes on published site"
  ON public.guestbook FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wedding_sites
      WHERE wedding_sites.id = guestbook.wedding_site_id
      AND wedding_sites.is_published = true
    )
  );

-- Site owners can read all wishes
CREATE POLICY "Site owners can read wishes"
  ON public.guestbook FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wedding_sites
      WHERE wedding_sites.id = guestbook.wedding_site_id
      AND wedding_sites.user_id = auth.uid()
    )
  );

-- Site owners can delete wishes
CREATE POLICY "Site owners can delete wishes"
  ON public.guestbook FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM wedding_sites
      WHERE wedding_sites.id = guestbook.wedding_site_id
      AND wedding_sites.user_id = auth.uid()
    )
  );