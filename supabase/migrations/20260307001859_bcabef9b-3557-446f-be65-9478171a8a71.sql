-- Analytics events table for built-in tracking
CREATE TABLE public.site_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_site_id uuid NOT NULL REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'page_view', 'rsvp_submit', 'guestbook_post', 'link_click'
  metadata jsonb DEFAULT '{}'::jsonb,
  visitor_id text, -- anonymous session fingerprint
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics events on published sites (anonymous tracking)
CREATE POLICY "Anyone can track events on published sites"
  ON public.site_analytics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_sites
      WHERE wedding_sites.id = site_analytics.wedding_site_id
      AND wedding_sites.is_published = true
    )
  );

-- Site owners can read their own analytics
CREATE POLICY "Site owners can read analytics"
  ON public.site_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wedding_sites
      WHERE wedding_sites.id = site_analytics.wedding_site_id
      AND wedding_sites.user_id = auth.uid()
    )
  );

-- Create index for fast queries
CREATE INDEX idx_site_analytics_site_id ON public.site_analytics(wedding_site_id);
CREATE INDEX idx_site_analytics_created_at ON public.site_analytics(created_at);