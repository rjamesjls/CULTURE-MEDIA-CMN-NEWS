import { supabase } from '@/lib/supabase';
import DashboardClient from './DashboardClient';

export default async function AdminDashboard() {
  // Fetch total count of articles and sum of views/likes
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('views_count, likes_count');

  let totalViews = 0;
  let totalLikes = 0;
  let totalArticles = 0;

  if (articles) {
    totalArticles = articles.length;
    articles.forEach(article => {
      totalViews += (article.views_count || 0);
      totalLikes += (article.likes_count || 0);
    });
  }

  // Fetch total count of comments
  const { count: totalComments, error: commentsError } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true });

  // Fetch 3 latest articles
  const { data: latestArticles, error: latestError } = await supabase
    .from('articles')
    .select('id, title, pub_date, image_url')
    .order('pub_date', { ascending: false })
    .limit(3);

  const initialStats = {
    totalArticles: totalArticles,
    totalViews: totalViews,
    totalLikes: totalLikes,
    totalComments: totalComments || 0
  };

  return (
    <DashboardClient 
      initialStats={initialStats} 
      latestArticles={latestArticles || []} 
    />
  );
}
