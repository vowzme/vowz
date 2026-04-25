
-- 1) Lock down email-assets bucket (public read, but writes restricted to admins/service role)
CREATE POLICY "Admins can upload email assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'email-assets' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update email assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'email-assets' AND public.is_admin(auth.uid()))
WITH CHECK (bucket_id = 'email-assets' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete email assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'email-assets' AND public.is_admin(auth.uid()));

-- 2) Hash family-member access tokens.
-- Switch storage from plaintext to a SHA-256 hex digest.
ALTER TABLE public.wedding_family_members
  ADD COLUMN IF NOT EXISTS access_token_hash text;

-- Backfill: hash any existing plaintext tokens, then drop the plaintext column.
UPDATE public.wedding_family_members
SET access_token_hash = encode(extensions.digest(access_token, 'sha256'), 'hex')
WHERE access_token IS NOT NULL AND access_token_hash IS NULL;

ALTER TABLE public.wedding_family_members
  DROP COLUMN IF EXISTS access_token;

-- Helper: generate a fresh token (returns plaintext to caller, stores only hash).
CREATE OR REPLACE FUNCTION public.create_family_member_token(_member_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plain text;
  _site_owner uuid;
BEGIN
  -- Only the site owner (or admin) for this member may create tokens.
  SELECT ws.user_id INTO _site_owner
  FROM public.wedding_family_members wfm
  JOIN public.wedding_sites ws ON ws.id = wfm.wedding_site_id
  WHERE wfm.id = _member_id;

  IF _site_owner IS NULL THEN
    RAISE EXCEPTION 'Family member not found';
  END IF;

  IF _site_owner <> auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  _plain := encode(extensions.gen_random_bytes(32), 'hex');

  UPDATE public.wedding_family_members
  SET access_token_hash = encode(extensions.digest(_plain, 'sha256'), 'hex')
  WHERE id = _member_id;

  RETURN _plain;
END;
$$;

-- Verifier: returns the family member id if the supplied token matches a stored hash.
CREATE OR REPLACE FUNCTION public.verify_family_member_token(_token text)
RETURNS TABLE(member_id uuid, wedding_site_id uuid, can_edit boolean, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, wedding_site_id, can_edit, role
  FROM public.wedding_family_members
  WHERE access_token_hash = encode(extensions.digest(_token, 'sha256'), 'hex');
$$;

-- 3) Harden anonymous blessings: ensure photo_url, when supplied, points only at our own
-- blessing-photos bucket and not arbitrary external URLs.
DROP POLICY IF EXISTS "Anyone can post blessings to published site" ON public.guest_blessings;

CREATE POLICY "Anyone can post blessings to published site"
ON public.guest_blessings FOR INSERT TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.wedding_sites
    WHERE wedding_sites.id = guest_blessings.wedding_site_id
      AND wedding_sites.is_published = true
  )
  AND (
    photo_url IS NULL
    OR photo_url LIKE 'https://%/storage/v1/object/public/blessing-photos/%'
  )
);
