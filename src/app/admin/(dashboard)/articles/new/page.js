import { supabase } from '@/lib/supabase';
import ArticleForm from '../ArticleForm';

export const revalidate = 0;

export const metadata = {
  title: 'Nouvel Article - Admin',
};

export default async function NewArticlePage() {
  const { data: categories } = await supabase.from('categories').select('*').order('name');

  return (
    <div>
      <h2 style={{ marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Rédiger un nouvel article</h2>
      <ArticleForm categories={categories || []} />
    </div>
  );
}
