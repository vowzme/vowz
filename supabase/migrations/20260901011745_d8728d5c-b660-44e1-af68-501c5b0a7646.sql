-- Logged-out visitors hit "permission denied for function is_admin" because
-- anon-evaluated RLS predicates call is_admin(). Split policies by role.

DROP POLICY IF EXISTS "Anyone can view enabled card templates" ON public.card_templates;

CREATE POLICY "Public can view enabled card templates"
ON public.card_templates
FOR SELECT
TO anon
USING (is_enabled = true);

CREATE POLICY "Authenticated can view enabled or all if admin"
ON public.card_templates
FOR SELECT
TO authenticated
USING (is_enabled = true OR public.is_admin(auth.uid()));

-- Admin-only tables: restrict to authenticated so anon never evaluates is_admin
DROP POLICY IF EXISTS "Admins read ab events" ON public.email_ab_events;
CREATE POLICY "Admins read ab events"
ON public.email_ab_events
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins read reminder dlq" ON public.reminder_email_dlq;
CREATE POLICY "Admins read reminder dlq"
ON public.reminder_email_dlq
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Site owners read own moderation events" ON public.guest_moderation_events;
CREATE POLICY "Site owners read own moderation events"
ON public.guest_moderation_events
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.wedding_sites ws
  WHERE ws.id = guest_moderation_events.wedding_site_id
    AND (ws.user_id = auth.uid() OR public.is_admin(auth.uid()))
));

DROP POLICY IF EXISTS "Site owners insert own moderation events" ON public.guest_moderation_events;
CREATE POLICY "Site owners insert own moderation events"
ON public.guest_moderation_events
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.wedding_sites ws
  WHERE ws.id = guest_moderation_events.wedding_site_id
    AND (ws.user_id = auth.uid() OR public.is_admin(auth.uid()))
));