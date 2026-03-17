
-- Table to store old slugs for redirect support
CREATE TABLE public.slug_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  old_slug text NOT NULL,
  wedding_site_id uuid NOT NULL REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookup by old_slug
CREATE UNIQUE INDEX idx_slug_redirects_old_slug ON public.slug_redirects(old_slug);

-- Enable RLS
ALTER TABLE public.slug_redirects ENABLE ROW LEVEL SECURITY;

-- Anyone can read redirects (needed for public site resolution)
CREATE POLICY "Anyone can read slug redirects"
  ON public.slug_redirects FOR SELECT
  TO public
  USING (true);

-- Site owners can insert redirects (triggered on slug change)
CREATE POLICY "Site owners can insert slug redirects"
  ON public.slug_redirects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wedding_sites
      WHERE wedding_sites.id = slug_redirects.wedding_site_id
        AND wedding_sites.user_id = auth.uid()
    )
  );

-- Site owners can delete their redirects
CREATE POLICY "Site owners can delete slug redirects"
  ON public.slug_redirects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wedding_sites
      WHERE wedding_sites.id = slug_redirects.wedding_site_id
        AND wedding_sites.user_id = auth.uid()
    )
  );
