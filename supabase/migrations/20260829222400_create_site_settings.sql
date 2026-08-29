-- Create the site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert the default value for total_followers
INSERT INTO public.site_settings (key, value)
VALUES ('total_followers', '"6000+ followers"')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on site_settings"
    ON public.site_settings FOR SELECT
    USING (true);

-- Allow authenticated users (or service role) to update settings
CREATE POLICY "Allow authenticated update on site_settings"
    ON public.site_settings FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert settings
CREATE POLICY "Allow authenticated insert on site_settings"
    ON public.site_settings FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
