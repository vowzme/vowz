
-- Table to track AI edge function invocations
CREATE TABLE public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  user_id uuid,
  model text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  status text NOT NULL DEFAULT 'success',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient admin queries
CREATE INDEX idx_ai_usage_log_created_at ON public.ai_usage_log (created_at DESC);
CREATE INDEX idx_ai_usage_log_function ON public.ai_usage_log (function_name);

-- Enable RLS
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can read usage logs"
ON public.ai_usage_log FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- Service role can insert (edge functions use service role)
CREATE POLICY "Service role can insert usage logs"
ON public.ai_usage_log FOR INSERT TO public
WITH CHECK (auth.role() = 'service_role');
