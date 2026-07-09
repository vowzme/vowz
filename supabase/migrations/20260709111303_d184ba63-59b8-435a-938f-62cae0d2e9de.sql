ALTER TABLE public.wedding_sites
  DROP COLUMN IF EXISTS custom_domain,
  DROP COLUMN IF EXISTS domain_status;