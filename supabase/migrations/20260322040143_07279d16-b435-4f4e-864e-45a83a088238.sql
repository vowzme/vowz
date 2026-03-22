
-- Add status column to wedding_sites for pause/delete functionality
ALTER TABLE public.wedding_sites ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Create feature_requests table
CREATE TABLE public.feature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  screenshot_url text,
  status text NOT NULL DEFAULT 'new',
  admin_reply text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feature requests
CREATE POLICY "Users can insert own feature requests"
ON public.feature_requests FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can view their own feature requests
CREATE POLICY "Users can view own feature requests"
ON public.feature_requests FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admins can manage all feature requests
CREATE POLICY "Admins can manage feature requests"
ON public.feature_requests FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
