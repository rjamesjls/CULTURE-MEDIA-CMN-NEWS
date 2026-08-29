import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/utils/supabase/auth';
import Link from 'next/link';
import NewsroomClient from './NewsroomClient';

export const revalidate = 0; // Don't cache admin pages

export default async function AdminArticles() {
  const profile = await getUserProfile();
  const supabase = await createClient();

  let query = supabase
    .from('articles')
    .select('id, title, category, pub_date, slug, image_url, user_id, content, status, author, views_count')
    .order('pub_date', { ascending: false });

  if (profile && profile.role === 'author') {
    query = query.eq('user_id', profile.id);
  }

  const { data: articles, error } = await query;
  const { data: categories } = await supabase.from('categories').select('*').order('name');
  const { data: ideas } = await supabase.from('content_ideas').select('*').order('created_at', { ascending: false });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '50px' }}>
      {error ? (
        <p style={{ padding: '20px', color: 'red' }}>Erreur: {error.message}</p>
      ) : (
        <NewsroomClient initialArticles={articles || []} articles={articles || []} categories={categories || []} ideas={ideas || []} profile={profile} />
      )}
    </div>
  );
}
