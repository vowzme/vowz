ALTER TABLE public.affiliate_qr_codes
  ADD COLUMN IF NOT EXISTS signup_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS site_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.qr_attributions (
  user_id uuid PRIMARY KEY,
  qr_code text NOT NULL,
  site_created boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.qr_attributions TO authenticated;
GRANT ALL ON public.qr_attributions TO service_role;
ALTER TABLE public.qr_attributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view QR attributions" ON public.qr_attributions
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Called by the browser right after sign-in when the visitor arrived via a printed QR.
CREATE OR REPLACE FUNCTION public.record_qr_signup(_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _created timestamptz;
BEGIN
  IF _uid IS NULL OR _code IS NULL THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.affiliate_qr_codes WHERE code = upper(_code)) THEN RETURN false; END IF;
  SELECT created_at INTO _created FROM public.profiles WHERE id = _uid;
  -- Only new accounts count as QR sign-ups.
  IF _created IS NULL OR _created < now() - interval '1 day' THEN RETURN false; END IF;
  INSERT INTO public.qr_attributions (user_id, qr_code) VALUES (_uid, upper(_code))
    ON CONFLICT (user_id) DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.affiliate_qr_codes SET signup_count = signup_count + 1 WHERE code = upper(_code);
  -- Account may already have a site (rare): count it now.
  IF EXISTS (SELECT 1 FROM public.wedding_sites WHERE user_id = _uid) THEN
    UPDATE public.qr_attributions SET site_created = true WHERE user_id = _uid;
    UPDATE public.affiliate_qr_codes SET site_count = site_count + 1 WHERE code = upper(_code);
  END IF;
  RETURN true;
END $$;
GRANT EXECUTE ON FUNCTION public.record_qr_signup(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.qr_count_site_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _code text;
BEGIN
  UPDATE public.qr_attributions SET site_created = true
   WHERE user_id = NEW.user_id AND site_created = false
   RETURNING qr_code INTO _code;
  IF _code IS NOT NULL THEN
    UPDATE public.affiliate_qr_codes SET site_count = site_count + 1 WHERE code = _code;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_qr_count_site_created AFTER INSERT ON public.wedding_sites
  FOR EACH ROW EXECUTE FUNCTION public.qr_count_site_created();