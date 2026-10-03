-- Création de la table pour stocker les clips suivis
CREATE TABLE IF NOT EXISTS youtube_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id VARCHAR(255) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    channel_title VARCHAR(255) NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    sector VARCHAR(100) NOT NULL, -- Guyane, Suriname, etc.
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table pour l'historique des vues (pour calculer la croissance)
CREATE TABLE IF NOT EXISTS youtube_stats_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id VARCHAR(255) REFERENCES youtube_videos(video_id) ON DELETE CASCADE,
    views BIGINT NOT NULL DEFAULT 0,
    likes BIGINT NOT NULL DEFAULT 0,
    comments BIGINT NOT NULL DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Règle de sécurité pour autoriser la lecture à tout le monde
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_stats_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "youtube_videos_public_select" ON youtube_videos;
CREATE POLICY "youtube_videos_public_select" ON youtube_videos FOR SELECT USING (true);

DROP POLICY IF EXISTS "youtube_stats_history_public_select" ON youtube_stats_history;
CREATE POLICY "youtube_stats_history_public_select" ON youtube_stats_history FOR SELECT USING (true);

-- Autoriser l'insertion/modification uniquement par les admins (authentifiés)
DROP POLICY IF EXISTS "youtube_videos_admin_all" ON youtube_videos;
CREATE POLICY "youtube_videos_admin_all" ON youtube_videos FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "youtube_stats_history_admin_all" ON youtube_stats_history;
CREATE POLICY "youtube_stats_history_admin_all" ON youtube_stats_history FOR ALL USING (auth.role() = 'authenticated');
