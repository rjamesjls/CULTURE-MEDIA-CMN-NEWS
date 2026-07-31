'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getIdeas() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('content_ideas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching ideas:', error);
    return [];
  }
  return data;
}

export async function createIdea(idea) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('content_ideas')
    .insert([
      {
        title: idea.title,
        description: idea.description || '',
        status: idea.status || 'idea'
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating idea:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/ideas');
  return { success: true, idea: data };
}

export async function updateIdea(id, updates) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('content_ideas')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating idea:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/ideas');
  return { success: true, idea: data };
}

export async function deleteIdea(id) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('content_ideas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting idea:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/ideas');
  return { success: true };
}

export async function getIdeaById(id) {
  if (!id) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('content_ideas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching idea by id:', error);
    return null;
  }
  return data;
}
