-- Guestbook: scope owner policies to authenticated role
DROP POLICY IF EXISTS "Site owners can delete wishes" ON public.guestbook;
DROP POLICY IF EXISTS "Site owners can read wishes" ON public.guestbook;

CREATE POLICY "Site owners can read wishes"
  ON public.guestbook
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wedding_sites ws
      WHERE ws.id = guestbook.wedding_site_id
        AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Site owners can delete wishes"
  ON public.guestbook
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wedding_sites ws
      WHERE ws.id = guestbook.wedding_site_id
        AND ws.user_id = auth.uid()
    )
  );

-- Affiliates: drop redundant self-referential subquery WITH CHECK; rely on
-- trg_enforce_affiliate_immutable_fields trigger as the sole source of truth
-- for immutable field protection.
DROP POLICY IF EXISTS "Affiliates can update own record" ON public.affiliates;

CREATE POLICY "Affiliates can update own record"
  ON public.affiliates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND NOT public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() AND NOT public.is_admin(auth.uid()));
