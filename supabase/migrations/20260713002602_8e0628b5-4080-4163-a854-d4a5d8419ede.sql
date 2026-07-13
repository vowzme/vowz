ALTER TABLE public.wedding_sites
  ADD COLUMN IF NOT EXISTS display_font text,
  ADD COLUMN IF NOT EXISTS body_font text;