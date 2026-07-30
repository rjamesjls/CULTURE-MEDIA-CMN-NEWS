-- Create pages table
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'published' NOT NULL CHECK (status IN ('published', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for pages
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Public read access for published pages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public can read published pages' AND tablename = 'pages'
    ) THEN
        CREATE POLICY "Public can read published pages" ON public.pages
            FOR SELECT
            USING (status = 'published');
    END IF;
END
$$;

-- Admins can manage all pages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage pages' AND tablename = 'pages'
    ) THEN
        CREATE POLICY "Admins can manage pages" ON public.pages
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
                )
            );
    END IF;
END
$$;
