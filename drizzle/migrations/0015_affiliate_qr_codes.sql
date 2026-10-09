CREATE TABLE public.affiliate_qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  design text NOT NULL DEFAULT 'qr-only',
  batch_label text,
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
  assigned_at timestamptz,
  assigned_by uuid,
  scan_count integer NOT NULL DEFAULT 0,
  last_scanned_at timestamptz,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX affiliate_qr_codes_affiliate_idx ON public.affiliate_qr_codes(affiliate_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_qr_codes TO authenticated;
GRANT ALL ON public.affiliate_qr_codes TO service_role;
ALTER TABLE public.affiliate_qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage QR codes" ON public.affiliate_qr_codes FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Affiliates see their QR codes" ON public.affiliate_qr_codes FOR SELECT TO authenticated
  USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.resolve_affiliate_qr(_code text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ref text;
BEGIN
  UPDATE public.affiliate_qr_codes q SET scan_count = scan_count + 1, last_scanned_at = now()
  WHERE q.code = upper(_code);
  SELECT a.referral_code INTO _ref FROM public.affiliate_qr_codes q
    JOIN public.affiliates a ON a.id = q.affiliate_id
  WHERE q.code = upper(_code) AND a.is_active = true;
  RETURN _ref;
END $$;
GRANT EXECUTE ON FUNCTION public.resolve_affiliate_qr(text) TO anon, authenticated;