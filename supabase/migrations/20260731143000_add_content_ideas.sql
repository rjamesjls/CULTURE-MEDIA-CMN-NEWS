-- Migration: Add content ideas table

CREATE TABLE IF NOT EXISTS public.content_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'idea' CHECK (status IN ('idea', 'todo', 'in_progress', 'done')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Active RLS
ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;

-- Politique de sécurité
CREATE POLICY "Les idées sont publiques (admin)" 
ON public.content_ideas FOR ALL 
USING (true)
WITH CHECK (true);
