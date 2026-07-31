-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    siret TEXT,
    logo_url TEXT,
    description TEXT,
    website_url TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
    is_verified BOOLEAN DEFAULT false,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Anyone can view active companies
CREATE POLICY "Public profiles are viewable by everyone."
    ON public.companies FOR SELECT
    USING (status = 'active');

-- Users can insert their own company profile
CREATE POLICY "Users can insert their own company profile."
    ON public.companies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own company profile
CREATE POLICY "Users can update own company profile."
    ON public.companies FOR UPDATE
    USING (auth.uid() = user_id);

-- Storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for company logos
CREATE POLICY "Company logos are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'company-logos' );

CREATE POLICY "Users can upload their company logos."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'company-logos' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update their company logos."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'company-logos' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can delete their company logos."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'company-logos' AND auth.role() = 'authenticated' );
