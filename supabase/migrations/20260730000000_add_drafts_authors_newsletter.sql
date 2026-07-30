-- Migration pour ajouter Status, Author et la table Subscribers

-- 1. Ajout de colonnes à la table articles
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'published' NOT NULL;

ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS author VARCHAR(255) DEFAULT 'La Rédaction' NOT NULL;

-- 2. Création de la table subscribers
CREATE TABLE IF NOT EXISTS public.subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation du RLS pour subscribers
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'subscribers'
          AND policyname = 'Insertion publique pour subscribers'
    ) THEN
        CREATE POLICY "Insertion publique pour subscribers" 
        ON public.subscribers FOR INSERT 
        WITH CHECK (true);
    END IF;
END
$$;

-- L'administrateur (via service_role) pourra lire/supprimer. 
-- Pas de policy SELECT publique pour protéger la vie privée des emails.
