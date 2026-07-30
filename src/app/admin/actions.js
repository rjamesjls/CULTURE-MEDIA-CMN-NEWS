'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import slugify from 'slugify';

export async function deleteArticle(id) {
  const { getUserProfile } = await import('@/utils/supabase/auth');
  const { createClient } = await import('@/utils/supabase/server');
  
  const profile = await getUserProfile();
  if (!profile) throw new Error("Non autorisé");

  const supabaseServer = await createClient();

  if (profile.role === 'author') {
    const { data: existing } = await supabaseServer.from('articles').select('user_id').eq('id', id).single();
    if (existing?.user_id !== profile.id) throw new Error("Non autorisé à supprimer cet article");
  }

  const { error } = await supabaseServer.from('articles').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath('/');
  revalidatePath('/faits-divers');
  revalidatePath('/admin/articles');
  return { success: true };
}

export async function saveArticle(formData) {
  const { getUserProfile } = await import('@/utils/supabase/auth');
  const { createClient } = await import('@/utils/supabase/server');
  
  const profile = await getUserProfile();
  if (!profile) throw new Error("Non autorisé");

  const id = formData.get('id');
  const title = formData.get('title');
  const description = formData.get('description');
  const content = formData.get('content');
  const category = formData.get('category') || 'Non classé';
  const author = formData.get('author') || 'La Rédaction';
  const status = formData.get('status') || 'published';
  let image_url = formData.get('image_url');
  
  const supabaseServer = await createClient();
  
  // Handling new file upload if provided
  const imageFile = formData.get('image_file');
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `articles/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabaseServer.storage
      .from('media')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw new Error("Erreur lors de l'upload de l'image");

    const { data: publicUrlData } = supabaseServer.storage
      .from('media')
      .getPublicUrl(filePath);

    image_url = publicUrlData.publicUrl;
  }

  const slug = slugify(title, { lower: true, strict: true, locale: 'fr' });

  const articleData = {
    title,
    description,
    content,
    category,
    image_url,
    slug,
    author,
    status,
  };

  if (id) {
    // Check if authorized to update
    if (profile.role === 'author') {
      const { data: existing } = await supabaseServer.from('articles').select('user_id').eq('id', id).single();
      if (existing?.user_id !== profile.id) throw new Error("Non autorisé à modifier cet article");
    }
    const { error } = await supabaseServer.from('articles').update(articleData).eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    // Insert
    articleData.pub_date = new Date().toISOString();
    articleData.user_id = profile.id;
    const { error } = await supabaseServer.from('articles').insert([articleData]);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/');
  revalidatePath('/faits-divers');
  revalidatePath('/admin/articles');
  
  return { success: true };
}

export async function createCategory(formData) {
  const name = formData.get('name');
  const slug = slugify(name, { lower: true, strict: true, locale: 'fr' });

  const { error } = await supabase.from('categories').insert([{ name, slug }]);
  if (error) {
    if (error.code === '23505') throw new Error('Cette catégorie existe déjà.');
    throw new Error(error.message);
  }
  revalidatePath('/', 'layout');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/articles/new');
  return { success: true };
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/', 'layout');
  revalidatePath('/admin/categories');
  return { success: true };
}
