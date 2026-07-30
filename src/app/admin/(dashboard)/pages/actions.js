'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function savePage(formData) {
  const supabase = await createClient();

  // Vérifier si admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') throw new Error('Non autorisé');

  const id = formData.get('id');
  const title = formData.get('title');
  const slug = formData.get('slug');
  const content = formData.get('content');
  const status = formData.get('status') || 'draft';

  if (!title || !slug || !content) {
    throw new Error('Tous les champs requis ne sont pas remplis');
  }

  const pageData = {
    title,
    slug: slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-'),
    content,
    status,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from('pages').update(pageData).eq('id', id);
    if (error) throw new Error('Erreur lors de la mise à jour de la page: ' + error.message);
  } else {
    const { error } = await supabase.from('pages').insert([pageData]);
    if (error) throw new Error('Erreur lors de la création de la page: ' + error.message);
  }

  revalidatePath('/admin/pages');
  revalidatePath('/[slug]');
  return { success: true };
}

export async function deletePage(id) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') throw new Error('Non autorisé');

  const { error } = await supabase.from('pages').delete().eq('id', id);

  if (error) {
    throw new Error('Erreur lors de la suppression : ' + error.message);
  }

  revalidatePath('/admin/pages');
  return { success: true };
}
