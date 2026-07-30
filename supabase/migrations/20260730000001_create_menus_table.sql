-- Create the menus table
CREATE TABLE IF NOT EXISTS menus (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    location TEXT NOT NULL CHECK (location IN ('header', 'footer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert some default header menus
INSERT INTO menus (label, url, position, location) VALUES 
('Accueil', '/', 1, 'header'),
('Faits divers', '/faits-divers', 2, 'header'),
('Culture', '/category?cat=culture', 3, 'header'),
('Musique', '/category?cat=musique', 4, 'header');

-- Insert some default footer menus
INSERT INTO menus (label, url, position, location) VALUES 
('Culture', '/category?cat=culture', 1, 'footer'),
('Musique', '/category?cat=musique', 2, 'footer'),
('Événements', '/category?cat=evenements', 3, 'footer'),
('Société', '/category?cat=societe', 4, 'footer'),
('Faits divers', '/faits-divers', 5, 'footer'),
('Vidéos', '/category?cat=videos', 6, 'footer');
