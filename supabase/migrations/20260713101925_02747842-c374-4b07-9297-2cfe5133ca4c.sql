-- Guest album posts
CREATE TABLE public.guest_album_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_site_id uuid NOT NULL REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  guest_name text NOT NULL CHECK (char_length(guest_name) <= 100),
  caption text CHECK (caption IS NULL OR char_length(caption) <= 500),
  photo_url text NOT NULL,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','hidden')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX guest_album_posts_site_created_idx ON public.guest_album_posts (wedding_site_id, created_at DESC);

GRANT SELECT, INSERT ON public.guest_album_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_album_posts TO authenticated;
GRANT ALL ON public.guest_album_posts TO service_role;

ALTER TABLE public.guest_album_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved album posts"
  ON public.guest_album_posts FOR SELECT
  USING (status = 'approved' AND EXISTS (
    SELECT 1 FROM public.wedding_sites ws
    WHERE ws.id = guest_album_posts.wedding_site_id
      AND ws.is_published = true
      AND ws.status = 'active'
  ));

CREATE POLICY "Anyone can post to album on published site"
  ON public.guest_album_posts FOR INSERT
  WITH CHECK (
    status IN ('pending','approved')
    AND EXISTS (
      SELECT 1 FROM public.wedding_sites ws
      WHERE ws.id = guest_album_posts.wedding_site_id
        AND ws.is_published = true
        AND ws.status = 'active'
    )
    AND photo_url ~ ('^https://[^/]+/storage/v1/object/public/blessing-photos/' || wedding_site_id::text || '/')
  );

CREATE POLICY "Site owners can read all album posts"
  ON public.guest_album_posts FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.wedding_sites ws
    WHERE ws.id = guest_album_posts.wedding_site_id AND ws.user_id = auth.uid()
  ));

CREATE POLICY "Site owners can moderate album posts"
  ON public.guest_album_posts FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.wedding_sites ws
    WHERE ws.id = guest_album_posts.wedding_site_id AND ws.user_id = auth.uid()
  ));

CREATE POLICY "Site owners can delete album posts"
  ON public.guest_album_posts FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.wedding_sites ws
    WHERE ws.id = guest_album_posts.wedding_site_id AND ws.user_id = auth.uid()
  ));

-- Reactions
CREATE TABLE public.guest_album_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.guest_album_posts(id) ON DELETE CASCADE,
  guest_identifier text NOT NULL CHECK (char_length(guest_identifier) BETWEEN 1 AND 100),
  reaction text NOT NULL CHECK (reaction IN ('heart','party','love','clap','cheers')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, guest_identifier, reaction)
);
CREATE INDEX guest_album_reactions_post_idx ON public.guest_album_reactions (post_id);

GRANT SELECT, INSERT, DELETE ON public.guest_album_reactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_album_reactions TO authenticated;
GRANT ALL ON public.guest_album_reactions TO service_role;

ALTER TABLE public.guest_album_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reactions on approved posts"
  ON public.guest_album_reactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.guest_album_posts p
    JOIN public.wedding_sites ws ON ws.id = p.wedding_site_id
    WHERE p.id = guest_album_reactions.post_id
      AND p.status = 'approved'
      AND ws.is_published = true
      AND ws.status = 'active'
  ));

CREATE POLICY "Anyone can add reaction to approved post"
  ON public.guest_album_reactions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.guest_album_posts p
    JOIN public.wedding_sites ws ON ws.id = p.wedding_site_id
    WHERE p.id = guest_album_reactions.post_id
      AND p.status = 'approved'
      AND ws.is_published = true
      AND ws.status = 'active'
  ));

CREATE POLICY "Anyone can remove own reaction"
  ON public.guest_album_reactions FOR DELETE
  USING (true);

CREATE POLICY "Site owners can moderate reactions"
  ON public.guest_album_reactions FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.guest_album_posts p
    JOIN public.wedding_sites ws ON ws.id = p.wedding_site_id
    WHERE p.id = guest_album_reactions.post_id AND ws.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.guest_album_posts p
    JOIN public.wedding_sites ws ON ws.id = p.wedding_site_id
    WHERE p.id = guest_album_reactions.post_id AND ws.user_id = auth.uid()
  ));
