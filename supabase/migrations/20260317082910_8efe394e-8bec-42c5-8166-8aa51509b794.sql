
-- Coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  scope text NOT NULL DEFAULT 'global' CHECK (scope IN ('india', 'international', 'global')),
  usage_type text NOT NULL DEFAULT 'unlimited' CHECK (usage_type IN ('one_time', 'limited', 'unlimited')),
  max_uses integer DEFAULT NULL,
  times_used integer NOT NULL DEFAULT 0,
  min_order_value numeric DEFAULT NULL,
  max_discount_cap numeric DEFAULT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'archived')),
  expires_at timestamp with time zone DEFAULT NULL,
  notes text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Coupon redemptions table
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  discount_applied numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  original_amount numeric NOT NULL DEFAULT 0,
  final_amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for coupons
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Anyone can read active coupons (for validation during checkout)
CREATE POLICY "Anyone can read active coupons" ON public.coupons FOR SELECT TO authenticated
  USING (status = 'active');

-- Admin policies for redemptions
CREATE POLICY "Admins can read all redemptions" ON public.coupon_redemptions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Users can read own redemptions
CREATE POLICY "Users can read own redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Service role can insert redemptions (from edge function)
CREATE POLICY "Service role can insert redemptions" ON public.coupon_redemptions FOR INSERT TO public
  WITH CHECK (auth.role() = 'service_role');

-- Updated_at trigger for coupons
CREATE TRIGGER set_coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
