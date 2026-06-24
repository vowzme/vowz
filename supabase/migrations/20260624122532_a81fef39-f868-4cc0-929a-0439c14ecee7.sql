
CREATE TABLE public.invitation_card_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wedding_site_id UUID NOT NULL REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'My card',
  template_slug TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  theme_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX invitation_card_variants_site_idx ON public.invitation_card_variants(wedding_site_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitation_card_variants TO authenticated;
GRANT ALL ON public.invitation_card_variants TO service_role;

ALTER TABLE public.invitation_card_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and admins manage card variants"
  ON public.invitation_card_variants FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE TRIGGER invitation_card_variants_updated_at
  BEFORE UPDATE ON public.invitation_card_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
