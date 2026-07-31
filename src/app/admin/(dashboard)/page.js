import { supabase } from '@/lib/supabase';
import DashboardClient from './DashboardClient';

export default async function AdminDashboard() {
  // Fetch total count of articles
  const { count: totalArticles, error: countError } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true });

  // Fetch 3 latest articles
  const { data: latestArticles, error: articlesError } = await supabase
    .from('articles')
    .select('id, title, pub_date, image_url')
    .order('pub_date', { ascending: false })
    .limit(3);

  const initialStats = {
    totalArticles: totalArticles || 0
  };

  return (
    <DashboardClient 
      initialStats={initialStats} 
      latestArticles={latestArticles || []} 
    />
  );
}
