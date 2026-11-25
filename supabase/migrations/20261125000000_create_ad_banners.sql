-- Migration: Create ad_banners table and tracking functions
-- Architecture inspired by BoLivro ad campaigns system

CREATE TABLE IF NOT EXISTS public.ad_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT,
    badge_text TEXT DEFAULT 'Sponsorisé',
    sponsor_name TEXT DEFAULT 'Partenaire AFOLUKU TV',
    cta_text TEXT DEFAULT 'En savoir plus',
    link_url TEXT,
    placement TEXT NOT NULL DEFAULT 'header', -- 'header', 'in_feed', 'sidebar'
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    views_count INTEGER NOT NULL DEFAULT 0,
    clicks_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_ad_banners_placement_active 
ON public.ad_banners(placement, is_active, display_order);

-- Enable RLS
ALTER TABLE public.ad_banners ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view active ad banners"
ON public.ad_banners FOR SELECT
USING (true);

CREATE POLICY "Admins have full access to ad banners"
ON public.ad_banners FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'superadmin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'superadmin')
    )
);

-- RPC Functions to increment views and clicks atomically
CREATE OR REPLACE FUNCTION public.increment_ad_view(banner_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
    UPDATE public.ad_banners
    SET views_count = views_count + 1
    WHERE id = banner_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_ad_click(banner_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
    UPDATE public.ad_banners
    SET clicks_count = clicks_count + 1
    WHERE id = banner_id;
$$;
