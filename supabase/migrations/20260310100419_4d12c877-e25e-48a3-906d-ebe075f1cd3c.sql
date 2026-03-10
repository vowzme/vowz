
-- Admin emails whitelist table
CREATE TABLE public.admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_emails ae
    JOIN auth.users u ON u.email = ae.email
    WHERE u.id = _user_id
  )
$$;

-- Admin can read the whitelist
CREATE POLICY "Admins can read admin_emails"
ON public.admin_emails
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admin can manage the whitelist
CREATE POLICY "Admins can manage admin_emails"
ON public.admin_emails
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Payment gateway configuration table
CREATE TABLE public.payment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage payment config
CREATE POLICY "Admins can read payment_config"
ON public.payment_config
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage payment_config"
ON public.payment_config
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Seed default payment providers
INSERT INTO public.payment_config (provider, is_enabled, config) VALUES
  ('razorpay', false, '{"key_id": "", "key_secret": ""}'::jsonb),
  ('phonepe', false, '{"merchant_id": "", "salt_key": "", "salt_index": ""}'::jsonb),
  ('paypal', false, '{"client_id": "", "client_secret": "", "mode": "sandbox"}'::jsonb);

-- Add RLS policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add RLS policy for admins to view all wedding_sites
CREATE POLICY "Admins can view all sites"
ON public.wedding_sites
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add RLS policy for admins to view all rsvps
CREATE POLICY "Admins can view all rsvps"
ON public.rsvps
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
