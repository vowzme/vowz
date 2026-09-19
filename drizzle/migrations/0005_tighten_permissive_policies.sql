-- 1) email_branding: only admins may read (edge functions use service_role)
DROP POLICY IF EXISTS "Anyone can read email branding" ON public.email_branding;
REVOKE SELECT ON public.email_branding FROM anon;

CREATE POLICY "Admins can read email branding"
  ON public.email_branding FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 2) platform_events: constrain anonymous analytics inserts
DROP POLICY IF EXISTS "Anyone can record a platform event" ON public.platform_events;

CREATE POLICY "Anyone can record a platform event"
  ON public.platform_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    event_type IN ('page_view', 'signup_started', 'signup_completed', 'cta_click')
    AND (user_id IS NULL OR user_id = auth.uid())
    AND length(visitor_id) BETWEEN 1 AND 64
    AND (session_id IS NULL OR length(session_id) <= 64)
    AND (path IS NULL OR length(path) <= 512)
    AND (referrer IS NULL OR length(referrer) <= 1024)
    AND (utm_source IS NULL OR length(utm_source) <= 128)
    AND (utm_medium IS NULL OR length(utm_medium) <= 128)
    AND (utm_campaign IS NULL OR length(utm_campaign) <= 128)
    AND (meta IS NULL OR pg_column_size(meta) <= 4096)
  );

-- 3) wedding_report_leads: constrain public quiz submissions
DROP POLICY IF EXISTS "Anyone can submit a wedding report" ON public.wedding_report_leads;

CREATE POLICY "Anyone can submit a wedding report"
  ON public.wedding_report_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND email IS NOT NULL
    AND length(email) BETWEEN 5 AND 255
    AND email ~* '^[^@\s]+@[^@\s.]+\.[^@\s]+$'
    AND (visitor_id IS NULL OR length(visitor_id) <= 64)
    AND (couple_name IS NULL OR length(couple_name) <= 200)
    AND (phone IS NULL OR length(phone) <= 32)
    AND (city IS NULL OR length(city) <= 120)
    AND (guest_count IS NULL OR guest_count BETWEEN 0 AND 100000)
    AND (budget IS NULL OR (budget >= 0 AND budget < 1000000000000))
    AND (score IS NULL OR score BETWEEN 0 AND 100)
    AND pg_column_size(answers) <= 20000
    AND pg_column_size(report) <= 40000
  );

-- 4) storage: bind object access to the uploader, keeping published-site access
DROP POLICY IF EXISTS "Public can read wedding photos for published sites" ON storage.objects;
CREATE POLICY "Public can read wedding photos for published sites"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'wedding-photos'
    AND (
      owner_id = (SELECT auth.uid()::text)
      OR (storage.foldername(name))[1] = (SELECT auth.uid()::text)
      OR EXISTS (
        SELECT 1 FROM public.wedding_sites ws
        WHERE ws.user_id::text = (storage.foldername(objects.name))[1]
          AND ws.is_published = true
      )
    )
  );

DROP POLICY IF EXISTS "Public can read wedding logos for published sites" ON storage.objects;
CREATE POLICY "Public can read wedding logos for published sites"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'wedding-logos'
    AND (
      owner_id = (SELECT auth.uid()::text)
      OR (storage.foldername(name))[1] = (SELECT auth.uid()::text)
      OR EXISTS (
        SELECT 1 FROM public.wedding_sites ws
        WHERE ws.user_id::text = (storage.foldername(objects.name))[1]
          AND ws.is_published = true
      )
    )
  );

DROP POLICY IF EXISTS "Anyone can upload blessing photos to published site folder" ON storage.objects;
CREATE POLICY "Anyone can upload blessing photos to published site folder"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'blessing-photos'
    AND (
      owner_id = (SELECT auth.uid()::text)
      OR (
        auth.uid() IS NULL
        AND EXISTS (
          SELECT 1 FROM public.wedding_sites ws
          WHERE ws.id::text = (storage.foldername(objects.name))[1]
            AND ws.is_published = true
        )
      )
    )
  );