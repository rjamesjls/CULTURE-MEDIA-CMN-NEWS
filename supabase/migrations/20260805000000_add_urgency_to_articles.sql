-- Migration pour ajouter is_urgent à la table articles

ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false NOT NULL;
