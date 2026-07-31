ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS facebook_post_id TEXT,
ADD COLUMN IF NOT EXISTS instagram_post_id TEXT;
