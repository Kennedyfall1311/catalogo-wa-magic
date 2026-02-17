
CREATE TABLE public.sellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  whatsapp TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sellers" ON public.sellers FOR SELECT USING (true);
CREATE POLICY "Admins can manage sellers" ON public.sellers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add seller_id to orders
ALTER TABLE public.orders ADD COLUMN seller_id UUID REFERENCES public.sellers(id);
ALTER TABLE public.orders ADD COLUMN seller_name TEXT;
