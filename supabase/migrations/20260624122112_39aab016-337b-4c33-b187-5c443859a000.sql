
CREATE TABLE public.card_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hindu_sikh','christian_muslim','modern_minimal','royal_traditional')),
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 100,
  thumbnail_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.card_templates TO anon, authenticated;
GRANT ALL ON public.card_templates TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.card_templates TO authenticated;

ALTER TABLE public.card_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view enabled card templates"
  ON public.card_templates FOR SELECT
  USING (is_enabled = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage card templates"
  ON public.card_templates FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER card_templates_updated_at
  BEFORE UPDATE ON public.card_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.card_templates (slug, name, category, is_premium, sort_order, description) VALUES
  ('hindu-ganesha-classic', 'Ganesha Classic', 'hindu_sikh', false, 10, 'Maroon & gold with Ganesha motif and mandala border'),
  ('hindu-royal-mandala', 'Royal Mandala', 'hindu_sikh', true, 20, 'Deep red palette with gold mandala and Sanskrit accents'),
  ('christian-floral-cross', 'Floral Cross', 'christian_muslim', false, 30, 'Ivory & blush with delicate floral cross emblem'),
  ('muslim-emerald-arch', 'Emerald Arch', 'christian_muslim', true, 40, 'Islamic geometric arch in emerald and gold'),
  ('modern-typographic', 'Modern Typographic', 'modern_minimal', false, 50, 'Editorial typography on cream with subtle rule lines'),
  ('modern-noir', 'Noir Minimal', 'modern_minimal', true, 60, 'Charcoal palette with serif display and gold accents'),
  ('royal-peacock', 'Royal Peacock', 'royal_traditional', true, 70, 'Maroon & gold with peacock crown and ornate borders'),
  ('royal-velvet', 'Velvet Damask', 'royal_traditional', true, 80, 'Wine velvet background with damask gold ornaments');
