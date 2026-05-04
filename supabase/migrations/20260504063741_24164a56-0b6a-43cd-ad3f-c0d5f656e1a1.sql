
-- 1) Affiliate referrals: allow affiliates to read their own referral rows
CREATE POLICY "Affiliates can view own referrals"
ON public.affiliate_referrals
FOR SELECT
TO authenticated
USING (
  affiliate_id IN (
    SELECT id FROM public.affiliates WHERE user_id = auth.uid()
  )
);

-- 2) Blessing photos: replace UID-scoped upload policy with site-scoped policy
DROP POLICY IF EXISTS "Authenticated can upload blessing photos to own folder" ON storage.objects;

CREATE POLICY "Anyone can upload blessing photos to published site folder"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'blessing-photos'
  AND EXISTS (
    SELECT 1 FROM public.wedding_sites ws
    WHERE ws.id::text = (storage.foldername(name))[1]
      AND ws.is_published = true
  )
);

-- Update SELECT policy on blessing-photos to be site-scoped (public bucket already serves files,
-- but we tighten the listing policy too)
DROP POLICY IF EXISTS "Owners can list own files in blessing-photos" ON storage.objects;

CREATE POLICY "Site owners can list blessing photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'blessing-photos'
  AND (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.wedding_sites ws
      WHERE ws.user_id = auth.uid()
        AND ws.id::text = (storage.foldername(name))[1]
    )
  )
);
