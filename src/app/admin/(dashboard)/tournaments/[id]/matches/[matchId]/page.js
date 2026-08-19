import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/utils/supabase/auth';
import MatchDetailClient from './MatchDetailClient';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export default async function MatchDetail(props) {
  const params = await props.params;
  const profile = await getUserProfile();
  const supabase = await createClient();
  const { id, matchId } = params;

  const { data: match, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:home_team_id(*),
      away_team:away_team_id(*)
    `)
    .eq('id', matchId)
    .single();

  if (error || !match) {
    return notFound();
  }

  const { data: events } = await supabase
    .from('match_events')
    .select(`
      *,
      player:player_id(*)
    `)
    .eq('match_id', matchId)
    .order('minute', { ascending: true });

  const { data: tokens } = await supabase
    .from('referee_tokens')
    .select('*')
    .eq('match_id', matchId);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '50px' }}>
      <MatchDetailClient 
        tournamentId={id}
        match={match} 
        initialEvents={events || []} 
        initialTokens={tokens || []}
        profile={profile} 
      />
    </div>
  );
}
