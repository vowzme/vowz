CREATE POLICY "Admins can view all luxe unlocks" ON public.user_luxe_unlocks FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can grant luxe unlocks" ON public.user_luxe_unlocks FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update luxe unlocks" ON public.user_luxe_unlocks FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete luxe unlocks" ON public.user_luxe_unlocks FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_luxe_unlocks TO authenticated;
GRANT ALL ON public.user_luxe_unlocks TO service_role;