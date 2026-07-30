import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import ArticleForm from '../../ArticleForm';

export const revalidate = 0; // Don't cache admin pages

export const metadata = {
  title: 'Modifier l\'Article - Admin',
};

export default async function EditArticlePage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !article) {
    notFound();
  }

  const { data: categories } = await supabase.from('categories').select('*').order('name');

  return (
    <div>
      <h2 style={{ marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Modifier l'article</h2>
      <ArticleForm initialData={article} categories={categories || []} />
    </div>
  );
}
