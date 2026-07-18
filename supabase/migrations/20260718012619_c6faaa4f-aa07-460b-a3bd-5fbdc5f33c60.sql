
CREATE TABLE public.feature_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wedding_site_id uuid NOT NULL REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  feature_type text NOT NULL,
  action text NOT NULL CHECK (action IN ('enabled','disabled','updated')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feature_audit_log_site ON public.feature_audit_log(wedding_site_id, created_at DESC);

GRANT SELECT, INSERT ON public.feature_audit_log TO authenticated;
GRANT ALL ON public.feature_audit_log TO service_role;

ALTER TABLE public.feature_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin can view audit log"
  ON public.feature_audit_log FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.wedding_sites ws
      WHERE ws.id = feature_audit_log.wedding_site_id
        AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can insert audit entries"
  ON public.feature_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.wedding_sites ws
      WHERE ws.id = feature_audit_log.wedding_site_id
        AND ws.user_id = auth.uid()
    )
  );
