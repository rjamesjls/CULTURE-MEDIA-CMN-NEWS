import { createClient } from '@/utils/supabase/server';
import RevuePresseGenerator from './RevuePresseGenerator';

export const revalidate = 0;

export default async function RevuePressePage() {
  const supabase = await createClient();

  const { data: recentArticles } = await supabase
    .from('articles')
    .select('id, title, image_url')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div>
      <RevuePresseGenerator recentArticles={recentArticles || []} />
    </div>
  );
}
