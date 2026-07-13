CREATE TABLE public.guest_moderation_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wedding_site_id UUID NOT NULL REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approved','hidden','deleted')),
  subject TEXT,
  body_html TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wedding_site_id, action)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_moderation_templates TO authenticated;
GRANT ALL ON public.guest_moderation_templates TO service_role;

ALTER TABLE public.guest_moderation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners manage moderation templates"
  ON public.guest_moderation_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.wedding_sites ws WHERE ws.id = wedding_site_id AND ws.user_id = auth.uid())
    OR public.is_admin(auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.wedding_sites ws WHERE ws.id = wedding_site_id AND ws.user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE TRIGGER guest_moderation_templates_updated_at
  BEFORE UPDATE ON public.guest_moderation_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();