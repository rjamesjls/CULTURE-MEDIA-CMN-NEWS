-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'author' NOT NULL CHECK (role IN ('admin', 'author')),
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Admins can read and update all profiles
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, status)
    VALUES (
        new.id, 
        new.email, 
        CASE WHEN new.email = 'admin@culturemedianews.fr' THEN 'admin' ELSE 'author' END,
        CASE WHEN new.email = 'admin@culturemedianews.fr' THEN 'active' ELSE 'pending' END
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists so we can recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- For existing users (if any), create profiles manually
INSERT INTO public.profiles (id, email, role, status)
SELECT 
    id, 
    email, 
    CASE WHEN email = 'admin@culturemedianews.fr' THEN 'admin' ELSE 'author' END,
    CASE WHEN email = 'admin@culturemedianews.fr' THEN 'active' ELSE 'pending' END
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Add user_id to articles
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Assign existing articles to the admin
DO $$
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@culturemedianews.fr' LIMIT 1;
    
    IF admin_id IS NOT NULL THEN
        UPDATE public.articles SET user_id = admin_id WHERE user_id IS NULL;
    END IF;
END
$$;
