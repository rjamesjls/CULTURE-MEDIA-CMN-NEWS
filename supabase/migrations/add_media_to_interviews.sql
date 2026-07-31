-- Ajout des colonnes pour les médias (fichiers audio et pièces jointes) dans les réponses d'interview
ALTER TABLE public.interview_responses 
ADD COLUMN IF NOT EXISTS voice_urls JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS file_urls JSONB DEFAULT '{}'::jsonb;
