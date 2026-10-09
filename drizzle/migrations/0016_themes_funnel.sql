DROP POLICY IF EXISTS "Anyone can record a platform event" ON public.platform_events;
CREATE POLICY "Anyone can record a platform event" ON public.platform_events FOR INSERT TO anon, authenticated
WITH CHECK ((event_type = ANY (ARRAY['page_view','signup_started','signup_completed','cta_click','themes_view','theme_pick','theme_site_created'])) AND ((user_id IS NULL) OR (user_id = auth.uid())) AND ((length(visitor_id) >= 1) AND (length(visitor_id) <= 64)) AND ((session_id IS NULL) OR (length(session_id) <= 64)) AND ((path IS NULL) OR (length(path) <= 512)) AND ((referrer IS NULL) OR (length(referrer) <= 1024)) AND ((utm_source IS NULL) OR (length(utm_source) <= 128)) AND ((utm_medium IS NULL) OR (length(utm_medium) <= 128)) AND ((utm_campaign IS NULL) OR (length(utm_campaign) <= 128)) AND ((meta IS NULL) OR (pg_column_size(meta) <= 4096)));

CREATE OR REPLACE FUNCTION public.get_themes_funnel(_days integer)
RETURNS TABLE(themes_visitors bigint, pickers bigint, creators bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'not allowed'; END IF;
  RETURN QUERY SELECT
    count(DISTINCT visitor_id) FILTER (WHERE event_type = 'themes_view'),
    count(DISTINCT visitor_id) FILTER (WHERE event_type = 'theme_pick'),
    count(DISTINCT visitor_id) FILTER (WHERE event_type = 'theme_site_created')
  FROM public.platform_events WHERE created_at >= now() - make_interval(days => _days);
END $$;
GRANT EXECUTE ON FUNCTION public.get_themes_funnel(integer) TO authenticated;