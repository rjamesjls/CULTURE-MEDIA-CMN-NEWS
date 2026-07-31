-- Ajout de la table des commentaires
CREATE TABLE IF NOT EXISTS public.comments (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES public.articles(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS pour les commentaires
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Nettoyer les anciennes politiques si elles existent pour éviter l'erreur
DROP POLICY IF EXISTS "Les commentaires sont publics." ON public.comments;
DROP POLICY IF EXISTS "Tout le monde peut ajouter un commentaire." ON public.comments;
DROP POLICY IF EXISTS "Update for admins only" ON public.comments;
DROP POLICY IF EXISTS "Delete for admins only" ON public.comments;

-- Lecture publique
CREATE POLICY "Les commentaires sont publics." 
ON public.comments FOR SELECT 
USING (true);

-- Ajout public (anonyme ou via API publique)
CREATE POLICY "Tout le monde peut ajouter un commentaire." 
ON public.comments FOR INSERT 
WITH CHECK (true);

-- Update public restreint (seulement pour approuver/rejeter si nécessaire)
CREATE POLICY "Update for admins only" 
ON public.comments FOR UPDATE 
USING (true);

CREATE POLICY "Delete for admins only" 
ON public.comments FOR DELETE 
USING (true);

-- Ajout de la colonne likes_count à la table articles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='articles' AND column_name='likes_count'
    ) THEN
        ALTER TABLE public.articles ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
END $$;


-- Création de la fonction RPC pour incrémenter les likes
CREATE OR REPLACE FUNCTION increment_article_likes(article_id INT)
RETURNS void AS $$
BEGIN
  UPDATE public.articles
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql;
