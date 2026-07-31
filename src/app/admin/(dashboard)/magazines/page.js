import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/utils/supabase/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import MagazineList from './MagazineList';

export const metadata = {
  title: 'Magazines | Admin - Culture Media News',
};

export default async function AdminMagazinesPage() {
  const profile = await getUserProfile();
  if (!profile || profile.role !== 'admin') {
    redirect('/');
  }

  const supabase = await createClient();
  const { data: magazines, error } = await supabase
    .from('magazines')
    .select('*')
    .order('publication_date', { ascending: false });

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="admin-page-title">Magazines Numériques</h1>
          <p className="admin-page-subtitle">Gérez vos publications avec effet page-flip (articles ou upload d'images).</p>
        </div>
        <Link href="/admin/magazines/new" className="admin-btn admin-btn-primary">
          <i className="fas fa-plus"></i> Nouveau Numéro
        </Link>
      </div>

      {error ? (
        <div className="admin-card" style={{ padding: '20px', color: '#b91c1c', backgroundColor: '#fef2f2' }}>
          <strong>Erreur :</strong> Impossible de charger les magazines. Avez-vous exécuté le script SQL dans Supabase ? ({error.message})
        </div>
      ) : (
        <MagazineList initialMagazines={magazines || []} />
      )}
    </div>
  );
}
