-- Add is_special_edition column to articles table
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS is_special_edition BOOLEAN DEFAULT false;
