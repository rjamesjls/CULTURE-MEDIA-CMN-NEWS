'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Utilisation du Service Role Key pour bypasser les règles RLS et permettre l'incrémentation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Incrémente le nombre de vues d'un article
 */
export async function incrementView(articleId) {
  if (!articleId) return;
  
  try {
    // Note: Pour une haute concurrence, il est préférable d'utiliser une RPC (Remote Procedure Call)
    // dans Supabase pour incrémenter sans lire la valeur avant.
    // Faute de RPC, on lit d'abord puis on met à jour.
    const { data: article } = await supabaseAdmin
      .from('articles')
      .select('views_count')
      .eq('id', articleId)
      .single();

    if (article) {
      await supabaseAdmin
        .from('articles')
        .update({ views_count: (article.views_count || 0) + 1 })
        .eq('id', articleId);
    }
  } catch (error) {
    console.error('Error incrementing view:', error);
  }
}

/**
 * Incrémente le nombre de likes d'un article
 */
export async function incrementLike(articleId) {
  if (!articleId) return;
  
  try {
    const { data: article } = await supabaseAdmin
      .from('articles')
      .select('likes_count')
      .eq('id', articleId)
      .single();

    if (article) {
      const newCount = (article.likes_count || 0) + 1;
      await supabaseAdmin
        .from('articles')
        .update({ likes_count: newCount })
        .eq('id', articleId);
        
      revalidatePath(`/article/[slug]`);
      return newCount;
    }
  } catch (error) {
    console.error('Error incrementing like:', error);
    return null;
  }
}

/**
 * Incrémente le nombre de partages d'un article
 */
export async function incrementShare(articleId) {
  if (!articleId) return;
  
  try {
    const { data: article } = await supabaseAdmin
      .from('articles')
      .select('shares_count')
      .eq('id', articleId)
      .single();

    if (article) {
      const newCount = (article.shares_count || 0) + 1;
      await supabaseAdmin
        .from('articles')
        .update({ shares_count: newCount })
        .eq('id', articleId);
        
      return newCount;
    }
  } catch (error) {
    console.error('Error incrementing share:', error);
    return null;
  }
}
