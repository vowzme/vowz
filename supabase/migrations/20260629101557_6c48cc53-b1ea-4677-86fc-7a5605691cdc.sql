DROP POLICY IF EXISTS "Anyone can log template events" ON public.template_events;
CREATE POLICY "Anyone can log template events"
  ON public.template_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    event_type IN ('open','preview','use','render','download')
    AND template_slug IS NOT NULL
    AND length(template_slug) BETWEEN 1 AND 200
    AND (user_id IS NULL OR user_id = auth.uid())
  );