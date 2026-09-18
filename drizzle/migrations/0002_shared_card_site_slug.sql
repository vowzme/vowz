DROP FUNCTION IF EXISTS public.get_shared_card(uuid);
CREATE FUNCTION public.get_shared_card(_token uuid)
RETURNS TABLE(id uuid, name text, template_slug text, data jsonb, theme_overrides jsonb, pages jsonb, photo_url text, reveal text, site_slug text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT v.id, v.name, v.template_slug, v.data, v.theme_overrides, v.pages, v.photo_url, v.reveal, s.slug
  FROM public.invitation_card_variants v
  LEFT JOIN public.wedding_sites s ON s.id = v.wedding_site_id
  WHERE v.share_token = _token AND v.share_enabled = true;
$$;
GRANT EXECUTE ON FUNCTION public.get_shared_card(uuid) TO anon, authenticated;