import { Suspense } from 'react';
import AIGeneratorClient from './AIGeneratorClient';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/utils/supabase/auth';

export const revalidate = 0;

export default async function AIGeneratorPage() {
  const supabase = await createClient();
  const profile = await getUserProfile();

  let query = supabase
    .from('articles')
    .select('id, title, status, pub_date')
    .order('pub_date', { ascending: false });

  if (profile && profile.role === 'author') {
    query = query.eq('user_id', profile.id);
  }

  const { data: articles } = await query;

  return (
    <div className="admin-content-card">
      <div className="admin-header">
        <h1 className="admin-title">🤖 Générateur d'Articles IA</h1>
      </div>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        Donnez un sujet à l'intelligence artificielle. Elle parcourra ses connaissances et le web pour vous rédiger un brouillon structuré que vous pourrez ensuite ajuster ou publier.
      </p>

      <Suspense fallback={<div>Chargement de l'assistant IA...</div>}>
        <AIGeneratorClient articles={articles || []} />
      </Suspense>
    </div>
  );
}
