
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  partner_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  wedding_date DATE,
  wedding_location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Wedding sites table
CREATE TABLE public.wedding_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner1 TEXT NOT NULL DEFAULT '',
  partner2 TEXT NOT NULL DEFAULT '',
  cultural_background TEXT NOT NULL DEFAULT '',
  how_we_met TEXT NOT NULL DEFAULT '',
  theme TEXT NOT NULL DEFAULT 'traditional',
  tagline TEXT NOT NULL DEFAULT '',
  suggested_colors JSONB NOT NULL DEFAULT '["#6B1D2A","#D4A853","#FFF5E6"]'::jsonb,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wedding_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sites"
  ON public.wedding_sites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sites"
  ON public.wedding_sites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sites"
  ON public.wedding_sites FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own sites"
  ON public.wedding_sites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Public can view published sites"
  ON public.wedding_sites FOR SELECT
  TO anon
  USING (is_published = true);

-- RSVPs table
CREATE TABLE public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_site_id UUID NOT NULL REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  attending BOOLEAN NOT NULL DEFAULT true,
  guest_count INTEGER NOT NULL DEFAULT 1,
  meal_preference TEXT DEFAULT 'veg',
  selected_events JSONB DEFAULT '[]'::jsonb,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

-- Site owners can view RSVPs for their sites
CREATE POLICY "Site owners can view RSVPs"
  ON public.rsvps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wedding_sites
      WHERE wedding_sites.id = rsvps.wedding_site_id
      AND wedding_sites.user_id = auth.uid()
    )
  );

-- Anyone can submit an RSVP to a published site
CREATE POLICY "Anyone can submit RSVP to published site"
  ON public.rsvps FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wedding_sites
      WHERE wedding_sites.id = rsvps.wedding_site_id
      AND wedding_sites.is_published = true
    )
  );

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_wedding_sites_updated_at
  BEFORE UPDATE ON public.wedding_sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
