
-- Affiliates table
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text DEFAULT NULL,
  referral_code text NOT NULL UNIQUE,
  custom_coupon text UNIQUE DEFAULT NULL,
  total_referrals integer NOT NULL DEFAULT 0,
  successful_referrals integer NOT NULL DEFAULT 0,
  total_earnings numeric(10,2) NOT NULL DEFAULT 0,
  pending_earnings numeric(10,2) NOT NULL DEFAULT 0,
  paid_earnings numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Affiliate referrals table
CREATE TABLE public.affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id uuid DEFAULT NULL,
  referred_email text DEFAULT NULL,
  status text NOT NULL DEFAULT 'pending',
  plan text NOT NULL DEFAULT 'free',
  commission_amount numeric(10,2) NOT NULL DEFAULT 0,
  commission_paid boolean NOT NULL DEFAULT false,
  converted_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- Affiliates: users can view/update own record
CREATE POLICY "Affiliates can view own record"
  ON public.affiliates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Affiliates can update own record"
  ON public.affiliates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Affiliates can insert own record"
  ON public.affiliates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Referrals: affiliates can view own referrals
CREATE POLICY "Affiliates can view own referrals"
  ON public.affiliate_referrals FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.affiliates
    WHERE affiliates.id = affiliate_referrals.affiliate_id
    AND affiliates.user_id = auth.uid()
  ));

-- Public read for referral code/coupon lookup (for tracking)
CREATE POLICY "Anyone can lookup affiliate by code"
  ON public.affiliates FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
