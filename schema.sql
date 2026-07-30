-- Suppression de la table si elle existe (ATTENTION: Ceci efface les données !)
DROP TABLE IF EXISTS public.articles;

-- Création de la table articles
CREATE TABLE public.articles (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    pub_date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    category VARCHAR(100) DEFAULT 'Faits divers',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation du Row Level Security (RLS)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Autoriser la lecture pour tout le monde (accès public)
CREATE POLICY "Les articles sont publics." 
ON public.articles FOR SELECT 
USING (true);

-- (Optionnel) Autoriser l'insertion uniquement pour les rôles avec la clé service_role ou depuis le dashboard
-- Nous ne créons pas de politique d'insertion anonyme par sécurité. L'insertion se fera avec service_role.
