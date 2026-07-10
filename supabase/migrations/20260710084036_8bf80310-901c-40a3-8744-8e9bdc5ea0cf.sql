
GRANT SELECT ON public.email_send_log TO authenticated;
GRANT SELECT ON public.suppressed_emails TO authenticated;

DO $$ BEGIN
  CREATE POLICY "Admins can read send log"
    ON public.email_send_log FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can read suppressed emails"
    ON public.suppressed_emails FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
