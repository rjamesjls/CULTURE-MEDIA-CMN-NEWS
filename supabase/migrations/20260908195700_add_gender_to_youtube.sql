ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
ALTER TABLE public.youtube_channels ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
