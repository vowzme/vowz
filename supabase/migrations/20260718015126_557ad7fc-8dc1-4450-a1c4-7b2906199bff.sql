
-- 1) Wedding polls: scope owner ALL policy to authenticated
DROP POLICY IF EXISTS "Site owners can manage polls" ON public.wedding_polls;
CREATE POLICY "Site owners can manage polls" ON public.wedding_polls
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.wedding_sites WHERE wedding_sites.id = wedding_polls.wedding_site_id AND wedding_sites.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.wedding_sites WHERE wedding_sites.id = wedding_polls.wedding_site_id AND wedding_sites.user_id = auth.uid()));

-- 2) Guest album posts: hide guest_email from anon/authenticated column-level, keep for service_role.
REVOKE SELECT (guest_email) ON public.guest_album_posts FROM anon;
REVOKE SELECT (guest_email) ON public.guest_album_posts FROM authenticated;

-- 3) Affiliates self-update: add WITH CHECK enforcing immutable fields at RLS layer
--    (defense in depth alongside the existing enforce_affiliate_immutable_fields trigger).
DROP POLICY IF EXISTS "Affiliates can update own record" ON public.affiliates;
CREATE POLICY "Affiliates can update own record" ON public.affiliates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND NOT public.is_admin(auth.uid()))
  WITH CHECK (
    user_id = auth.uid()
    AND is_franchise         = (SELECT a.is_franchise         FROM public.affiliates a WHERE a.id = affiliates.id)
    AND franchise_approved   = (SELECT a.franchise_approved   FROM public.affiliates a WHERE a.id = affiliates.id)
    AND franchise_id         IS NOT DISTINCT FROM (SELECT a.franchise_id FROM public.affiliates a WHERE a.id = affiliates.id)
    AND total_earnings       = (SELECT a.total_earnings       FROM public.affiliates a WHERE a.id = affiliates.id)
    AND pending_earnings     = (SELECT a.pending_earnings     FROM public.affiliates a WHERE a.id = affiliates.id)
    AND paid_earnings        = (SELECT a.paid_earnings        FROM public.affiliates a WHERE a.id = affiliates.id)
    AND total_referrals      = (SELECT a.total_referrals      FROM public.affiliates a WHERE a.id = affiliates.id)
    AND successful_referrals = (SELECT a.successful_referrals FROM public.affiliates a WHERE a.id = affiliates.id)
    AND referral_code        = (SELECT a.referral_code        FROM public.affiliates a WHERE a.id = affiliates.id)
  );
