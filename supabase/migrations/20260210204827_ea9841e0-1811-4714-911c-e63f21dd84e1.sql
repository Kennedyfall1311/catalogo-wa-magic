
-- Table for payment conditions
CREATE TABLE public.payment_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active payment conditions"
ON public.payment_conditions FOR SELECT USING (true);

CREATE POLICY "Admins can insert payment conditions"
ON public.payment_conditions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payment conditions"
ON public.payment_conditions FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete payment conditions"
ON public.payment_conditions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add the toggle setting
INSERT INTO public.store_settings (key, value)
VALUES ('payment_conditions_enabled', 'false')
ON CONFLICT DO NOTHING;
