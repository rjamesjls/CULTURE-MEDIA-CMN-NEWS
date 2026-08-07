'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function saveProRegistration(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vous devez être connecté pour inscrire une entreprise." };
  }

  // Personal Info
  const contactFirstName = formData.get('contact_first_name') || '';
  const contactLastName = formData.get('contact_last_name') || '';
  const contactRole = formData.get('contact_role') || '';

  // Company Info
  const name = formData.get('name') || '';
  const siret = formData.get('siret') || '';
  const address = formData.get('address') || '';
  const contactEmail = formData.get('contact_email') || '';
  const contactPhone = formData.get('contact_phone') || '';
  const industry = formData.get('industry') || '';
  const businessType = formData.get('business_type') || '';
  const description = formData.get('description') || '';

  if (!name || !siret || !address || !contactEmail || !contactPhone || !industry || !businessType || !description) {
    return { error: "Veuillez remplir tous les champs obligatoires de l'entreprise." };
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const payload = {
    user_id: user.id,
    name,
    slug,
    siret,
    address,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    industry,
    business_type: businessType,
    description,
    contact_first_name: contactFirstName,
    contact_last_name: contactLastName,
    contact_role: contactRole,
    tier: 'free',
    status: 'active' 
  };

  const { error } = await supabase.from('companies').insert(payload);

  if (error) {
    return { error: "Erreur lors de la création de l'entreprise : " + error.message };
  }

  redirect('/pro/dashboard');
}
