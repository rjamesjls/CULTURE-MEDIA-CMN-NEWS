-- Create content_creators table
CREATE TABLE IF NOT EXISTS public.content_creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(50) NOT NULL, -- 'tiktok' or 'instagram'
    username VARCHAR(255) NOT NULL,
    profile_picture_url TEXT,
    country VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(platform, username)
);

-- Create creator_stats_history table
CREATE TABLE IF NOT EXISTS public.creator_stats_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.content_creators(id) ON DELETE CASCADE,
    followers BIGINT NOT NULL DEFAULT 0,
    likes BIGINT NOT NULL DEFAULT 0,
    media_count BIGINT NOT NULL DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.content_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_stats_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_creators_public_select" ON public.content_creators;
CREATE POLICY "content_creators_public_select" ON public.content_creators FOR SELECT USING (true);

DROP POLICY IF EXISTS "creator_stats_history_public_select" ON public.creator_stats_history;
CREATE POLICY "creator_stats_history_public_select" ON public.creator_stats_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "content_creators_admin_all" ON public.content_creators;
CREATE POLICY "content_creators_admin_all" ON public.content_creators FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "creator_stats_history_admin_all" ON public.creator_stats_history;
CREATE POLICY "creator_stats_history_admin_all" ON public.creator_stats_history FOR ALL USING (auth.role() = 'authenticated');
