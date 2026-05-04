-- Restrict anonymous public reads of wedding_sites.user_id to prevent UUID enumeration
REVOKE SELECT ON public.wedding_sites FROM anon;
GRANT SELECT (
  id, partner1, partner2, cultural_background, how_we_met, theme, tagline,
  suggested_colors, sections, is_published, slug, created_at, updated_at,
  logo_url, custom_domain, domain_status, translations, site_language, status
) ON public.wedding_sites TO anon;