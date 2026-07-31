-- Création de la table des campagnes d'interview
CREATE TABLE IF NOT EXISTS public.interview_campaigns (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    token VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Création de la table des réponses aux interviews
CREATE TABLE IF NOT EXISTS public.interview_responses (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES public.interview_campaigns(id) ON DELETE CASCADE,
    interviewee_name VARCHAR(255) NOT NULL,
    interviewee_email VARCHAR(255),
    photo_url TEXT,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.interview_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Les campagnes actives sont publiques en lecture" ON public.interview_campaigns;
DROP POLICY IF EXISTS "Tout le monde peut soumettre une réponse" ON public.interview_responses;

-- Les campagnes actives peuvent être lues par n'importe qui (pour afficher le formulaire à l'invité)
CREATE POLICY "Les campagnes actives sont publiques en lecture" 
ON public.interview_campaigns FOR SELECT 
USING (is_active = true);

-- Tout le monde peut soumettre une réponse (insertion publique)
CREATE POLICY "Tout le monde peut soumettre une réponse" 
ON public.interview_responses FOR INSERT 
WITH CHECK (true);
