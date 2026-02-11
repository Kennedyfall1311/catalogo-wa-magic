
-- Table for custom catalog tabs (Pro mode)
CREATE TABLE public.catalog_tabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  filter_type TEXT NOT NULL DEFAULT 'all', -- 'all', 'category', 'promotion', 'featured', 'custom'
  filter_value TEXT, -- category_id for 'category' type, null for others
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  icon TEXT, -- optional icon name
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.catalog_tabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tabs" ON public.catalog_tabs FOR SELECT USING (true);
CREATE POLICY "Admins can insert tabs" ON public.catalog_tabs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update tabs" ON public.catalog_tabs FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete tabs" ON public.catalog_tabs FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default tabs
INSERT INTO public.catalog_tabs (name, filter_type, sort_order, icon) VALUES
  ('Todos', 'all', 0, 'LayoutGrid'),
  ('Promoções', 'promotion', 1, 'Tag'),
  ('Destaques', 'featured', 2, 'Star');
