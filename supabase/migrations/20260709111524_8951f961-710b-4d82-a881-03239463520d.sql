
-- 1) wedding_sites public SELECT policies: require status='active'
DROP POLICY IF EXISTS "Public can view published sites" ON public.wedding_sites;
CREATE POLICY "Public can view published sites"
  ON public.wedding_sites FOR SELECT TO anon
  USING (is_published = true AND status = 'active');

DROP POLICY IF EXISTS "Authenticated can view published sites" ON public.wedding_sites;
CREATE POLICY "Authenticated can view published sites"
  ON public.wedding_sites FOR SELECT TO authenticated
  USING (is_published = true AND status = 'active');

-- 2) rsvps INSERT
DROP POLICY IF EXISTS "Anyone can submit RSVP to published site" ON public.rsvps;
CREATE POLICY "Anyone can submit RSVP to published site"
  ON public.rsvps FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.wedding_sites
    WHERE wedding_sites.id = rsvps.wedding_site_id
      AND wedding_sites.is_published = true
      AND wedding_sites.status = 'active'
  ));

-- 3) guestbook INSERT + public SELECT
DROP POLICY IF EXISTS "Anyone can post wishes to published site" ON public.guestbook;
CREATE POLICY "Anyone can post wishes to published site"
  ON public.guestbook FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.wedding_sites
    WHERE wedding_sites.id = guestbook.wedding_site_id
      AND wedding_sites.is_published = true
      AND wedding_sites.status = 'active'
  ));

DROP POLICY IF EXISTS "Anyone can read wishes on published site" ON public.guestbook;
CREATE POLICY "Anyone can read wishes on published site"
  ON public.guestbook FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.wedding_sites
    WHERE wedding_sites.id = guestbook.wedding_site_id
      AND wedding_sites.is_published = true
      AND wedding_sites.status = 'active'
  ));

-- 4) guest_blessings INSERT + approved SELECT
DROP POLICY IF EXISTS "Anyone can post blessings to published site" ON public.guest_blessings;
CREATE POLICY "Anyone can post blessings to published site"
  ON public.guest_blessings FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.wedding_sites
      WHERE wedding_sites.id = guest_blessings.wedding_site_id
        AND wedding_sites.is_published = true
        AND wedding_sites.status = 'active'
    )
    AND (
      photo_url IS NULL
      OR photo_url ~ (('^https://[^/]+/storage/v1/object/public/blessing-photos/' || wedding_site_id::text) || '/')
    )
  );

DROP POLICY IF EXISTS "Anyone can read approved blessings" ON public.guest_blessings;
CREATE POLICY "Anyone can read approved blessings"
  ON public.guest_blessings FOR SELECT
  USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1 FROM public.wedding_sites
      WHERE wedding_sites.id = guest_blessings.wedding_site_id
        AND wedding_sites.is_published = true
        AND wedding_sites.status = 'active'
    )
  );

-- 5) poll_votes INSERT + SELECT
DROP POLICY IF EXISTS "Anyone can vote on published site polls" ON public.poll_votes;
CREATE POLICY "Anyone can vote on published site polls"
  ON public.poll_votes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.wedding_polls wp
    JOIN public.wedding_sites ws ON ws.id = wp.wedding_site_id
    WHERE wp.id = poll_votes.poll_id
      AND ws.is_published = true
      AND ws.status = 'active'
  ));

DROP POLICY IF EXISTS "Anyone can view votes on published sites" ON public.poll_votes;
CREATE POLICY "Anyone can view votes on published sites"
  ON public.poll_votes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.wedding_polls wp
    JOIN public.wedding_sites ws ON ws.id = wp.wedding_site_id
    WHERE wp.id = poll_votes.poll_id
      AND ws.is_published = true
      AND ws.status = 'active'
  ));

-- 6) site_analytics INSERT
DROP POLICY IF EXISTS "Anyone can track events on published sites" ON public.site_analytics;
CREATE POLICY "Anyone can track events on published sites"
  ON public.site_analytics FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.wedding_sites
    WHERE wedding_sites.id = site_analytics.wedding_site_id
      AND wedding_sites.is_published = true
      AND wedding_sites.status = 'active'
  ));

-- 7) Input length/range constraints on public submission tables
ALTER TABLE public.rsvps
  ADD CONSTRAINT rsvps_guest_name_len CHECK (char_length(guest_name) <= 100) NOT VALID,
  ADD CONSTRAINT rsvps_guest_count_range CHECK (guest_count IS NULL OR (guest_count BETWEEN 1 AND 20)) NOT VALID,
  ADD CONSTRAINT rsvps_message_len CHECK (message IS NULL OR char_length(message) <= 500) NOT VALID;

ALTER TABLE public.guestbook
  ADD CONSTRAINT guestbook_guest_name_len CHECK (char_length(guest_name) <= 100) NOT VALID,
  ADD CONSTRAINT guestbook_message_len CHECK (char_length(message) <= 1000) NOT VALID;

ALTER TABLE public.guest_blessings
  ADD CONSTRAINT blessings_guest_name_len CHECK (char_length(guest_name) <= 100) NOT VALID,
  ADD CONSTRAINT blessings_message_len CHECK (message IS NULL OR char_length(message) <= 1000) NOT VALID;
