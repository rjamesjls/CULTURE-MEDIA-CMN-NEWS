import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/utils/supabase/auth';
import VisualsClient from './VisualsClient';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export default async function TournamentVisuals(props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const profile = await getUserProfile();
  const supabase = await createClient();
  const { id } = params;
  const matchId = searchParams?.match; // Optional pre-selected match

  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !tournament) {
    return notFound();
  }

  // Fetch all necessary data for all visuals
  const { data: teams } = await supabase
    .from('tournament_teams')
    .select(`*, team:teams(*)`)
    .eq('tournament_id', id);

  const { data: matches } = await supabase
    .from('matches')
    .select(`*, home_team:home_team_id(*), away_team:away_team_id(*)`)
    .eq('tournament_id', id)
    .order('match_date', { ascending: true });
    
  const { data: players } = await supabase
    .from('players')
    .select('*, team:team_id(*)')
    .in('team_id', (teams || []).map(t => t.team_id));

  const { data: events } = await supabase
    .from('match_events')
    .select(`*, player:player_id(*), match:match_id(*), team:team_id(*)`)
    .in('match_id', (matches || []).map(m => m.id));

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '50px' }}>
      <VisualsClient 
        tournament={tournament}
        teams={teams || []}
        matches={matches || []}
        players={players || []}
        events={events || []}
        initialMatchId={matchId}
        profile={profile}
      />
    </div>
  );
}
