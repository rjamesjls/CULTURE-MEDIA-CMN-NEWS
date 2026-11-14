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

export async function saveArticle(input) {
  const { getUserProfile } = await import('@/utils/supabase/auth');
  const { createClient } = await import('@/utils/supabase/server');
  
  const profile = await getUserProfile();
  if (!profile) throw new Error("Non autorisé");

  const isFormData = typeof input?.get === 'function';
  const get = (key) => isFormData ? input.get(key) : input?.[key];

  const id = get('id');
  const title = get('title');
  const description = get('description');
  const content = get('content');
  
  // BSH Fields
  const title_bsh = get('title_bsh');
  const hook_bsh = get('hook_bsh');
  const content_bsh = get('content_bsh');

  const category = get('category') || 'Non classé';
  const author = get('author') || 'La Rédaction';
  const status = get('status') || 'published';
  let image_url = get('image_url');
  const pub_date = get('pub_date');
  
  let seo_metadata = {};
  const rawSeoMetadata = get('seo_metadata');
  if (rawSeoMetadata) {
    if (typeof rawSeoMetadata === 'object') {
      seo_metadata = rawSeoMetadata;
    } else {
      try {
        seo_metadata = JSON.parse(rawSeoMetadata);
      } catch (e) {
        console.error("Erreur parsing seo_metadata", e);
      }
    }
  }
  
  const supabaseServer = await createClient();
  
  // Handling new file upload if provided (fallback if sent as FormData)
  const imageFile = isFormData ? input.get('image_file') : input?.image_file;
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

  // Handling magazine cover upload if provided
  const magazineCoverFile = isFormData ? input.get('magazine_cover_file') : input?.magazine_cover_file;
  if (magazineCoverFile && magazineCoverFile.size > 0) {
    const fileExt = magazineCoverFile.name.split('.').pop();
    const fileName = `magazines/cover_${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabaseServer.storage
      .from('media')
      .upload(fileName, magazineCoverFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw new Error("Erreur lors de l'upload de la couverture magazine");

    const { data: publicUrlData } = supabaseServer.storage
      .from('media')
      .getPublicUrl(fileName);

    seo_metadata.magazine_cover_url = publicUrlData.publicUrl;
  }

  const slug = slugify(title || 'sans-titre', { lower: true, strict: true, locale: 'fr' });

  const rawIsSpecialEdition = get('is_special_edition');
  const isSpecialEdition = rawIsSpecialEdition === true || rawIsSpecialEdition === 'true';

  const articleData = {
    title,
    description,
    content,
    title_bsh,
    hook_bsh,
    content_bsh,
    category,
    image_url,
    slug,
    author,
    status,
    seo_metadata,
    is_special_edition: isSpecialEdition,
  };

  if (pub_date) {
    const parsedDate = new Date(pub_date);
    if (!isNaN(parsedDate.getTime())) {
      articleData.pub_date = parsedDate.toISOString();
    }
  }

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
    if (!articleData.pub_date) {
      articleData.pub_date = new Date().toISOString();
    }
    articleData.user_id = profile.id;
    const { data: inserted, error } = await supabaseServer.from('articles').insert([articleData]).select('id, slug').single();
    if (error) throw new Error(error.message);
    revalidatePath('/');
    revalidatePath('/fr');
    revalidatePath('/bsh');
    revalidatePath('/admin/articles');
    return { success: true, id: inserted?.id, slug: inserted?.slug };
  }

  revalidatePath('/');
  revalidatePath('/fr');
  revalidatePath('/bsh');
  revalidatePath('/faits-divers');
  revalidatePath('/admin/articles');
  if (slug) {
    revalidatePath(`/fr/article/${slug}`);
    revalidatePath(`/bsh/article/${slug}`);
  }
  
  return { success: true, id, slug };
}

export async function createCategory(formData) {
  const { getUserProfile } = await import('@/utils/supabase/auth');
  const { createClient } = await import('@/utils/supabase/server');
  
  const profile = await getUserProfile();
  if (!profile) throw new Error("Non autorisé");

  const name = formData.get('name');
  const slug = slugify(name, { lower: true, strict: true, locale: 'fr' });

  const supabaseServer = await createClient();
  const { error } = await supabaseServer.from('categories').insert([{ name, slug }]);
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
  const { getUserProfile } = await import('@/utils/supabase/auth');
  const { createClient } = await import('@/utils/supabase/server');
  
  const profile = await getUserProfile();
  if (!profile) throw new Error("Non autorisé");

  const supabaseServer = await createClient();
  const { error } = await supabaseServer.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/', 'layout');
  revalidatePath('/admin/categories');
  return { success: true };
}

export async function toggleArticleStatus(id, currentStatus) {
  const { getUserProfile } = await import('@/utils/supabase/auth');
  const { createClient } = await import('@/utils/supabase/server');
  
  const profile = await getUserProfile();
  if (!profile) throw new Error("Non autorisé");

  const newStatus = currentStatus === 'published' ? 'draft' : 'published';
  const supabaseServer = await createClient();
  
  const { error } = await supabaseServer
    .from('articles')
    .update({ status: newStatus })
    .eq('id', id);
    
  if (error) throw new Error("Erreur lors de la mise à jour du statut");
  
  revalidatePath('/admin/articles');
  revalidatePath('/');
  return newStatus;
}

export async function updateArticleStatus(id, newStatus) {
  const { getUserProfile } = await import('@/utils/supabase/auth');
  const { createClient } = await import('@/utils/supabase/server');
  
  const profile = await getUserProfile();
  if (!profile) throw new Error("Non autorisé");

  const supabaseServer = await createClient();
  
  const { error } = await supabaseServer
    .from('articles')
    .update({ status: newStatus })
    .eq('id', id);
    
  if (error) throw new Error("Erreur lors de la mise à jour du statut");
  
  revalidatePath('/admin/articles');
  revalidatePath('/');
  return newStatus;
}

export async function updateArticlePubDate(id, newPubDate) {
  const { getUserProfile } = await import('@/utils/supabase/auth');
  const { createClient } = await import('@/utils/supabase/server');
  
  const profile = await getUserProfile();
  if (!profile) throw new Error("Non autorisé");

  const parsedDate = new Date(newPubDate);
  if (isNaN(parsedDate.getTime())) throw new Error("Date invalide");

  const supabaseServer = await createClient();

  if (profile.role === 'author') {
    const { data: existing } = await supabaseServer.from('articles').select('user_id').eq('id', id).single();
    if (existing?.user_id !== profile.id) throw new Error("Non autorisé à modifier cet article");
  }

  const { data: article, error } = await supabaseServer
    .from('articles')
    .update({ pub_date: parsedDate.toISOString() })
    .eq('id', id)
    .select('slug')
    .single();
    
  if (error) throw new Error("Erreur lors de la mise à jour de la date : " + error.message);
  
  revalidatePath('/');
  revalidatePath('/fr');
  revalidatePath('/bsh');
  revalidatePath('/faits-divers');
  revalidatePath('/admin/articles');
  if (article?.slug) {
    revalidatePath(`/fr/article/${article.slug}`);
    revalidatePath(`/bsh/article/${article.slug}`);
  }
  return { success: true, pub_date: parsedDate.toISOString() };
}
