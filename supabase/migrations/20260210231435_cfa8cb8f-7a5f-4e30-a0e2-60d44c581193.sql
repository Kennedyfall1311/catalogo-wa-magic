
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  link TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Banners are publicly readable"
  ON public.banners FOR SELECT USING (true);

CREATE POLICY "Admins can manage banners"
  ON public.banners FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));
