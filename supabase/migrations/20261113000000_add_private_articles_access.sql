-- Migration pour la fonctionnalité d'envoi d'article privé avec code de lecture
-- Permet de stocker les paramètres d'accès privés dans seo_metadata
-- et ajoute la documentation du statut 'private' pour la table articles.

COMMENT ON COLUMN public.articles.status IS 'Statut de publication de l''article : published, draft, pending, private';

-- Note: La configuration de partage privé est stockée sous forme de JSONB dans seo_metadata->'private_access' :
-- {
--   "enabled": true,
--   "token": "a1b2c3d4e5f67890",
--   "access_code": "849201",
--   "recipient_name": "Nom Destinataire",
--   "recipient_email": "email@example.com",
--   "is_private_only": true,
--   "expires_at": null,
--   "created_at": "2026-11-13T...",
--   "views_count": 0
-- }
