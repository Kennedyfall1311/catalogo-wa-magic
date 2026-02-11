-- Add columns for custom quick filter selections
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS quick_filter_1 boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS quick_filter_2 boolean NOT NULL DEFAULT false;