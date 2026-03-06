
CREATE POLICY "Site owners can delete RSVPs"
  ON public.rsvps FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wedding_sites
      WHERE wedding_sites.id = rsvps.wedding_site_id
      AND wedding_sites.user_id = auth.uid()
    )
  );
