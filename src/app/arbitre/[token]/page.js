import { createClient } from '@/utils/supabase/server';
import ArbitreClient from './ArbitreClient';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export default async function ArbitrePage(props) {
  const params = await props.params;
  const supabase = await createClient();
  const { token } = params;

  // Validate token
  const { data: tokenData, error: tokenError } = await supabase
    .from('referee_tokens')
    .select('*')
    .eq('token', token)
    .single();

  if (tokenError || !tokenData) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 text-center">
         <h1 className="text-2xl font-black text-white mb-2 uppercase">Lien Invalide</h1>
         <p className="text-gray-400">Ce lien d'accès arbitre est invalide ou n'existe pas.</p>
      </div>
    );
  }

  if (new Date(tokenData.expires_at) < new Date() || tokenData.is_used) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 text-center">
         <h1 className="text-2xl font-black text-white mb-2 uppercase">Lien Expiré</h1>
         <p className="text-gray-400">Ce lien d'accès arbitre a expiré ou a déjà été utilisé pour clôturer le match.</p>
      </div>
    );
  }

  // Fetch match details
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select(`
      *,
      tournament:tournament_id(name, sport),
      home_team:home_team_id(*),
      away_team:away_team_id(*)
    `)
    .eq('id', tokenData.match_id)
    .single();

  if (matchError || !match) {
    return notFound();
  }

  // Fetch players for both teams
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .in('team_id', [match.home_team_id, match.away_team_id]);

  const { data: initialEvents } = await supabase
    .from('match_events')
    .select(`*, player:player_id(*)`)
    .eq('match_id', match.id)
    .order('minute', { ascending: true });

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="bg-[#12121A] border-b border-white/10 p-4 sticky top-0 z-50">
         <div className="flex justify-between items-center max-w-lg mx-auto">
           <img src="/backgrounds/cmn-corner-logo.png" alt="AFOLUKUTV" className="h-6" />
           <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Espace Arbitre</div>
         </div>
      </div>
      <div className="max-w-lg mx-auto pb-24">
        <ArbitreClient 
          match={match} 
          players={players || []} 
          initialEvents={initialEvents || []}
          tokenId={tokenData.token}
        />
      </div>
    </div>
  );
}
