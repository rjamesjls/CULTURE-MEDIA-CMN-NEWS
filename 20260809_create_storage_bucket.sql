-- Création du bucket 'social_posts' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('social_posts', 'social_posts', true)
ON CONFLICT (id) DO NOTHING;

-- Suppression des anciennes politiques si elles existent pour éviter les conflits de nom
DROP POLICY IF EXISTS "social_posts_public_access" ON storage.objects;
DROP POLICY IF EXISTS "social_posts_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "social_posts_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "social_posts_auth_delete" ON storage.objects;

-- Autoriser tout le monde à lire les fichiers du bucket (accès public)
CREATE POLICY "social_posts_public_access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'social_posts' );

-- Autoriser les utilisateurs authentifiés à ajouter des fichiers
CREATE POLICY "social_posts_auth_insert" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'social_posts' AND auth.role() = 'authenticated' );

-- Autoriser les utilisateurs authentifiés à mettre à jour leurs fichiers
CREATE POLICY "social_posts_auth_update" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'social_posts' AND auth.role() = 'authenticated' );

-- Autoriser les utilisateurs authentifiés à supprimer leurs fichiers
CREATE POLICY "social_posts_auth_delete" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'social_posts' AND auth.role() = 'authenticated' );
