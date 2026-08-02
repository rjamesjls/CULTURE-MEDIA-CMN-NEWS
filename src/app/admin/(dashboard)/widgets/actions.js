'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addWidget(name, url) {
  const supabase = await createClient();

  // Simple validation
  if (!name || !url) {
    return { success: false, error: "Le nom et l'URL sont requis." };
  }

  // Check if URL is valid
  try {
    new URL(url);
  } catch (e) {
    return { success: false, error: "L'URL fournie n'est pas valide. N'oubliez pas le https://." };
  }

  const { data, error } = await supabase
    .from('admin_widgets')
    .insert([{ name, url }])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de l\'ajout du widget:', error);
    return { success: false, error: "Erreur lors de la sauvegarde du widget." };
  }

  revalidatePath('/admin/widgets');
  return { success: true, widget: data };
}

export async function deleteWidget(id) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('admin_widgets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur lors de la suppression du widget:', error);
    return { success: false, error: "Erreur lors de la suppression du widget." };
  }

  revalidatePath('/admin/widgets');
  return { success: true };
}
