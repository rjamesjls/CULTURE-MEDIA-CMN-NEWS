'use server';

import { createClient } from '@/utils/supabase/server';

export async function subscribeToNewsletter(formData) {
  const email = formData.get('email');
  if (!email || !email.includes('@')) {
    return { error: "Adresse email invalide." };
  }

  const supabase = await createClient();
  
  // Check if already subscribed
  const { data: existing } = await supabase
    .from('subscribers')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    return { success: false, message: "Vous êtes déjà abonné(e) à notre newsletter." };
  }

  const { error } = await supabase
    .from('subscribers')
    .insert([{ email }]);

  if (error) {
    console.error('Newsletter error:', error);
    return { error: "Une erreur est survenue lors de l'inscription." };
  }

  return { success: true, message: "Merci pour votre inscription à la newsletter !" };
}
