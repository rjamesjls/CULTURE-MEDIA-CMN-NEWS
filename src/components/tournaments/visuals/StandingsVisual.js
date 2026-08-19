import React from 'react';

export default function StandingsVisual({ tournament, teams }) {
  const sortedTeams = [...teams].sort((a, b) => b.points - a.points || (b.goals_for - b.goals_against) - (a.goals_for - a.goals_against));

  return (
    <div className="absolute inset-0 flex flex-col items-center p-12 text-white">
      {/* Header */}
      <div className="mb-12 text-center mt-12">
        <h2 className="text-4xl font-black uppercase tracking-widest text-gray-300">{tournament?.name}</h2>
        <p className="text-6xl font-black text-white uppercase mt-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">Classement Officiel</p>
      </div>

      {/* Table */}
      <div className="w-full max-w-4xl bg-black/40 rounded-3xl p-8 border border-white/10 shadow-2xl backdrop-blur-sm">
        <div className="flex border-b-2 border-white/20 pb-4 mb-4 text-xl font-black uppercase tracking-widest text-gray-400">
          <div className="w-16 text-center">Pos</div>
          <div className="flex-1">Équipe</div>
          <div className="w-16 text-center">MJ</div>
          <div className="w-16 text-center">V</div>
          <div className="w-16 text-center">N</div>
          <div className="w-16 text-center">D</div>
          <div className="w-16 text-center">DB</div>
          <div className="w-20 text-center text-blue-400">Pts</div>
        </div>

        <div className="space-y-3">
          {sortedTeams.slice(0, 10).map((t, idx) => (
            <div key={idx} className={`flex items-center py-4 rounded-xl px-2 ${idx < 3 ? 'bg-gradient-to-r from-blue-600/20 to-transparent border-l-4 border-blue-500' : 'hover:bg-white/5'}`}>
              <div className="w-16 text-center font-black text-2xl">{idx + 1}</div>
              <div className="flex-1 flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">🛡️</div>
                <div className="font-bold text-2xl uppercase">{t.team?.name || 'Inconnu'}</div>
              </div>
              <div className="w-16 text-center text-xl text-gray-400 font-bold">{t.played}</div>
              <div className="w-16 text-center text-xl text-gray-400 font-bold">{t.won}</div>
              <div className="w-16 text-center text-xl text-gray-400 font-bold">{t.drawn}</div>
              <div className="w-16 text-center text-xl text-gray-400 font-bold">{t.lost}</div>
              <div className="w-16 text-center text-xl text-gray-400 font-bold">{t.goals_for - t.goals_against > 0 ? '+' : ''}{t.goals_for - t.goals_against}</div>
              <div className="w-20 text-center font-black text-3xl text-white">{t.points}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
