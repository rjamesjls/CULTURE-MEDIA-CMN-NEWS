-- Ajout de la colonne instagram_state pour sauvegarder l'état du générateur Instagram
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS instagram_state JSONB DEFAULT NULL;
