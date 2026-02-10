
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
  slug TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '/placeholder.svg',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Store settings table
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT ''
);
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Insert default settings
INSERT INTO public.store_settings (key, value) VALUES
  ('whatsapp_number', '5511999999999'),
  ('store_name', 'Catálogo'),
  ('store_subtitle', 'Distribuidora');

-- Insert default categories
INSERT INTO public.categories (name, slug) VALUES
  ('Roupas', 'roupas'),
  ('Calçados', 'calcados'),
  ('Acessórios', 'acessorios'),
  ('Promoções', 'promocoes');

-- RLS Policies

-- user_roles: only admins can manage
CREATE POLICY "Admins can view roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- categories: public read, admin write
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update categories" ON public.categories
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete categories" ON public.categories
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- products: public read, admin write
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- store_settings: public read, admin write
CREATE POLICY "Anyone can view settings" ON public.store_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON public.store_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update product images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
