import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/utils/supabase/auth';
import TournamentDetailClient from './TournamentDetailClient';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export default async function TournamentDetail(props) {
  const params = await props.params;
  const profile = await getUserProfile();
  const supabase = await createClient();
  const { id } = params;

  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !tournament) {
    return notFound();
  }

  // Fetch related data
  const { data: teams } = await supabase
    .from('tournament_teams')
    .select(`
      *,
      team:teams(*)
    `)
    .eq('tournament_id', id);

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:home_team_id(*),
      away_team:away_team_id(*)
    `)
    .eq('tournament_id', id)
    .order('match_date', { ascending: true });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '50px' }}>
      <TournamentDetailClient 
        tournament={tournament} 
        initialTeams={teams || []} 
        initialMatches={matches || []}
        profile={profile} 
      />
    </div>
  );
}
