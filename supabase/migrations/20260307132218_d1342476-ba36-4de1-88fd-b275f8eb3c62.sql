ALTER TABLE public.wedding_sites 
ADD COLUMN custom_domain text DEFAULT NULL,
ADD COLUMN domain_status text DEFAULT 'none' CHECK (domain_status IN ('none', 'pending', 'verified', 'live', 'failed'));