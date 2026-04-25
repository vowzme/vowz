
-- 1) Move site_password into a separate, owner-only table to prevent public exposure
CREATE TABLE IF NOT EXISTS public.wedding_site_passwords (
  wedding_site_id uuid PRIMARY KEY REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  password text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wedding_site_passwords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can manage password"
  ON public.wedding_site_passwords
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.wedding_sites ws WHERE ws.id = wedding_site_id AND ws.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.wedding_sites ws WHERE ws.id = wedding_site_id AND ws.user_id = auth.uid()));

CREATE POLICY "Admins can manage all passwords"
  ON public.wedding_site_passwords
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Migrate existing passwords
INSERT INTO public.wedding_site_passwords (wedding_site_id, password)
SELECT id, site_password FROM public.wedding_sites
WHERE site_password IS NOT NULL AND site_password <> ''
ON CONFLICT (wedding_site_id) DO NOTHING;

-- Drop the column from wedding_sites so it cannot leak via the public SELECT policy
ALTER TABLE public.wedding_sites DROP COLUMN IF EXISTS site_password;

-- Helper: returns whether a published site is password-protected (no leakage of value)
CREATE OR REPLACE FUNCTION public.site_has_password(_site_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.wedding_site_passwords wsp
    JOIN public.wedding_sites ws ON ws.id = wsp.wedding_site_id
    WHERE wsp.wedding_site_id = _site_id
      AND ws.is_published = true
      AND wsp.password IS NOT NULL
      AND wsp.password <> ''
  );
$$;

-- Helper: verify a guest-supplied password for a published site
CREATE OR REPLACE FUNCTION public.verify_site_password(_site_id uuid, _password text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.wedding_site_passwords wsp
    JOIN public.wedding_sites ws ON ws.id = wsp.wedding_site_id
    WHERE wsp.wedding_site_id = _site_id
      AND ws.is_published = true
      AND wsp.password = _password
  );
$$;

GRANT EXECUTE ON FUNCTION public.site_has_password(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_site_password(uuid, text) TO anon, authenticated;

-- 2) Restrict affiliate public lookup to a safe view (no PII)
DROP POLICY IF EXISTS "Anyone can lookup affiliate by code" ON public.affiliates;

CREATE OR REPLACE VIEW public.affiliate_public_lookup
WITH (security_invoker = true) AS
SELECT id, referral_code, custom_coupon, is_active, is_franchise, franchise_id
FROM public.affiliates
WHERE is_active = true;

GRANT SELECT ON public.affiliate_public_lookup TO anon, authenticated;

-- Provide a SECURITY DEFINER lookup that only returns non-PII columns
CREATE OR REPLACE FUNCTION public.lookup_affiliate_by_code(_code text)
RETURNS TABLE (
  id uuid,
  referral_code text,
  custom_coupon text,
  is_active boolean,
  is_franchise boolean,
  franchise_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, referral_code, custom_coupon, is_active, is_franchise, franchise_id
  FROM public.affiliates
  WHERE is_active = true
    AND (referral_code = _code OR custom_coupon = _code);
$$;

GRANT EXECUTE ON FUNCTION public.lookup_affiliate_by_code(text) TO anon, authenticated;

-- 3) Restrict blessing-photos uploads to authenticated users only, scoped to their own folder
DROP POLICY IF EXISTS "Anyone can upload blessing photos" ON storage.objects;

CREATE POLICY "Authenticated can upload blessing photos to own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'blessing-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4) Restrict listing of public buckets (no broad SELECT). Keep public READ access, but require knowing the path.
-- Drop overly broad listing policies if they exist; allow direct object reads via public bucket URL still works without a policy.
DO $$
DECLARE p text;
BEGIN
  FOR p IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND polcmd = 'r'
      AND polname IN (
        'Public read access for wedding-photos',
        'Public read access for wedding-logos',
        'Public read access for email-assets',
        'Public read access for blessing-photos',
        'Public Access',
        'Anyone can view wedding photos',
        'Anyone can view blessing photos',
        'Anyone can view wedding logos',
        'Anyone can view email assets'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p);
  END LOOP;
END $$;

-- Re-add tighter policies that allow reads only with a known full path (no directory listing without owner auth)
-- Owners can list their own folders; anonymous can read individual objects only via public URL (which uses bucket-public flag, no SELECT policy needed).
CREATE POLICY "Owners can list own files in wedding-photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'wedding-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners can list own files in wedding-logos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'wedding-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners can list own files in blessing-photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'blessing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 5) Set immutable search_path on functions that lack it
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;

-- 6) Remove rsvps from realtime publication to prevent guest PII broadcast
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rsvps'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.rsvps';
  END IF;
END $$;
