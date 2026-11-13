'use server';

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

function generateRandomCode() {
  // Génère un code à 6 chiffres
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateUniqueToken() {
  // 16 caractères hexadécimaux URL-safe
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Récupère les paramètres de partage privé d'un article
 */
export async function getArticlePrivateAccess(articleId) {
  const { getUserProfile } = await import('@/utils/supabase/auth');
  const profile = await getUserProfile();
  if (!profile) throw new Error('Non autorisé');

  const supabase = getAdminClient();
  const { data: article, error } = await supabase
    .from('articles')
    .select('id, title, status, slug, image_url, category, seo_metadata')
    .eq('id', articleId)
    .single();

  if (error || !article) {
    throw new Error('Article introuvable');
  }

  const privateAccess = article.seo_metadata?.private_access || null;

  return {
    success: true,
    article: {
      id: article.id,
      title: article.title,
      status: article.status,
      slug: article.slug,
      image_url: article.image_url,
      category: article.category,
      private_access: privateAccess,
    },
  };
}

/**
 * Active ou met à jour l'accès privé par code pour un article
 */
export async function savePrivateShare(articleId, {
  access_code,
  recipient_name = '',
  recipient_email = '',
  expiration_days = 0, // 0 = illimité
  is_private_only = true, // si vrai, l'article passe en status='private'
}) {
  const { getUserProfile } = await import('@/utils/supabase/auth');
  const profile = await getUserProfile();
  if (!profile) throw new Error('Non autorisé');

  const supabase = getAdminClient();

  const { data: article, error } = await supabase
    .from('articles')
    .select('id, title, status, seo_metadata')
    .eq('id', articleId)
    .single();

  if (error || !article) {
    throw new Error('Article introuvable');
  }

  const existingMeta = article.seo_metadata || {};
  const currentAccess = existingMeta.private_access || {};

  // Conserver le token existant ou en créer un nouveau
  const token = currentAccess.token || generateUniqueToken();
  const finalCode = (access_code && access_code.trim()) ? access_code.trim().toUpperCase() : (currentAccess.access_code || generateRandomCode());

  let expires_at = null;
  if (expiration_days && Number(expiration_days) > 0) {
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + Number(expiration_days));
    expires_at = expDate.toISOString();
  }

  const updatedPrivateAccess = {
    enabled: true,
    token,
    access_code: finalCode,
    recipient_name: recipient_name.trim(),
    recipient_email: recipient_email.trim(),
    is_private_only: !!is_private_only,
    expires_at,
    created_at: currentAccess.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    views_count: currentAccess.views_count || 0,
  };

  const newSeoMetadata = {
    ...existingMeta,
    private_access: updatedPrivateAccess,
  };

  const updatePayload = {
    seo_metadata: newSeoMetadata,
  };

  // Si l'option "accessible uniquement par code" est cochée et que l'article était publié,
  // on le bascule en status = 'private' pour qu'il n'apparaisse plus sur le site public
  if (is_private_only) {
    updatePayload.status = 'private';
  }

  const { error: updateError } = await supabase
    .from('articles')
    .update(updatePayload)
    .eq('id', articleId);

  if (updateError) {
    throw new Error('Erreur mise à jour article : ' + updateError.message);
  }

  revalidatePath('/admin/articles');
  revalidatePath('/admin/publication-center');
  revalidatePath('/');
  revalidatePath('/faits-divers');

  return {
    success: true,
    token,
    access_code: finalCode,
    expires_at,
    recipient_name: updatedPrivateAccess.recipient_name,
    recipient_email: updatedPrivateAccess.recipient_email,
    is_private_only: updatedPrivateAccess.is_private_only,
    views_count: updatedPrivateAccess.views_count,
  };
}

/**
 * Révoque ou désactive l'accès privé d'un article
 */
export async function revokePrivateShare(articleId) {
  const { getUserProfile } = await import('@/utils/supabase/auth');
  const profile = await getUserProfile();
  if (!profile) throw new Error('Non autorisé');

  const supabase = getAdminClient();

  const { data: article, error } = await supabase
    .from('articles')
    .select('id, status, seo_metadata')
    .eq('id', articleId)
    .single();

  if (error || !article) throw new Error('Article introuvable');

  const existingMeta = article.seo_metadata || {};
  const currentAccess = existingMeta.private_access || {};

  const updatedPrivateAccess = {
    ...currentAccess,
    enabled: false,
    revoked_at: new Date().toISOString(),
  };

  const updatePayload = {
    seo_metadata: {
      ...existingMeta,
      private_access: updatedPrivateAccess,
    },
  };

  // Si l'article était au statut 'private', on peut le repasser en 'draft' pour éviter qu'il soit orphelin
  if (article.status === 'private') {
    updatePayload.status = 'draft';
  }

  const { error: updateError } = await supabase
    .from('articles')
    .update(updatePayload)
    .eq('id', articleId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath('/admin/articles');
  revalidatePath('/admin/publication-center');
  revalidatePath('/');
  revalidatePath('/faits-divers');

  return { success: true };
}

/**
 * Génère un nouveau code aléatoire (helper)
 */
export async function getFreshRandomCode() {
  return { code: generateRandomCode() };
}
