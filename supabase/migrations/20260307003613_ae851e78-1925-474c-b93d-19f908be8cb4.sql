
-- Wedding checklist items table
CREATE TABLE public.wedding_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_site_id uuid NOT NULL REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  due_date date,
  is_completed boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wedding_checklist ENABLE ROW LEVEL SECURITY;

-- Only site owners can manage their checklist
CREATE POLICY "Site owners can read checklist"
  ON public.wedding_checklist FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.wedding_sites
    WHERE wedding_sites.id = wedding_checklist.wedding_site_id
      AND wedding_sites.user_id = auth.uid()
  ));

CREATE POLICY "Site owners can insert checklist items"
  ON public.wedding_checklist FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.wedding_sites
    WHERE wedding_sites.id = wedding_checklist.wedding_site_id
      AND wedding_sites.user_id = auth.uid()
  ));

CREATE POLICY "Site owners can update checklist items"
  ON public.wedding_checklist FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.wedding_sites
    WHERE wedding_sites.id = wedding_checklist.wedding_site_id
      AND wedding_sites.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.wedding_sites
    WHERE wedding_sites.id = wedding_checklist.wedding_site_id
      AND wedding_sites.user_id = auth.uid()
  ));

CREATE POLICY "Site owners can delete checklist items"
  ON public.wedding_checklist FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.wedding_sites
    WHERE wedding_sites.id = wedding_checklist.wedding_site_id
      AND wedding_sites.user_id = auth.uid()
  ));
