ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS partner_type text NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS shop_name text,
  ADD COLUMN IF NOT EXISTS shop_logo_url text;

ALTER TABLE public.affiliates
  DROP CONSTRAINT IF EXISTS affiliates_partner_type_check;
ALTER TABLE public.affiliates
  ADD CONSTRAINT affiliates_partner_type_check CHECK (partner_type IN ('individual','shop'));