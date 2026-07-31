import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/utils/supabase/auth';
import Link from 'next/link';
import ArticleList from './ArticleList';

export const revalidate = 0; // Don't cache admin pages

export default async function AdminArticles() {
  const profile = await getUserProfile();
  const supabase = await createClient();

  let query = supabase
    .from('articles')
    .select('id, title, category, pub_date, slug, image_url, user_id, content, status, author')
    .order('pub_date', { ascending: false });

  if (profile && profile.role === 'author') {
    query = query.eq('user_id', profile.id);
  }

  const { data: articles, error } = await query;
  const { data: categories } = await supabase.from('categories').select('*').order('name');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)' }}>Gestion des articles</h2>
        <Link href="/admin/articles/new" className="admin-btn admin-btn-primary">
          <i className="fas fa-plus"></i> Nouvel Article
        </Link>
      </div>

      {error ? (
        <p style={{ padding: '20px', color: 'red' }}>Erreur: {error.message}</p>
      ) : (
        <ArticleList initialArticles={articles || []} categories={categories || []} />
      )}
    </div>
  );
}
