DROP POLICY IF EXISTS "Anyone can remove own reaction" ON public.guest_album_reactions;

CREATE POLICY "Anyone can remove reaction on approved post"
ON public.guest_album_reactions
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.guest_album_posts p
    JOIN public.wedding_sites ws ON ws.id = p.wedding_site_id
    WHERE p.id = guest_album_reactions.post_id
      AND p.status = 'approved'
      AND ws.is_published = true
      AND ws.status = 'active'
  )
);