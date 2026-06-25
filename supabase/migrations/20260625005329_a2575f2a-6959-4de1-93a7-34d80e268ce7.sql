-- Template favorites (per-user)
CREATE TABLE public.template_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, template_slug)
);

GRANT SELECT, INSERT, DELETE ON public.template_favorites TO authenticated;
GRANT ALL ON public.template_favorites TO service_role;

ALTER TABLE public.template_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own favorites"
  ON public.template_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users add own favorites"
  ON public.template_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove own favorites"
  ON public.template_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX template_favorites_user_idx ON public.template_favorites(user_id);

-- Template analytics events
CREATE TABLE public.template_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_slug text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('open','preview','use')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.template_events TO anon, authenticated;
GRANT SELECT ON public.template_events TO authenticated;
GRANT ALL ON public.template_events TO service_role;

ALTER TABLE public.template_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log template events"
  ON public.template_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read events"
  ON public.template_events FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX template_events_slug_idx ON public.template_events(template_slug);
CREATE INDEX template_events_type_idx ON public.template_events(event_type);

-- Popularity aggregate (callable by everyone via Data API)
CREATE OR REPLACE FUNCTION public.get_template_popularity()
RETURNS TABLE(template_slug text, score bigint, opens bigint, previews bigint, uses bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    template_slug,
    SUM(CASE event_type WHEN 'open' THEN 1 WHEN 'preview' THEN 2 WHEN 'use' THEN 5 ELSE 0 END)::bigint AS score,
    SUM(CASE WHEN event_type = 'open' THEN 1 ELSE 0 END)::bigint AS opens,
    SUM(CASE WHEN event_type = 'preview' THEN 1 ELSE 0 END)::bigint AS previews,
    SUM(CASE WHEN event_type = 'use' THEN 1 ELSE 0 END)::bigint AS uses
  FROM public.template_events
  GROUP BY template_slug;
$$;

GRANT EXECUTE ON FUNCTION public.get_template_popularity() TO anon, authenticated;