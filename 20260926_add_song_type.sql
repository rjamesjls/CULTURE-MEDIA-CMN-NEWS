ALTER TABLE youtube_videos ADD COLUMN IF NOT EXISTS song_type VARCHAR(100) DEFAULT 'Non spécifié';
ALTER TABLE youtube_channels ADD COLUMN IF NOT EXISTS song_type VARCHAR(100) DEFAULT 'Non spécifié';
