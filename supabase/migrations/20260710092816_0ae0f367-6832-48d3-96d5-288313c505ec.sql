
CREATE TABLE public.email_branding (
  id INTEGER PRIMARY KEY DEFAULT 1,
  logo_url TEXT NOT NULL DEFAULT 'https://qkjuywqrncsbxjzwtlzm.supabase.co/storage/v1/object/public/email-assets/vowz-logo.png',
  primary_color TEXT NOT NULL DEFAULT '#001F3F',
  accent_color TEXT NOT NULL DEFAULT '#B8943E',
  button_text_color TEXT NOT NULL DEFAULT '#F5F0E8',
  from_name TEXT NOT NULL DEFAULT 'vowz',
  footer_text TEXT NOT NULL DEFAULT 'Sent with love via VowZ · beautiful wedding websites.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT email_branding_singleton CHECK (id = 1)
);

GRANT SELECT ON public.email_branding TO authenticated, anon;
GRANT ALL ON public.email_branding TO service_role;

ALTER TABLE public.email_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read email branding"
  ON public.email_branding FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert email branding"
  ON public.email_branding FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update email branding"
  ON public.email_branding FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_email_branding_updated_at
  BEFORE UPDATE ON public.email_branding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.email_branding (id) VALUES (1) ON CONFLICT DO NOTHING;
