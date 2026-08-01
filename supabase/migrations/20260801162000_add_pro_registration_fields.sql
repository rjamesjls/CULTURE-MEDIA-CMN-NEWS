ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS contact_first_name TEXT,
ADD COLUMN IF NOT EXISTS contact_last_name TEXT,
ADD COLUMN IF NOT EXISTS contact_role TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT;

-- Recharge le cache du schéma pour l'API Supabase
NOTIFY pgrst, 'reload schema';
