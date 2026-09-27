-- Création du bucket de stockage pour les musiques de la radio
INSERT INTO storage.buckets (id, name, public) VALUES ('webradio', 'webradio', true) ON CONFLICT (id) DO NOTHING;

-- Table des musiques
CREATE TABLE IF NOT EXISTS radio_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    audio_url TEXT NOT NULL,
    cover_url TEXT,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de l'état de la radio (1 seule ligne)
CREATE TABLE IF NOT EXISTS radio_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    mode VARCHAR(10) NOT NULL DEFAULT 'auto', -- 'auto' ou 'live'
    live_url TEXT,
    current_track_id UUID REFERENCES radio_tracks(id),
    track_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialiser la ligne d'état unique
INSERT INTO radio_state (id, mode) VALUES (1, 'auto') ON CONFLICT (id) DO NOTHING;

-- Table de l'historique
CREATE TABLE IF NOT EXISTS radio_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID REFERENCES radio_tracks(id),
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Politiques de sécurité (RLS)
ALTER TABLE radio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_history ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour tout le monde
DROP POLICY IF EXISTS "radio_tracks_public_select" ON radio_tracks;
CREATE POLICY "radio_tracks_public_select" ON radio_tracks FOR SELECT USING (true);

DROP POLICY IF EXISTS "radio_state_public_select" ON radio_state;
CREATE POLICY "radio_state_public_select" ON radio_state FOR SELECT USING (true);

DROP POLICY IF EXISTS "radio_history_public_select" ON radio_history;
CREATE POLICY "radio_history_public_select" ON radio_history FOR SELECT USING (true);

-- Administration (Tout autoriser pour les authentifiés)
DROP POLICY IF EXISTS "radio_tracks_admin_all" ON radio_tracks;
CREATE POLICY "radio_tracks_admin_all" ON radio_tracks FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "radio_state_admin_all" ON radio_state;
CREATE POLICY "radio_state_admin_all" ON radio_state FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "radio_history_admin_all" ON radio_history;
CREATE POLICY "radio_history_admin_all" ON radio_history FOR ALL USING (auth.role() = 'authenticated');

-- Autoriser la lecture publique des fichiers audio
DROP POLICY IF EXISTS "give_public_access_to_webradio" ON storage.objects;
CREATE POLICY "give_public_access_to_webradio" ON storage.objects FOR SELECT USING (bucket_id = 'webradio');

DROP POLICY IF EXISTS "allow_admin_upload_webradio" ON storage.objects;
CREATE POLICY "allow_admin_upload_webradio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'webradio' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "allow_admin_delete_webradio" ON storage.objects;
CREATE POLICY "allow_admin_delete_webradio" ON storage.objects FOR DELETE USING (bucket_id = 'webradio' AND auth.role() = 'authenticated');
ALTER PUBLICATION supabase_realtime ADD TABLE radio_state;
