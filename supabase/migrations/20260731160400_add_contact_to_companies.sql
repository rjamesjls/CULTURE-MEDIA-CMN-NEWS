-- Add contact email and phone to companies table
ALTER TABLE public.companies
ADD COLUMN contact_email TEXT,
ADD COLUMN contact_phone TEXT;
