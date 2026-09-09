CREATE TABLE public.platform_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  session_id text,
  user_id uuid,
  event_type text NOT NULL,
  path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_platform_events_created_at ON public.platform_events (created_at DESC);
CREATE INDEX idx_platform_events_type ON public.platform_events (event_type, created_at DESC);
CREATE INDEX idx_platform_events_visitor ON public.platform_events (visitor_id);

GRANT INSERT ON public.platform_events TO anon, authenticated;
GRANT SELECT ON public.platform_events TO authenticated;
GRANT ALL ON public.platform_events TO service_role;

ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a platform event"
ON public.platform_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can read platform events"
ON public.platform_events FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.get_platform_funnel(_days integer DEFAULT 30)
RETURNS TABLE(
  visitors bigint,
  pricing_viewers bigint,
  auth_viewers bigint,
  signups bigint,
  sites_created bigint,
  sites_published bigint,
  rsvp_page_visitors bigint,
  rsvp_form_views bigint,
  rsvp_submissions bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH win AS (SELECT now() - (GREATEST(1, LEAST(365, _days)) || ' days')::interval AS since)
  SELECT
    (SELECT count(DISTINCT visitor_id) FROM public.platform_events, win WHERE created_at >= win.since),
    (SELECT count(DISTINCT visitor_id) FROM public.platform_events, win WHERE created_at >= win.since AND path LIKE '/pricing%'),
    (SELECT count(DISTINCT visitor_id) FROM public.platform_events, win WHERE created_at >= win.since AND path LIKE '/auth%'),
    (SELECT count(*) FROM public.profiles, win WHERE created_at >= win.since),
    (SELECT count(*) FROM public.wedding_sites, win WHERE created_at >= win.since),
    (SELECT count(*) FROM public.wedding_sites, win WHERE created_at >= win.since AND is_published = true),
    (SELECT count(DISTINCT visitor_id) FROM public.site_analytics, win WHERE created_at >= win.since AND event_type = 'page_view'),
    (SELECT count(DISTINCT visitor_id) FROM public.site_analytics, win WHERE created_at >= win.since AND event_type = 'rsvp_view'),
    (SELECT count(*) FROM public.site_analytics, win WHERE created_at >= win.since AND event_type IN ('rsvp_submit','rsvp_update'))
  WHERE public.is_admin(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.get_platform_funnel(integer) FROM public;
GRANT EXECUTE ON FUNCTION public.get_platform_funnel(integer) TO authenticated;