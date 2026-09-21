-- 1. Guest groups & tags
ALTER TABLE public.guest_invites
  ADD COLUMN IF NOT EXISTS guest_group text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- 2. Seating charts (one row per site, JSON layout)
CREATE TABLE IF NOT EXISTS public.seating_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_site_id uuid NOT NULL REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{"tables":[]}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wedding_site_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.seating_charts TO authenticated;
GRANT SELECT ON public.seating_charts TO anon;
GRANT ALL ON public.seating_charts TO service_role;

ALTER TABLE public.seating_charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their seating chart"
  ON public.seating_charts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.wedding_sites w WHERE w.id = wedding_site_id AND w.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.wedding_sites w WHERE w.id = wedding_site_id AND w.user_id = auth.uid()));

CREATE POLICY "Public can read published seating charts"
  ON public.seating_charts FOR SELECT TO anon, authenticated
  USING (is_public = true AND EXISTS (SELECT 1 FROM public.wedding_sites w WHERE w.id = wedding_site_id AND w.is_published = true));

-- 3. Vendor marketplace
CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  business_name text NOT NULL,
  category text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  about text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'India',
  service_areas text[] NOT NULL DEFAULT '{}',
  phone text,
  whatsapp text,
  email text,
  website text,
  instagram text,
  logo_url text,
  cover_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  hours text NOT NULL DEFAULT '',
  price_from numeric,
  currency text NOT NULL DEFAULT 'INR',
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  is_featured boolean NOT NULL DEFAULT false,
  rating numeric NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendors_category_idx ON public.vendors (category);
CREATE INDEX IF NOT EXISTS vendors_city_idx ON public.vendors (lower(city));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT SELECT ON public.vendors TO anon;
GRANT ALL ON public.vendors TO service_role;

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved vendors"
  ON public.vendors FOR SELECT TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Vendors view their own profile"
  ON public.vendors FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Vendors create their own profile"
  ON public.vendors FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Vendors update their own profile"
  ON public.vendors FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Vendors delete their own profile"
  ON public.vendors FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.vendor_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  event_date date,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_enquiries TO authenticated;
GRANT INSERT ON public.vendor_enquiries TO anon;
GRANT ALL ON public.vendor_enquiries TO service_role;

ALTER TABLE public.vendor_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send an enquiry to an approved vendor"
  ON public.vendor_enquiries FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(name) BETWEEN 1 AND 120
    AND length(message) <= 2000
    AND (email IS NULL OR length(email) <= 200)
    AND (phone IS NULL OR length(phone) <= 40)
    AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.status = 'approved')
  );

CREATE POLICY "Vendors read their enquiries"
  ON public.vendor_enquiries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND (v.user_id = auth.uid() OR public.is_admin(auth.uid()))));

CREATE POLICY "Vendors update their enquiries"
  ON public.vendor_enquiries FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND (v.user_id = auth.uid() OR public.is_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND (v.user_id = auth.uid() OR public.is_admin(auth.uid()))));

CREATE TABLE IF NOT EXISTS public.vendor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_reviews TO authenticated;
GRANT SELECT ON public.vendor_reviews TO anon;
GRANT ALL ON public.vendor_reviews TO service_role;

ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews of approved vendors"
  ON public.vendor_reviews FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.status = 'approved'));

CREATE POLICY "Signed in couples write their own review"
  ON public.vendor_reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND length(comment) <= 2000);

CREATE POLICY "Authors update their review"
  ON public.vendor_reviews FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authors delete their review"
  ON public.vendor_reviews FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- keep vendor rating in sync
CREATE OR REPLACE FUNCTION public.refresh_vendor_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v uuid;
BEGIN
  v := COALESCE(NEW.vendor_id, OLD.vendor_id);
  UPDATE public.vendors SET
    rating = COALESCE((SELECT round(avg(rating)::numeric, 2) FROM public.vendor_reviews WHERE vendor_id = v), 0),
    review_count = (SELECT count(*) FROM public.vendor_reviews WHERE vendor_id = v)
  WHERE id = v;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS vendor_reviews_rating ON public.vendor_reviews;
CREATE TRIGGER vendor_reviews_rating
AFTER INSERT OR UPDATE OR DELETE ON public.vendor_reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_vendor_rating();