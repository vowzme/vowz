ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_theme text,
  ADD COLUMN IF NOT EXISTS preferred_colors text[],
  ADD COLUMN IF NOT EXISTS preferred_display_font text,
  ADD COLUMN IF NOT EXISTS preferred_body_font text;