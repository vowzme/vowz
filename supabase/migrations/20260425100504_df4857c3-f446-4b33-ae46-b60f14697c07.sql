
-- 1. Restrict coupon SELECT to admins only (was: any authenticated user could read all internal fields)
DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupons;

-- Create a SECURITY DEFINER function that exposes only redemption-relevant fields
-- after server-side validation. Returns NULL if coupon is invalid/expired/etc.
CREATE OR REPLACE FUNCTION public.validate_coupon_for_redemption(
  _code text,
  _currency text,
  _scope text,
  _order_amount numeric
)
RETURNS TABLE (
  coupon_id uuid,
  code text,
  discount_type text,
  discount_value numeric,
  max_discount_cap numeric,
  min_order_value numeric,
  message text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c RECORD;
BEGIN
  SELECT * INTO c
  FROM public.coupons
  WHERE upper(coupons.code) = upper(_code)
    AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
    RETURN;
  END IF;

  IF c.scope <> 'global' AND c.scope <> _scope THEN
    RETURN;
  END IF;

  IF c.usage_type <> 'unlimited' THEN
    IF c.times_used >= COALESCE(c.max_uses, 1) THEN
      RETURN;
    END IF;
  END IF;

  IF c.min_order_value IS NOT NULL AND _order_amount < c.min_order_value THEN
    RETURN;
  END IF;

  -- For fixed-amount coupons, only return when currency matches (or is unset)
  IF c.discount_type = 'fixed' AND c.currency IS NOT NULL AND c.currency <> _currency THEN
    RETURN;
  END IF;

  RETURN QUERY SELECT
    c.id,
    c.code,
    c.discount_type,
    c.discount_value,
    c.max_discount_cap,
    c.min_order_value,
    'ok'::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_coupon_for_redemption(text, text, text, numeric) TO authenticated, anon;

-- 2. Restrict wedding-logos uploads to user's own folder
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;

CREATE POLICY "Users can upload logos to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'wedding-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Also restrict update/delete to own folder for consistency
DROP POLICY IF EXISTS "Users can update own logos" ON storage.objects;
CREATE POLICY "Users can update own logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'wedding-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own logos" ON storage.objects;
CREATE POLICY "Users can delete own logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'wedding-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
