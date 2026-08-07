import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import MagazineViewer from './MagazineViewer';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: magazine } = await supabase
    .from('magazines')
    .select('title, description')
    .eq('id', id)
    .single();

  if (!magazine) return { title: 'Magazine Introuvable' };

  return {
    title: `${magazine.title} | Culture Media News`,
    description: magazine.description,
  };
}

export default async function MagazinePage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: magazine, error } = await supabase
    .from('magazines')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !magazine) {
    notFound();
  }

  let articlesData = [];

  // If dynamic or builder, fetch the related articles
  if (Array.isArray(magazine.content_data) && magazine.content_data.length > 0) {
    // Collect all article IDs to fetch
    const articleIds = magazine.content_data
      .filter(p => p.type === 'article' || typeof p === 'string')
      .map(p => p.articleId || p); // Fallback to string for old format

    if (articleIds.length > 0) {
      const { data: articles } = await supabase
        .from('articles')
        .select('id, title, content, image_url, category')
        .in('id', articleIds);
        
      if (articles) {
        articlesData = articles;
      }
    }
  }

  return (
    <MagazineViewer magazine={magazine} articlesData={articlesData} />
  );
}
