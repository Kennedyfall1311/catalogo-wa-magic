-- Add unique constraint on store_settings.key for upsert support
ALTER TABLE public.store_settings ADD CONSTRAINT store_settings_key_unique UNIQUE (key);