
-- Add unique index on slug (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS wedding_sites_slug_unique ON public.wedding_sites (slug) WHERE slug IS NOT NULL;

-- RPC to check slug availability
CREATE OR REPLACE FUNCTION public.check_slug_available(_slug text, _exclude_site_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.wedding_sites
    WHERE slug = _slug
      AND (_exclude_site_id IS NULL OR id != _exclude_site_id)
  )
$$;
