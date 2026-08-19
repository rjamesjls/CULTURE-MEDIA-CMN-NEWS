import React from 'react';

export default function MatchPosterVisual({ match, tournament }) {
  if (!match) return <div className="text-white text-center">Aucun match sélectionné</div>;

  const date = new Date(match.match_date);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white bg-gradient-to-t from-black via-transparent to-black">
      {/* Background image placeholder - in a real app this would be an active background */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518605368461-1e1e38ce8e65?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay pointer-events-none"></div>
      
      {/* Header */}
      <div className="mb-auto mt-8 text-center z-10 relative">
        <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-white/80">{tournament?.name}</h2>
        <div className="mt-4 px-6 py-1 bg-red-600 inline-block rounded-sm text-sm font-black uppercase tracking-widest">
           {match.stage || 'Match Officiel'}
        </div>
      </div>

      {/* Matchup */}
      <div className="flex items-center justify-center gap-12 w-full max-w-5xl z-10 relative my-16">
        <div className="flex-1 flex flex-col items-center">
          <div className="w-64 h-64 bg-black/60 backdrop-blur-md rounded-3xl mb-8 flex items-center justify-center text-8xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 transform -rotate-6">
             🛡️
          </div>
          <h3 className="text-5xl font-black uppercase text-center leading-tight drop-shadow-2xl">{match.home_team?.name}</h3>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="text-7xl font-black italic text-red-500 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">VS</div>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <div className="w-64 h-64 bg-black/60 backdrop-blur-md rounded-3xl mb-8 flex items-center justify-center text-8xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 transform rotate-6">
             🛡️
          </div>
          <h3 className="text-5xl font-black uppercase text-center leading-tight drop-shadow-2xl">{match.away_team?.name}</h3>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-auto mb-8 w-full max-w-3xl bg-white text-black p-8 rounded-2xl flex items-center justify-between z-10 relative shadow-2xl transform skew-x-[-5deg]">
         <div className="flex-1 text-center border-r-2 border-black/10">
           <div className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">Date</div>
           <div className="text-3xl font-black uppercase">{date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
         </div>
         <div className="flex-1 text-center border-r-2 border-black/10">
           <div className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">Heure</div>
           <div className="text-3xl font-black uppercase">{date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
         </div>
         <div className="flex-1 text-center">
           <div className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">Stade</div>
           <div className="text-2xl font-black uppercase truncate px-2">{match.location || 'À définir'}</div>
         </div>
      </div>
    </div>
  );
}
