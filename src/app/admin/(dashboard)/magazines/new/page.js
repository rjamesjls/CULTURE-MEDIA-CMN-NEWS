import MagazineForm from './MagazineForm';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/utils/supabase/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Nouveau Magazine | Admin - A FOLUKU TV',
};

export default async function NewMagazinePage() {
  const profile = await getUserProfile();
  if (!profile || profile.role !== 'admin') {
    redirect('/');
  }

  const supabase = await createClient();
  
  // Fetch published articles to populate the dynamic choice list
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, publication_date:pub_date, image_url')
    .eq('status', 'published')
    .order('pub_date', { ascending: false });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Créer un nouveau magazine</h1>
        <p className="admin-page-subtitle">Remplissez les informations pour générer le magazine numérique.</p>
      </div>

      <div className="admin-card">
        <MagazineForm articles={articles || []} />
      </div>
    </div>
  );
}
