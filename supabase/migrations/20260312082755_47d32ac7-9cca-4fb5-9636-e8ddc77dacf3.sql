
ALTER TABLE public.wedding_sites
  ADD COLUMN IF NOT EXISTS site_password text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS translations jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS site_language text DEFAULT 'en';
