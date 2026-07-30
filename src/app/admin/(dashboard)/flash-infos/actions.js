'use server';

import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/utils/supabase/auth';

export async function getFlashInfos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('flash_infos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des flash infos:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function getActiveFlashInfos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('flash_infos')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur getActiveFlashInfos:', error);
    return [];
  }

  return data || [];
}

export async function addFlashInfo(content) {
  const profile = await getUserProfile();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'author')) {
    throw new Error('Non autorisé');
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('flash_infos')
    .insert([
      {
        content: content,
        is_active: true,
        user_id: profile.id
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Erreur addFlashInfo:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function toggleFlashInfoActive(id, currentStatus) {
  const profile = await getUserProfile();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'author')) {
    throw new Error('Non autorisé');
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('flash_infos')
    .update({ is_active: !currentStatus })
    .eq('id', id);

  if (error) {
    console.error('Erreur toggleFlashInfoActive:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteFlashInfo(id) {
  const profile = await getUserProfile();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'author')) {
    throw new Error('Non autorisé');
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('flash_infos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur deleteFlashInfo:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateFlashInfo(id, newContent) {
  const profile = await getUserProfile();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'author')) {
    throw new Error('Non autorisé');
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('flash_infos')
    .update({ content: newContent })
    .eq('id', id);

  if (error) {
    console.error('Erreur updateFlashInfo:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
