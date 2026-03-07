CREATE TABLE public.wedding_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_site_id uuid REFERENCES public.wedding_sites(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES public.wedding_polls(id) ON DELETE CASCADE NOT NULL,
  option_index integer NOT NULL,
  voter_name text NOT NULL DEFAULT 'Anonymous',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wedding_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can view polls on published sites
CREATE POLICY "Anyone can view polls on published sites" ON public.wedding_polls
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM wedding_sites WHERE wedding_sites.id = wedding_polls.wedding_site_id AND wedding_sites.is_published = true)
  );

-- Site owners can manage polls
CREATE POLICY "Site owners can manage polls" ON public.wedding_polls
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wedding_sites WHERE wedding_sites.id = wedding_polls.wedding_site_id AND wedding_sites.user_id = auth.uid())
  );

-- Anyone can vote on published site polls
CREATE POLICY "Anyone can vote on published site polls" ON public.poll_votes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM wedding_polls wp JOIN wedding_sites ws ON ws.id = wp.wedding_site_id WHERE wp.id = poll_votes.poll_id AND ws.is_published = true)
  );

-- Anyone can view votes on published sites
CREATE POLICY "Anyone can view votes on published sites" ON public.poll_votes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM wedding_polls wp JOIN wedding_sites ws ON ws.id = wp.wedding_site_id WHERE wp.id = poll_votes.poll_id AND ws.is_published = true)
  );

-- Site owners can view/delete votes
CREATE POLICY "Site owners can manage votes" ON public.poll_votes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wedding_polls wp JOIN wedding_sites ws ON ws.id = wp.wedding_site_id WHERE wp.id = poll_votes.poll_id AND ws.user_id = auth.uid())
  );