INSERT INTO public.card_templates (slug, name, category, is_premium, is_enabled, sort_order, description) VALUES
  ('amora-burgundy-editorial', 'Amora Burgundy', 'modern_minimal', true, true, 610, 'Cream paper with burgundy editorial chapter headings'),
  ('amora-noir-script', 'Amora Noir', 'modern_minimal', true, true, 611, 'Cinematic black stage with glowing gold script monogram'),
  ('amora-blush-cinema', 'Amora Blush', 'modern_minimal', true, true, 612, 'Warm cream with rose-pink script names, cinematic hero'),
  ('amora-navy-together', 'Amora Together', 'modern_minimal', true, true, 613, 'Warm cream with navy script and coral diamond accent'),
  ('amora-parchment-chapter', 'Amora Parchment', 'modern_minimal', true, true, 614, 'Old-book parchment with Roman chapter numerals'),
  ('amora-plum-luxe', 'Amora Plum', 'royal_traditional', true, true, 615, 'Deep plum velvet with soft-gold script names'),
  ('amora-ivory-hero', 'Amora Ivory', 'modern_minimal', true, true, 616, 'All-ivory with italic accent word and hairline rules'),
  ('amora-forest-cinema', 'Amora Forest', 'royal_traditional', true, true, 617, 'Deep forest with gold script and cinematic arch')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  is_premium = EXCLUDED.is_premium,
  is_enabled = EXCLUDED.is_enabled,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  updated_at = now();