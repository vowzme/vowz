CREATE TABLE public.billing_terms (
  id integer PRIMARY KEY DEFAULT 1,
  premium_months integer NOT NULL DEFAULT 6 CHECK (premium_months BETWEEN 1 AND 60),
  storage_months integer NOT NULL DEFAULT 6 CHECK (storage_months BETWEEN 1 AND 60),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT billing_terms_singleton CHECK (id = 1)
);

GRANT SELECT ON public.billing_terms TO authenticated;
GRANT ALL ON public.billing_terms TO service_role;

ALTER TABLE public.billing_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read billing terms"
  ON public.billing_terms FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert billing terms"
  ON public.billing_terms FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update billing terms"
  ON public.billing_terms FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.billing_terms (id, premium_months, storage_months)
VALUES (1, 6, 6)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_billing_terms()
RETURNS TABLE(premium_months integer, storage_months integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT premium_months, storage_months
  FROM public.billing_terms
  WHERE id = 1
$$;

GRANT EXECUTE ON FUNCTION public.get_billing_terms() TO anon, authenticated, service_role;