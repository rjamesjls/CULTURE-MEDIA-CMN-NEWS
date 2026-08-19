import React from 'react';

export default function MatchResultVisual({ match, tournament, events }) {
  if (!match) return <div className="text-white text-center">Aucun match sélectionné</div>;

  const homeEvents = events.filter(e => e.team_id === match.home_team_id && e.event_type === 'goal');
  const awayEvents = events.filter(e => e.team_id === match.away_team_id && e.event_type === 'goal');

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
      {/* Header */}
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-black uppercase tracking-widest text-gray-300">{tournament?.name}</h2>
        <p className="text-xl font-bold text-gray-500 uppercase mt-2 tracking-widest">{match.stage}</p>
      </div>

      {/* Score */}
      <div className="flex items-center justify-center gap-16 w-full max-w-4xl mb-16">
        <div className="flex-1 flex flex-col items-center">
          <div className="w-40 h-40 bg-white/10 rounded-full mb-6 flex items-center justify-center text-6xl shadow-[0_0_50px_rgba(255,255,255,0.1)]">
             🛡️
          </div>
          <h3 className="text-5xl font-black uppercase text-center leading-tight">{match.home_team?.name}</h3>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="text-[140px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 drop-shadow-2xl">
            {match.home_score} - {match.away_score}
          </div>
          <div className="mt-4 px-6 py-2 bg-red-600 rounded-full text-sm font-black uppercase tracking-widest">
            {match.status === 'finished' ? 'Terminé' : 'Score Final'}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <div className="w-40 h-40 bg-white/10 rounded-full mb-6 flex items-center justify-center text-6xl shadow-[0_0_50px_rgba(255,255,255,0.1)]">
             🛡️
          </div>
          <h3 className="text-5xl font-black uppercase text-center leading-tight">{match.away_team?.name}</h3>
        </div>
      </div>

      {/* Scorers */}
      <div className="flex w-full max-w-4xl justify-between px-12">
        <div className="flex-1 text-left space-y-3">
          {homeEvents.map((e, i) => (
            <div key={i} className="text-2xl font-bold flex items-center gap-3">
              <span className="text-gray-400">{e.minute}'</span>
              <span>{e.player?.name || 'Inconnu'}</span>
              <span className="text-blue-500">⚽</span>
            </div>
          ))}
        </div>
        <div className="flex-1 text-right space-y-3">
          {awayEvents.map((e, i) => (
            <div key={i} className="text-2xl font-bold flex items-center justify-end gap-3">
              <span className="text-blue-500">⚽</span>
              <span>{e.player?.name || 'Inconnu'}</span>
              <span className="text-gray-400">{e.minute}'</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
