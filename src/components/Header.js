import { headers } from 'next/headers';
import { supabase } from '@/lib/supabase';
import HeaderClient from './HeaderClient';

export default async function Header({ lang = 'fr' }) {
  // Récupération des menus de navigation
  const { data: menus } = await supabase
    .from('menus')
    .select('*')
    .eq('location', 'header')
    .order('position', { ascending: true });

  // Récupération du chemin actuel depuis le middleware pour SSR immédiat
  let initialArticle = null;
  try {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '';

    if (pathname.includes('/article/')) {
      const slug = pathname.split('/article/')[1]?.split('?')[0]?.split('#')[0];
      if (slug) {
        const { data: art } = await supabase
          .from('articles')
          .select('category, pub_date, seo_metadata')
          .eq('slug', slug)
          .single();
        if (art) {
          initialArticle = art;
        }
      }
    } else if (pathname.includes('/p/')) {
      const token = pathname.split('/p/')[1]?.split('?')[0]?.split('#')[0];
      if (token) {
        const { data: articles } = await supabase
          .from('articles')
          .select('category, pub_date, seo_metadata')
          .limit(50);
        const art = articles?.find(a => a.seo_metadata?.private_access?.token === token);
        if (art) {
          initialArticle = art;
        }
      }
    }
  } catch (err) {
    // Si headers() n'est pas disponible dans un contexte de pré-rendu statique
  }

  return (
    <HeaderClient 
      lang={lang} 
      menus={menus || []} 
      initialArticle={initialArticle} 
    />
  );
}
