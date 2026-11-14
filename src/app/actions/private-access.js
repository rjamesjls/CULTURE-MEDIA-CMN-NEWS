'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

/**
 * Récupère les données publiques/sécurisées de prévisualisation d'un article privé via son token.
 * NE RENVOIE PAS le contenu complet tant que le code n'est pas validé.
 */
export async function getPrivateArticlePreview(token) {
  if (!token) return { success: false, error: 'Token manquant.' };

  const supabase = getAdminClient();

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, title_bsh, description, hook_bsh, category, image_url, author, pub_date, seo_metadata, status')
    .filter('seo_metadata->private_access->>token', 'eq', token)
    .limit(1);

  if (error || !articles || articles.length === 0) {
    return { success: false, error: 'Article privé introuvable ou lien invalide.' };
  }

  const article = articles[0];
  const privateAccess = article.seo_metadata?.private_access;

  if (!privateAccess || privateAccess.enabled === false) {
    return { success: false, error: 'Ce lien privé a été désactivé par son auteur.' };
  }

  // Vérifier l'expiration éventuelle
  if (privateAccess.expires_at && new Date(privateAccess.expires_at) < new Date()) {
    return { success: false, error: 'Ce lien d\'accès privé a expiré.', isExpired: true };
  }

  // Vérifier si le visiteur a déjà déverrouillé l'article via son cookie
  const cookieStore = await cookies();
  const unlockedCookie = cookieStore.get(`pv_unlocked_${token}`)?.value;
  const isUnlocked = unlockedCookie === 'true' || unlockedCookie === privateAccess.access_code;

  let fullContent = null;
  if (isUnlocked) {
    const { data: fullArticle } = await supabase
      .from('articles')
      .select('content, content_bsh')
      .eq('id', article.id)
      .single();
    fullContent = fullArticle;
  }

  return {
    success: true,
    isUnlocked,
    article: {
      id: article.id,
      title: article.title,
      title_bsh: article.title_bsh,
      description: article.description,
      hook_bsh: article.hook_bsh,
      category: article.category,
      image_url: article.image_url,
      author: article.author,
      pub_date: article.pub_date,
      content: fullContent?.content || null,
      content_bsh: fullContent?.content_bsh || null,
      seo_metadata: article.seo_metadata || null,
      recipient_name: privateAccess.recipient_name || null,
      expires_at: privateAccess.expires_at || null,
    },
  };
}

/**
 * Valide le code de lecture fourni par le lecteur.
 * Si le code est valide, dépose un cookie HTTP-only et renvoie le contenu complet.
 */
export async function verifyPrivateAccessCode(token, code) {
  if (!token || !code) {
    return { success: false, error: 'Veuillez saisir votre code de lecture.' };
  }

  const supabase = getAdminClient();

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, title_bsh, description, hook_bsh, content, content_bsh, category, image_url, author, pub_date, seo_metadata')
    .filter('seo_metadata->private_access->>token', 'eq', token)
    .limit(1);

  if (error || !articles || articles.length === 0) {
    return { success: false, error: 'Article privé introuvable.' };
  }

  const article = articles[0];
  const privateAccess = article.seo_metadata?.private_access;

  if (!privateAccess || privateAccess.enabled === false) {
    return { success: false, error: 'Ce lien d\'accès a été désactivé.' };
  }

  if (privateAccess.expires_at && new Date(privateAccess.expires_at) < new Date()) {
    return { success: false, error: 'Ce lien d\'accès a expiré.' };
  }

  // Normalisation du code (suppression espaces, majuscules)
  const normalizedInput = code.toString().trim().toUpperCase();
  const normalizedStored = (privateAccess.access_code || '').toString().trim().toUpperCase();

  if (normalizedInput !== normalizedStored) {
    return { success: false, error: 'Code de lecture incorrect. Vérifiez le code qui vous a été transmis.' };
  }

  // Incrémenter le compteur de vues privées
  try {
    const updatedMetadata = {
      ...(article.seo_metadata || {}),
      private_access: {
        ...privateAccess,
        views_count: (privateAccess.views_count || 0) + 1,
        last_accessed_at: new Date().toISOString(),
      },
    };

    await supabase
      .from('articles')
      .update({ seo_metadata: updatedMetadata })
      .eq('id', article.id);
  } catch (err) {
    console.error('Erreur incrément vue privée:', err);
  }

  // Poser le cookie de session sécurisé
  const cookieStore = await cookies();
  cookieStore.set(`pv_unlocked_${token}`, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 jours
    path: '/',
  });

  return {
    success: true,
    article: {
      id: article.id,
      title: article.title,
      title_bsh: article.title_bsh,
      description: article.description,
      hook_bsh: article.hook_bsh,
      content: article.content,
      content_bsh: article.content_bsh,
      category: article.category,
      image_url: article.image_url,
      author: article.author,
      pub_date: article.pub_date,
      seo_metadata: article.seo_metadata || null,
    },
  };
}

/**
 * Verrouille à nouveau l'article en effaçant le cookie de déverrouillage.
 */
export async function lockPrivateArticle(token) {
  if (!token) return { success: false };
  const cookieStore = await cookies();
  cookieStore.delete(`pv_unlocked_${token}`);
  return { success: true };
}
