
-- Remove broad franchise SELECT on affiliates (exposes payout info)
DROP POLICY IF EXISTS "Franchise can view sub-affiliates" ON public.affiliates;

-- Safe view: franchise owner can see sub-affiliates without payout details
CREATE OR REPLACE VIEW public.franchise_sub_affiliates
WITH (security_invoker = true)
AS
SELECT
  a.id,
  a.full_name,
  a.email,
  a.referral_code,
  a.is_active,
  a.successful_referrals,
  a.total_referrals,
  a.created_at,
  a.franchise_id
FROM public.affiliates a
WHERE a.franchise_id IN (
  SELECT f.id FROM public.affiliates f
  WHERE f.user_id = auth.uid() AND f.is_franchise = true
);

GRANT SELECT ON public.franchise_sub_affiliates TO authenticated;
