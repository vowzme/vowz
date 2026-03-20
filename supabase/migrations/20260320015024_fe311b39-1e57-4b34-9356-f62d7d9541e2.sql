ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS payout_upi text DEFAULT NULL;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS payout_paypal text DEFAULT NULL;