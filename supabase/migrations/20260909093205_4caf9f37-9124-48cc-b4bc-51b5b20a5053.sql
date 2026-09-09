CREATE TABLE public.wedding_report_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  visitor_id text,
  couple_name text,
  email text,
  phone text,
  wedding_date date,
  city text,
  guest_count integer,
  budget numeric,
  currency text NOT NULL DEFAULT 'INR',
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  report jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.wedding_report_leads TO anon;
GRANT INSERT, SELECT ON public.wedding_report_leads TO authenticated;
GRANT ALL ON public.wedding_report_leads TO service_role;

ALTER TABLE public.wedding_report_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a wedding report"
ON public.wedding_report_leads FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can read wedding report leads"
ON public.wedding_report_leads FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE INDEX idx_wedding_report_leads_created_at ON public.wedding_report_leads (created_at DESC);