import React from 'react';

export default function LineupVisual({ match, tournament, players }) {
  if (!match) return <div className="text-white text-center">Aucun match sélectionné</div>;

  const homePlayers = players.filter(p => p.team_id === match.home_team_id);
  const awayPlayers = players.filter(p => p.team_id === match.away_team_id);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
      {/* Header */}
      <div className="mb-12 text-center z-10 relative">
        <h2 className="text-4xl font-black uppercase tracking-widest text-gray-300">{tournament?.name}</h2>
        <p className="text-xl font-bold text-gray-500 uppercase mt-2 tracking-widest">Composition des Équipes</p>
      </div>

      <div className="flex w-full max-w-5xl justify-between gap-12 z-10 relative">
        {/* Home Team */}
        <div className="flex-1 bg-black/40 rounded-3xl p-8 border border-white/10 backdrop-blur-md">
           <div className="flex items-center gap-4 mb-8 border-b border-white/20 pb-4">
             <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-2xl">🛡️</div>
             <h3 className="text-3xl font-black uppercase">{match.home_team?.name}</h3>
           </div>
           
           <div className="space-y-4">
             {homePlayers.length === 0 ? <p className="text-gray-500">Non renseignée</p> : homePlayers.slice(0, 11).map((p, idx) => (
               <div key={idx} className="flex items-center gap-4">
                 <span className="w-8 font-black text-gray-500 text-xl text-right">{p.number || '-'}</span>
                 <span className="font-bold text-xl uppercase">{p.name}</span>
               </div>
             ))}
           </div>
        </div>
        
        {/* VS */}
        <div className="flex flex-col items-center justify-center">
           <div className="text-6xl font-black text-gray-600/50 italic">VS</div>
        </div>

        {/* Away Team */}
        <div className="flex-1 bg-black/40 rounded-3xl p-8 border border-white/10 backdrop-blur-md">
           <div className="flex items-center justify-end gap-4 mb-8 border-b border-white/20 pb-4">
             <h3 className="text-3xl font-black uppercase text-right">{match.away_team?.name}</h3>
             <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-2xl">🛡️</div>
           </div>
           
           <div className="space-y-4">
             {awayPlayers.length === 0 ? <p className="text-gray-500 text-right">Non renseignée</p> : awayPlayers.slice(0, 11).map((p, idx) => (
               <div key={idx} className="flex items-center justify-end gap-4">
                 <span className="font-bold text-xl uppercase text-right">{p.name}</span>
                 <span className="w-8 font-black text-gray-500 text-xl text-left">{p.number || '-'}</span>
               </div>
             ))}
           </div>
        </div>
      </div>
      
      {/* Background field decorative */}
      <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
         <div className="w-[80%] h-[80%] border-4 border-white rounded-[100px] relative">
            <div className="absolute top-0 bottom-0 left-1/2 w-1 -translate-x-1/2 bg-white"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-4 border-white rounded-full"></div>
         </div>
      </div>
    </div>
  );
}
