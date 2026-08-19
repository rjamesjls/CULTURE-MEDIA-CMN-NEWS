import React from 'react';

export default function TopScorersVisual({ tournament, events }) {
  // Aggregate goals per player
  const goalEvents = events.filter(e => e.event_type === 'goal' && e.player_id);
  const playerGoals = {};
  
  goalEvents.forEach(e => {
    if (!playerGoals[e.player_id]) {
      playerGoals[e.player_id] = {
        player: e.player,
        team: e.team,
        goals: 0
      };
    }
    playerGoals[e.player_id].goals += 1;
  });

  const sortedScorers = Object.values(playerGoals).sort((a, b) => b.goals - a.goals);

  return (
    <div className="absolute inset-0 flex flex-col items-center p-12 text-white">
      {/* Header */}
      <div className="mb-12 text-center mt-12">
        <h2 className="text-4xl font-black uppercase tracking-widest text-gray-300">{tournament?.name}</h2>
        <p className="text-6xl font-black text-white uppercase mt-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">Meilleurs Buteurs</p>
      </div>

      {/* List */}
      <div className="w-full max-w-4xl grid grid-cols-2 gap-8">
        {sortedScorers.slice(0, 10).map((scorer, idx) => (
          <div key={idx} className={`bg-black/40 rounded-2xl p-6 border border-white/10 flex items-center gap-6 shadow-xl relative overflow-hidden ${idx === 0 ? 'bg-gradient-to-r from-yellow-600/30 to-transparent border-yellow-500/50' : ''}`}>
             <div className={`text-5xl font-black ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-700' : 'text-gray-600'}`}>
                #{idx + 1}
             </div>
             <div className="flex-1">
               <div className="font-black text-2xl uppercase">{scorer.player?.name}</div>
               <div className="text-gray-400 font-bold uppercase tracking-widest text-sm mt-1">{scorer.team?.name}</div>
             </div>
             <div className="text-5xl font-black text-white flex items-center gap-2">
               {scorer.goals} <span className="text-3xl text-gray-500">⚽</span>
             </div>
          </div>
        ))}
        {sortedScorers.length === 0 && (
          <div className="col-span-2 text-center text-gray-400 text-2xl">Aucun buteur enregistré</div>
        )}
      </div>
    </div>
  );
}
