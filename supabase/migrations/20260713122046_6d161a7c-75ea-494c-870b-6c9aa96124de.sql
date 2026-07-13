CREATE TABLE public.guest_notification_prefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wedding_site_id UUID REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX guest_notification_prefs_account_uniq
  ON public.guest_notification_prefs (user_id)
  WHERE wedding_site_id IS NULL;

CREATE UNIQUE INDEX guest_notification_prefs_site_uniq
  ON public.guest_notification_prefs (user_id, wedding_site_id)
  WHERE wedding_site_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_notification_prefs TO authenticated;
GRANT ALL ON public.guest_notification_prefs TO service_role;

ALTER TABLE public.guest_notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own guest notification prefs"
  ON public.guest_notification_prefs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER guest_notification_prefs_updated_at
  BEFORE UPDATE ON public.guest_notification_prefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();