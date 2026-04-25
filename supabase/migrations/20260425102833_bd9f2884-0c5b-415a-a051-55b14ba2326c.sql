
-- 1. Tighten affiliates INSERT to prevent privilege escalation
DROP POLICY IF EXISTS "Affiliates can insert own record" ON public.affiliates;

CREATE POLICY "Affiliates can insert own record"
ON public.affiliates
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND is_franchise = false
  AND franchise_approved = false
  AND COALESCE(franchise_id, '00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid
  AND total_earnings = 0
  AND pending_earnings = 0
  AND paid_earnings = 0
  AND total_referrals = 0
  AND successful_referrals = 0
);

-- Also tighten UPDATE: prevent self-promotion to franchise / approval / earnings tampering
DROP POLICY IF EXISTS "Affiliates can update own record" ON public.affiliates;

CREATE POLICY "Affiliates can update own record"
ON public.affiliates
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND is_franchise = (SELECT a.is_franchise FROM public.affiliates a WHERE a.id = affiliates.id)
  AND franchise_approved = (SELECT a.franchise_approved FROM public.affiliates a WHERE a.id = affiliates.id)
  AND COALESCE(franchise_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = COALESCE((SELECT a.franchise_id FROM public.affiliates a WHERE a.id = affiliates.id), '00000000-0000-0000-0000-000000000000'::uuid)
  AND total_earnings = (SELECT a.total_earnings FROM public.affiliates a WHERE a.id = affiliates.id)
  AND pending_earnings = (SELECT a.pending_earnings FROM public.affiliates a WHERE a.id = affiliates.id)
  AND paid_earnings = (SELECT a.paid_earnings FROM public.affiliates a WHERE a.id = affiliates.id)
  AND total_referrals = (SELECT a.total_referrals FROM public.affiliates a WHERE a.id = affiliates.id)
  AND successful_referrals = (SELECT a.successful_referrals FROM public.affiliates a WHERE a.id = affiliates.id)
  AND referral_code = (SELECT a.referral_code FROM public.affiliates a WHERE a.id = affiliates.id)
);

-- 2. Mask referred_email from affiliates (admins keep full access via existing ALL policy)
DROP POLICY IF EXISTS "Affiliates can view own referrals" ON public.affiliate_referrals;

-- Affiliate-facing view that masks the referred_email
CREATE OR REPLACE VIEW public.affiliate_referrals_for_affiliate
WITH (security_invoker = true)
AS
SELECT
  ar.id,
  ar.affiliate_id,
  ar.referred_user_id,
  CASE
    WHEN ar.referred_email IS NULL OR position('@' in ar.referred_email) = 0 THEN NULL
    ELSE left(ar.referred_email, 1) || '***@' || split_part(ar.referred_email, '@', 2)
  END AS referred_email_masked,
  ar.status,
  ar.plan,
  ar.commission_amount,
  ar.commission_paid,
  ar.payout_status,
  ar.converted_at,
  ar.paid_at,
  ar.created_at
FROM public.affiliate_referrals ar
WHERE EXISTS (
  SELECT 1 FROM public.affiliates a
  WHERE a.id = ar.affiliate_id AND a.user_id = auth.uid()
);

GRANT SELECT ON public.affiliate_referrals_for_affiliate TO authenticated;

-- 3. Storage DELETE policy for blessing-photos: site owners (and admins) can delete
CREATE POLICY "Site owners can delete blessing photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'blessing-photos'
  AND (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.wedding_sites ws
      WHERE ws.user_id = auth.uid()
        AND (storage.foldername(name))[1] = ws.id::text
    )
  )
);
