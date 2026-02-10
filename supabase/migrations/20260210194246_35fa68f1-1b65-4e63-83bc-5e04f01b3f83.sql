CREATE POLICY "Admins can insert settings" ON public.store_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete settings" ON public.store_settings
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));