-- Création de la table categories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insertion des catégories par défaut
INSERT INTO categories (name, slug) VALUES 
('Faits divers', 'faits-divers'),
('Culture', 'culture'),
('Musique', 'musique'),
('Événements', 'evenements'),
('Société', 'societe')
ON CONFLICT (name) DO NOTHING;
