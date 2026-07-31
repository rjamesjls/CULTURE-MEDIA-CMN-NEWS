'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function createMagazine(formData) {
  const { getUserProfile } = await import('@/utils/supabase/auth');
  const { createClient } = await import('@/utils/supabase/server');
  
  const profile = await getUserProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Error("Non autorisé");
  }

  const supabaseServer = await createClient();
  
  const title = formData.get('title');
  const description = formData.get('description');
  const type = formData.get('type') || 'static';
  let cover_image_url = formData.get('cover_image_url') || '';
  
  // Handling new file upload if provided
  const imageFile = formData.get('image_file');
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `cover_${Date.now()}.${fileExt}`;
    const filePath = `magazines/${fileName}`;

    const { error: uploadError } = await supabaseServer.storage
      .from('media')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw new Error("Erreur lors de l'upload de la couverture");

    const { data: publicUrlData } = supabaseServer.storage
      .from('media')
      .getPublicUrl(filePath);

    cover_image_url = publicUrlData.publicUrl;
  }
  
  const contentDataStr = formData.get('content_data');
  let content_data = [];
  try {
    if (contentDataStr) {
      content_data = JSON.parse(contentDataStr);
    }
  } catch(e) {
    throw new Error("Erreur de format du contenu du magazine");
  }

  const { error } = await supabaseServer.from('magazines').insert([{
    title,
    description,
    type,
    cover_image_url,
    content_data
  }]);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/magazines');
  revalidatePath('/magazine');
  return { success: true };
}

export async function deleteMagazine(id) {
  const { getUserProfile } = await import('@/utils/supabase/auth');
  const { createClient } = await import('@/utils/supabase/server');
  
  const profile = await getUserProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Error("Non autorisé");
  }

  const supabaseServer = await createClient();
  const { error } = await supabaseServer.from('magazines').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
  
  revalidatePath('/admin/magazines');
  revalidatePath('/magazine');
  return { success: true };
}

export async function updateMagazine(id, formData) {
  const { getUserProfile } = await import('@/utils/supabase/auth');
  const { createClient } = await import('@/utils/supabase/server');
  
  const profile = await getUserProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Error("Non autorisé");
  }

  const supabaseServer = await createClient();
  
  const title = formData.get('title');
  const description = formData.get('description');
  let cover_image_url = formData.get('cover_image_url');
  
  const imageFile = formData.get('image_file');
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `cover_${Date.now()}.${fileExt}`;
    const filePath = `magazines/${fileName}`;

    const { error: uploadError } = await supabaseServer.storage
      .from('media')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw new Error("Erreur lors de l'upload de la couverture");

    const { data: publicUrlData } = supabaseServer.storage
      .from('media')
      .getPublicUrl(filePath);

    cover_image_url = publicUrlData.publicUrl;
  }
  
  const contentDataStr = formData.get('content_data');
  let content_data = [];
  try {
    if (contentDataStr) {
      content_data = JSON.parse(contentDataStr);
    }
  } catch(e) {
    throw new Error("Erreur de format du contenu du magazine");
  }

  const payload = {
    title,
    description,
    content_data
  };
  
  if (cover_image_url) {
    payload.cover_image_url = cover_image_url;
  }

  const { error } = await supabaseServer
    .from('magazines')
    .update(payload)
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  const { revalidatePath } = await import('next/cache');
  revalidatePath('/admin/magazines');
  revalidatePath('/magazine');
  revalidatePath(`/magazine/${id}`);
  return { success: true };
}
