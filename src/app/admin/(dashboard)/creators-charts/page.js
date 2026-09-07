import { getUserProfile } from '@/utils/supabase/auth';
import { redirect } from 'next/navigation';
import CreatorsChartsClient from './CreatorsChartsClient';

export const metadata = {
  title: 'Classements Créateurs - Admin | CULTURE MEDIA',
  description: 'Classement des tops créateurs de contenu sur TikTok et Instagram',
};

export default async function CreatorsChartsPage() {
  const profile = await getUserProfile();

  if (!profile) {
    redirect('/admin/login');
  }

  // Seul l'admin, redacteur_en_chef, ou responsable_youtube peuvent voir ça
  // Ici on laisse l'accès large pour l'admin
  if (profile.role !== 'admin' && profile.role !== 'redacteur_en_chef' && profile.role !== 'editeur' && profile.role !== 'journaliste') {
    redirect('/admin/unauthorized');
  }

  return (
    <div className="admin-page animate-fade-in pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Classements Créateurs</h1>
        <p className="text-gray-400 text-sm max-w-2xl">
          Suivez la croissance des influenceurs et créateurs de contenu sur TikTok et Instagram.
        </p>
      </div>
      <CreatorsChartsClient />
    </div>
  );
}
