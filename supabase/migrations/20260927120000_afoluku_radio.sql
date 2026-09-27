-- The new radio is isolated from the existing news and legacy radio tables.
BEGIN;
CREATE SCHEMA IF NOT EXISTS afoluku_radio;
REVOKE ALL ON SCHEMA afoluku_radio FROM PUBLIC,anon,authenticated;
CREATE TABLE IF NOT EXISTS afoluku_radio.tracks(id text PRIMARY KEY,title text NOT NULL,duration double precision NOT NULL,bytes bigint NOT NULL,mime text NOT NULL,content_kind text NOT NULL DEFAULT 'music' CHECK(content_kind IN ('music','advertisement','jingle','voiceover')),music_genre text CHECK(music_genre IN ('urban','traditional','gospel')),cover_key text,peaks text NOT NULL DEFAULT '[]',created_at bigint NOT NULL);
CREATE TABLE IF NOT EXISTS afoluku_radio.playlists(id text PRIMARY KEY,name text NOT NULL,track_ids text NOT NULL DEFAULT '[]',version integer NOT NULL DEFAULT 1,updated_at bigint NOT NULL);
CREATE TABLE IF NOT EXISTS afoluku_radio.station(id integer PRIMARY KEY CHECK(id=1),snapshot text NOT NULL DEFAULT '[]',playlist_name text NOT NULL DEFAULT '',started_at bigint NOT NULL DEFAULT 0,paused_at bigint NOT NULL DEFAULT 0,stream_clock_shift bigint NOT NULL DEFAULT 0,loop integer NOT NULL DEFAULT 1,live_session text,revision integer NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS afoluku_radio.live_sessions(id text PRIMARY KEY,seq integer NOT NULL DEFAULT -1,updated_at bigint NOT NULL);
CREATE TABLE IF NOT EXISTS afoluku_radio.listener_sessions(id text PRIMARY KEY,viewer_id text NOT NULL,sequence bigint NOT NULL,active integer NOT NULL,updated_at bigint NOT NULL);
CREATE INDEX IF NOT EXISTS radio_listeners_active ON afoluku_radio.listener_sessions(active,updated_at,viewer_id);
CREATE INDEX IF NOT EXISTS radio_listeners_updated ON afoluku_radio.listener_sessions(updated_at);
CREATE TABLE IF NOT EXISTS afoluku_radio.stream_attempts(session_id text PRIMARY KEY,viewer_id text NOT NULL,occurrence text NOT NULL,track_id text NOT NULL,sequence bigint NOT NULL,active integer NOT NULL,listened_ms bigint NOT NULL DEFAULT 0,last_seen bigint NOT NULL);
CREATE INDEX IF NOT EXISTS radio_attempts_seen ON afoluku_radio.stream_attempts(last_seen);
CREATE INDEX IF NOT EXISTS radio_attempts_track ON afoluku_radio.stream_attempts(track_id);
CREATE TABLE IF NOT EXISTS afoluku_radio.track_streams(viewer_id text NOT NULL,occurrence text NOT NULL,track_id text NOT NULL,counted_at bigint NOT NULL,PRIMARY KEY(viewer_id,occurrence));
CREATE INDEX IF NOT EXISTS radio_streams_track ON afoluku_radio.track_streams(track_id);
CREATE TABLE IF NOT EXISTS afoluku_radio.radio_settings(id integer PRIMARY KEY CHECK(id=1),payload text NOT NULL DEFAULT '{}',logo_key text,version integer NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS afoluku_radio.uploads(id text PRIMARY KEY,owner_id text NOT NULL,object_key text NOT NULL UNIQUE,purpose text NOT NULL,metadata text NOT NULL,expires_at bigint NOT NULL,result_json text);
CREATE INDEX IF NOT EXISTS radio_uploads_expiry ON afoluku_radio.uploads(expires_at);
DO $$ DECLARE t record; BEGIN FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='afoluku_radio' LOOP EXECUTE format('ALTER TABLE afoluku_radio.%I ENABLE ROW LEVEL SECURITY',t.tablename); END LOOP; END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA afoluku_radio FROM PUBLIC,anon,authenticated;
-- Only server credentials and signed upload/read URLs can access radio objects.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('afoluku-radio','afoluku-radio',false,52428800,ARRAY['audio/mpeg','audio/mp4','audio/wav','audio/x-wav','audio/ogg','audio/flac','audio/aac','audio/webm','video/mp4','video/webm','image/png','image/jpeg','image/webp']) ON CONFLICT(id) DO NOTHING;
COMMIT;
