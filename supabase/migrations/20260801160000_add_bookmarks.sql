-- Table pour les favoris (articles sauvegardés)
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    article_id INTEGER REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, article_id)
);

-- RLS pour les favoris
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- L'utilisateur peut voir ses propres favoris
CREATE POLICY "Les utilisateurs peuvent voir leurs favoris" 
ON public.bookmarks FOR SELECT 
USING (auth.uid() = user_id);

-- L'utilisateur peut ajouter un favori
CREATE POLICY "Les utilisateurs peuvent ajouter un favori" 
ON public.bookmarks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- L'utilisateur peut supprimer un favori
CREATE POLICY "Les utilisateurs peuvent supprimer un favori" 
ON public.bookmarks FOR DELETE 
USING (auth.uid() = user_id);
