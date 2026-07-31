import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import InstagramGenerator from './InstagramGenerator';

export const revalidate = 0; // Don't cache admin pages

export default async function InstagramGeneratorPage(props) {
  const params = await props.params;
  const supabase = await createClient();
  const { id } = params;

  let { data: article, error } = await supabase
    .from('articles')
    .select('id, title, category, pub_date, slug, image_url, user_id, content, instagram_state')
    .eq('id', id)
    .single();

  // Fallback si la migration SQL n'a pas été exécutée (la colonne instagram_state n'existe pas encore)
  if (error && error.code === '42703') { // 42703 = undefined_column
    const fallback = await supabase
      .from('articles')
      .select('id, title, category, pub_date, slug, image_url, user_id, content')
      .eq('id', id)
      .single();
    
    article = fallback.data;
    error = fallback.error;
    
    if (article) {
       article.instagram_state = null; // Mock state
    }
  }

  if (error || !article) {
    console.error('Error fetching article for Instagram generator:', error);
    notFound();
  }

  // Fetch the 20 most recent articles for the sidebar
  const { data: recentArticles } = await supabase
    .from('articles')
    .select('id, title, image_url')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div>
      <InstagramGenerator article={article} recentArticles={recentArticles || []} />
    </div>
  );
}
