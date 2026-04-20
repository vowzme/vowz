-- 1. Storage usage tracking (one row per user)
CREATE TABLE public.r2_storage_usage (
  user_id UUID PRIMARY KEY,
  used_bytes BIGINT NOT NULL DEFAULT 0,
  file_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.r2_storage_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own storage usage"
  ON public.r2_storage_usage FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all storage usage"
  ON public.r2_storage_usage FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Service role can manage storage usage"
  ON public.r2_storage_usage FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2. Storage add-ons (stackable, 6-month validity)
CREATE TABLE public.user_storage_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bytes_added BIGINT NOT NULL DEFAULT 2147483648, -- 2 GB
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_id TEXT,
  payment_order_id TEXT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '6 months'),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_storage_addons_user_active ON public.user_storage_addons(user_id, expires_at) WHERE status = 'active';

ALTER TABLE public.user_storage_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addons"
  ON public.user_storage_addons FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all addons"
  ON public.user_storage_addons FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Service role can manage addons"
  ON public.user_storage_addons FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3. Add duration_months to subscriptions (default 6 for new, existing keep their cycle)
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS duration_months INTEGER NOT NULL DEFAULT 6;

-- Backfill existing premium_yearly subscriptions to 12 months so they keep their 1-year cycle
UPDATE public.user_subscriptions
  SET duration_months = 12
  WHERE plan = 'premium_yearly' AND status = 'active';

-- 4. Quota helper function
CREATE OR REPLACE FUNCTION public.get_user_storage_quota(_user_id UUID)
RETURNS TABLE (
  used_bytes BIGINT,
  base_quota_bytes BIGINT,
  addon_bytes BIGINT,
  total_quota_bytes BIGINT,
  is_premium BOOLEAN,
  file_count INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _used BIGINT := 0;
  _files INTEGER := 0;
  _base BIGINT;
  _addon BIGINT := 0;
  _premium BOOLEAN := false;
BEGIN
  SELECT COALESCE(rsu.used_bytes, 0), COALESCE(rsu.file_count, 0)
    INTO _used, _files
    FROM public.r2_storage_usage rsu
    WHERE rsu.user_id = _user_id;

  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
      AND plan IN ('premium_yearly', 'premium_6mo', 'premium')
  ) INTO _premium;

  -- 100 MB free, 500 MB premium
  _base := CASE WHEN _premium THEN 524288000 ELSE 104857600 END;

  SELECT COALESCE(SUM(bytes_added), 0)
    INTO _addon
    FROM public.user_storage_addons
    WHERE user_id = _user_id
      AND status = 'active'
      AND expires_at > now();

  RETURN QUERY SELECT
    _used,
    _base,
    _addon,
    (_base + _addon),
    _premium,
    _files;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_storage_quota(UUID) TO authenticated, service_role;

-- 5. Trigger to keep updated_at fresh on r2_storage_usage
CREATE TRIGGER trg_r2_storage_usage_updated_at
  BEFORE UPDATE ON public.r2_storage_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();