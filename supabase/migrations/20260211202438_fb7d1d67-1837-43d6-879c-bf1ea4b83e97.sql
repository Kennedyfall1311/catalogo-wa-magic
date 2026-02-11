
-- Add new optional fields to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reference text DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS manufacturer_code text DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit_of_measure text DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quantity numeric DEFAULT NULL;

-- Add store settings for catalog field visibility (default hidden)
INSERT INTO public.store_settings (key, value) VALUES
  ('catalog_show_description', 'false'),
  ('catalog_show_reference', 'false'),
  ('catalog_show_manufacturer_code', 'false'),
  ('catalog_show_unit_of_measure', 'false'),
  ('catalog_show_quantity', 'false')
ON CONFLICT (key) DO NOTHING;
