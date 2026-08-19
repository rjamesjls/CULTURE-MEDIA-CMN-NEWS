import React from 'react';

export default function PlayerStatsVisual({ tournament, players, events }) {
  // We need to pick a player to feature. For now, let's just pick the first top scorer or the first player if no events.
  const goalEvents = events.filter(e => e.event_type === 'goal' && e.player_id);
  const playerGoals = {};
  goalEvents.forEach(e => {
    playerGoals[e.player_id] = (playerGoals[e.player_id] || 0) + 1;
  });
  
  const topPlayerId = Object.keys(playerGoals).sort((a, b) => playerGoals[b] - playerGoals[a])[0];
  const featuredPlayer = players.find(p => p.id === topPlayerId) || players[0];

  if (!featuredPlayer) return <div className="text-white text-center">Aucun joueur disponible</div>;

  const goals = playerGoals[featuredPlayer.id] || 0;
  const yellowCards = events.filter(e => e.player_id === featuredPlayer.id && e.event_type === 'yellow_card').length;
  const redCards = events.filter(e => e.player_id === featuredPlayer.id && e.event_type === 'red_card').length;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
      {/* Header */}
      <div className="absolute top-16 left-16 right-16 flex justify-between items-start z-10">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-widest text-gray-300">{tournament?.name}</h2>
          <p className="text-xl font-bold text-gray-500 uppercase mt-1 tracking-widest">Focus Joueur</p>
        </div>
        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center text-4xl shadow-xl border border-white/20">
          🛡️
        </div>
      </div>

      <div className="flex items-center justify-between w-full max-w-5xl mt-16 z-10">
         {/* Player Name & Number */}
         <div className="flex-1">
            <div className="text-9xl font-black text-white/10 -ml-8 mb-4 leading-none">{featuredPlayer.number || '00'}</div>
            <h3 className="text-7xl font-black uppercase leading-none mb-2">{featuredPlayer.name.split(' ').slice(1).join(' ') || featuredPlayer.name}</h3>
            <h4 className="text-4xl font-bold text-gray-400 uppercase tracking-widest mb-8">{featuredPlayer.name.split(' ')[0] || ''}</h4>
            
            <div className="inline-block px-6 py-2 bg-blue-600 rounded-full text-lg font-black uppercase tracking-widest mb-12">
               {featuredPlayer.position || 'Attaquant'}
            </div>
            
            <div className="text-2xl font-bold text-gray-300 uppercase tracking-widest">
               {featuredPlayer.team?.name}
            </div>
         </div>
         
         {/* Stats Panel */}
         <div className="w-[400px] bg-black/60 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
            <div className="bg-white/5 rounded-2xl p-6 flex items-center justify-between border border-white/5">
              <div className="text-gray-400 font-bold uppercase tracking-widest">Buts Marqués</div>
              <div className="text-5xl font-black text-white flex items-center gap-3">
                 {goals} <span className="text-3xl">⚽</span>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-2xl p-6 flex items-center justify-between border border-white/5">
              <div className="text-gray-400 font-bold uppercase tracking-widest">Cartons Jaunes</div>
              <div className="text-4xl font-black text-white flex items-center gap-3">
                 {yellowCards} <span className="text-3xl drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">🟨</span>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-2xl p-6 flex items-center justify-between border border-white/5">
              <div className="text-gray-400 font-bold uppercase tracking-widest">Cartons Rouges</div>
              <div className="text-4xl font-black text-white flex items-center gap-3">
                 {redCards} <span className="text-3xl drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">🟥</span>
              </div>
            </div>
         </div>
      </div>
      
      {/* Decorative large player silhouette placeholder */}
      <div className="absolute right-0 bottom-0 w-1/2 h-[80%] opacity-20 bg-gradient-to-t from-blue-600 to-transparent pointer-events-none mix-blend-screen" style={{ maskImage: 'linear-gradient(to top, black, transparent)'}}></div>
    </div>
  );
}
