
CREATE TABLE public.r2_cleanup_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  dry_run BOOLEAN NOT NULL DEFAULT false,
  users_scanned INTEGER NOT NULL DEFAULT 0,
  total_deleted INTEGER NOT NULL DEFAULT 0,
  total_freed_bytes BIGINT NOT NULL DEFAULT 0,
  per_user JSONB NOT NULL DEFAULT '[]'::jsonb,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.r2_cleanup_runs TO authenticated;
GRANT ALL ON public.r2_cleanup_runs TO service_role;

ALTER TABLE public.r2_cleanup_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view cleanup runs"
  ON public.r2_cleanup_runs
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role manages cleanup runs"
  ON public.r2_cleanup_runs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_r2_cleanup_runs_started_at ON public.r2_cleanup_runs (started_at DESC);
