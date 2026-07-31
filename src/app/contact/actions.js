'use server';

import { createClient } from '@/utils/supabase/server';

export async function submitContactMessage(formData) {
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');
  const email = formData.get('email');
  const message = formData.get('message');

  if (!firstName || !lastName || !email || !message) {
    return { success: false, error: "Veuillez remplir tous les champs obligatoires." };
  }

  if (!email.includes('@')) {
    return { success: false, error: "Adresse email invalide." };
  }

  const supabase = await createClient();

  let file_url = null;
  const attachment = formData.get('attachment');
  
  if (attachment && attachment.size > 0) {
    const fileExt = attachment.name.split('.').pop();
    const fileName = `contact_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `contact_attachments/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, attachment, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return { success: false, error: `Erreur Supabase: ${uploadError.message}` };
    }

    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    file_url = publicUrlData.publicUrl;
  }

  const { error } = await supabase
    .from('contact_messages')
    .insert([{
      first_name: firstName,
      last_name: lastName,
      email: email,
      message: message,
      file_url: file_url
    }]);

  if (error) {
    console.error('Contact message error:', error);
    return { success: false, error: "Une erreur est survenue lors de l'envoi de votre message." };
  }

  return { success: true, message: "Votre message a bien été envoyé ! Merci de nous avoir contactés." };
}
