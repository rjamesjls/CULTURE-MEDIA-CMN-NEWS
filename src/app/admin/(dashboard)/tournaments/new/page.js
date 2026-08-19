import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/utils/supabase/auth';
import NewTournamentClient from './NewTournamentClient';

export const revalidate = 0;

export default async function NewTournament() {
  const profile = await getUserProfile();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '50px' }}>
      <NewTournamentClient profile={profile} />
    </div>
  );
}
