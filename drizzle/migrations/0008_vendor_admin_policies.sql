CREATE POLICY "Admins read all vendors" ON public.vendors
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins update vendors" ON public.vendors
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete vendors" ON public.vendors
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins read vendor enquiries" ON public.vendor_enquiries
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));