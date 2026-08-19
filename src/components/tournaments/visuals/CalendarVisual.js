import React from 'react';

export default function CalendarVisual({ tournament, matches }) {
  // Sort and filter upcoming matches
  const upcomingMatches = [...matches]
    .filter(m => m.status === 'scheduled')
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

  return (
    <div className="absolute inset-0 flex flex-col items-center p-12 text-white">
      {/* Header */}
      <div className="mb-12 text-center mt-12">
        <h2 className="text-4xl font-black uppercase tracking-widest text-gray-300">{tournament?.name}</h2>
        <p className="text-6xl font-black text-white uppercase mt-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">Prochains Matchs</p>
      </div>

      {/* List */}
      <div className="w-full max-w-4xl space-y-6">
        {upcomingMatches.slice(0, 5).map((m, idx) => {
          const date = new Date(m.match_date);
          return (
            <div key={idx} className="bg-black/40 rounded-2xl p-6 border border-white/10 flex items-center justify-between shadow-xl relative overflow-hidden">
               {/* Date Badge */}
               <div className="bg-white/10 rounded-xl px-6 py-4 text-center border border-white/5">
                 <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">{date.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                 <div className="text-3xl font-black text-white">{date.getDate()}</div>
                 <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">{date.toLocaleDateString('fr-FR', { month: 'short' })}</div>
               </div>
               
               {/* Matchup */}
               <div className="flex-1 flex items-center justify-center gap-8">
                 <div className="flex items-center gap-4 w-64 justify-end">
                   <div className="text-2xl font-black uppercase text-right">{m.home_team?.name}</div>
                   <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-xl shrink-0">🛡️</div>
                 </div>
                 
                 <div className="text-gray-500 font-black text-2xl">VS</div>
                 
                 <div className="flex items-center gap-4 w-64 justify-start">
                   <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-xl shrink-0">🛡️</div>
                   <div className="text-2xl font-black uppercase text-left">{m.away_team?.name}</div>
                 </div>
               </div>
               
               {/* Time & Location */}
               <div className="text-right w-48">
                 <div className="text-3xl font-black text-white">{date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                 <div className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest truncate">{m.location || 'À définir'}</div>
               </div>
            </div>
          );
        })}
        {upcomingMatches.length === 0 && (
          <div className="text-center text-gray-400 text-2xl">Aucun match à venir</div>
        )}
      </div>
    </div>
  );
}
