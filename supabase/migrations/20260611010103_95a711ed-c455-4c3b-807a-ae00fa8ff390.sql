CREATE TABLE public.r2_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  sha256 TEXT,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  content_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_r2_files_user_sha ON public.r2_files(user_id, sha256);
CREATE INDEX idx_r2_files_user ON public.r2_files(user_id);

GRANT SELECT ON public.r2_files TO authenticated;
GRANT ALL ON public.r2_files TO service_role;

ALTER TABLE public.r2_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own files"
ON public.r2_files FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all files"
ON public.r2_files FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));