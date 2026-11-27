import { redirect, notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export const revalidate = 60;

export default async function LocaleShortLinkPage(props) {
  const params = await props?.params;
  const lang = params?.lang || 'fr';
  const idOrSlug = params?.id;

  if (!idOrSlug) {
    notFound();
  }

  const isNumeric = /^\d+$/.test(idOrSlug);

  let query = supabase
    .from('articles')
    .select('id, slug')
    .limit(1);

  if (isNumeric) {
    query = query.eq('id', parseInt(idOrSlug, 10));
  } else {
    query = query.eq('slug', idOrSlug);
  }

  const { data: article, error } = await query.single();

  if (error || !article || !article.slug) {
    notFound();
  }

  redirect(`/${lang}/article/${article.slug}`);
}
