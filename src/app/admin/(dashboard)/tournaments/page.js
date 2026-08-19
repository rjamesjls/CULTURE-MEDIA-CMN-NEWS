import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/utils/supabase/auth';
import TournamentsClient from './TournamentsClient';

export const revalidate = 0; // Don't cache admin pages

export default async function AdminTournaments() {
  const profile = await getUserProfile();
  const supabase = await createClient();

  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '50px' }}>
      {error ? (
        <p style={{ padding: '20px', color: 'red' }}>Erreur: {error.message}</p>
      ) : (
        <TournamentsClient initialTournaments={tournaments || []} profile={profile} />
      )}
    </div>
  );
}
