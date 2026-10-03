-- Create media_library table
CREATE TABLE IF NOT EXISTS public.media_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'image', 'video', 'audio', 'generation'
    file_size INTEGER,
    hash TEXT, -- To prevent exact duplicates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast duplication check
CREATE INDEX IF NOT EXISTS idx_media_library_hash ON public.media_library(hash);

-- Allow public read access (if needed for display)
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to media_library" 
ON public.media_library FOR SELECT USING (true);

CREATE POLICY "Allow authenticated inserts to media_library" 
ON public.media_library FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create saved_carousels table
CREATE TABLE IF NOT EXISTS public.saved_carousels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    pages_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id)
);

ALTER TABLE public.saved_carousels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved_carousels" 
ON public.saved_carousels FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved_carousels" 
ON public.saved_carousels FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved_carousels" 
ON public.saved_carousels FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved_carousels" 
ON public.saved_carousels FOR DELETE USING (auth.uid() = user_id);
