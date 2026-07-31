import MagazineForm from '../../new/MagazineForm';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/utils/supabase/auth';
import { redirect, notFound } from 'next/navigation';

export const metadata = {
  title: 'Modifier le Magazine | Admin - Culture Media News',
};

export default async function EditMagazinePage({ params }) {
  const { id } = await params;
  
  const profile = await getUserProfile();
  if (!profile || profile.role !== 'admin') {
    redirect('/');
  }

  const supabase = await createClient();
  
  const { data: magazine, error } = await supabase
    .from('magazines')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error || !magazine) {
    notFound();
  }

  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, publication_date:pub_date, image_url')
    .eq('status', 'published')
    .order('pub_date', { ascending: false });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Modifier le magazine</h1>
        <p className="admin-page-subtitle">Modifiez le chemin de fer et les informations de ce numéro.</p>
      </div>

      <div className="admin-card">
        <MagazineForm articles={articles || []} initialData={magazine} />
      </div>
    </div>
  );
}
