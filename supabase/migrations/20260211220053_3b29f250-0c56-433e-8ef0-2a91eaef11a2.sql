
-- Add featured fields to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured_order integer NOT NULL DEFAULT 0;

-- Index for efficient featured queries
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products (featured, featured_order) WHERE featured = true;
