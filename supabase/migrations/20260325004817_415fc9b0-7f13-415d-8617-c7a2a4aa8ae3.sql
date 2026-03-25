
-- Add franchise fields to affiliates table
ALTER TABLE public.affiliates 
  ADD COLUMN IF NOT EXISTS is_franchise boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS franchise_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS franchise_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL;

-- Create franchise_commissions table to track override commissions
CREATE TABLE public.franchise_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  sub_affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_id uuid NOT NULL REFERENCES public.affiliate_referrals(id) ON DELETE CASCADE,
  commission_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  payout_status text NOT NULL DEFAULT 'pending',
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.franchise_commissions ENABLE ROW LEVEL SECURITY;

-- Franchise partners can view their own commissions
CREATE POLICY "Franchise can view own commissions"
  ON public.franchise_commissions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.affiliates
    WHERE affiliates.id = franchise_commissions.franchise_id
      AND affiliates.user_id = auth.uid()
  ));

-- Admins can manage all franchise commissions
CREATE POLICY "Admins can manage franchise commissions"
  ON public.franchise_commissions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Add payout_status to affiliate_referrals for tracking
ALTER TABLE public.affiliate_referrals
  ADD COLUMN IF NOT EXISTS payout_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

-- Allow admins to read all affiliates
CREATE POLICY "Admins can view all affiliates"
  ON public.affiliates FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Allow admins to update all affiliates
CREATE POLICY "Admins can update all affiliates"
  ON public.affiliates FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Allow admins to delete affiliates
CREATE POLICY "Admins can delete affiliates"
  ON public.affiliates FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Allow franchise partners to view their sub-affiliates (basic info)
CREATE POLICY "Franchise can view sub-affiliates"
  ON public.affiliates FOR SELECT TO authenticated
  USING (franchise_id IN (
    SELECT id FROM public.affiliates WHERE user_id = auth.uid() AND is_franchise = true
  ));

-- Service role can insert franchise commissions (from edge functions)
CREATE POLICY "Service role can insert franchise commissions"
  ON public.franchise_commissions FOR INSERT TO public
  WITH CHECK (auth.role() = 'service_role');

-- Allow admins to manage referrals
CREATE POLICY "Admins can manage referrals"
  ON public.affiliate_referrals FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
