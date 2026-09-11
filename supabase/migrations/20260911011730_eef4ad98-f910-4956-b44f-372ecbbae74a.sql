-- ── poll_votes: hide voter_name from the public ───────────────────────────────
DROP POLICY IF EXISTS "Anyone can view votes on published sites" ON public.poll_votes;
DROP POLICY IF EXISTS "Site owners can manage votes" ON public.poll_votes;

CREATE POLICY "Site owners and admins can manage votes"
ON public.poll_votes FOR ALL TO authenticated
USING (
  public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.wedding_polls wp
    JOIN public.wedding_sites ws ON ws.id = wp.wedding_site_id
    WHERE wp.id = poll_votes.poll_id AND ws.user_id = auth.uid()
  )
)
WITH CHECK (
  public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.wedding_polls wp
    JOIN public.wedding_sites ws ON ws.id = wp.wedding_site_id
    WHERE wp.id = poll_votes.poll_id AND ws.user_id = auth.uid()
  )
);

REVOKE SELECT ON public.poll_votes FROM anon;
GRANT INSERT ON public.poll_votes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_votes TO authenticated;
GRANT ALL ON public.poll_votes TO service_role;

CREATE OR REPLACE FUNCTION public.get_poll_results(_site_id uuid)
RETURNS TABLE(poll_id uuid, option_index integer, votes bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pv.poll_id, pv.option_index, count(*)::bigint
  FROM public.poll_votes pv
  JOIN public.wedding_polls wp ON wp.id = pv.poll_id
  JOIN public.wedding_sites ws ON ws.id = wp.wedding_site_id
  WHERE ws.id = _site_id
    AND ws.is_published = true
    AND ws.status = 'active'
  GROUP BY pv.poll_id, pv.option_index;
$$;

GRANT EXECUTE ON FUNCTION public.get_poll_results(uuid) TO anon, authenticated;

-- ── guest_album_reactions: hide guest_identifier from readers ────────────────
REVOKE SELECT ON public.guest_album_reactions FROM anon, authenticated;
GRANT SELECT (id, post_id, reaction, created_at) ON public.guest_album_reactions TO anon, authenticated;
GRANT INSERT, DELETE ON public.guest_album_reactions TO anon, authenticated;
GRANT ALL ON public.guest_album_reactions TO service_role;

ALTER TABLE public.guest_album_reactions
  ADD CONSTRAINT guest_album_reactions_identifier_opaque
  CHECK (
    length(guest_identifier) BETWEEN 8 AND 64
    AND position('@' in guest_identifier) = 0
  ) NOT VALID;

CREATE OR REPLACE FUNCTION public.my_album_reactions(_site_id uuid, _guest_identifier text)
RETURNS TABLE(post_id uuid, reaction text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.post_id, r.reaction
  FROM public.guest_album_reactions r
  JOIN public.guest_album_posts p ON p.id = r.post_id
  JOIN public.wedding_sites ws ON ws.id = p.wedding_site_id
  WHERE ws.id = _site_id
    AND ws.is_published = true
    AND ws.status = 'active'
    AND p.status = 'approved'
    AND r.guest_identifier = _guest_identifier;
$$;

GRANT EXECUTE ON FUNCTION public.my_album_reactions(uuid, text) TO anon, authenticated;

-- ── wedding_site_passwords: explicit removal rule for owners/admins ──────────
CREATE POLICY "Owners and admins can delete site password"
ON public.wedding_site_passwords FOR DELETE TO authenticated
USING (
  public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.wedding_sites ws
    WHERE ws.id = wedding_site_passwords.wedding_site_id
      AND ws.user_id = auth.uid()
  )
);