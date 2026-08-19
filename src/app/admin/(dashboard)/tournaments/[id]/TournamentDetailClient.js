'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function TournamentDetailClient({ tournament, initialTeams, initialMatches, profile }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [teams, setTeams] = useState(initialTeams);
  const [matches, setMatches] = useState(initialMatches);

  return (
    <div className="p-6">
      <div className="mb-8">
        <Link href="/admin/tournaments" className="text-gray-400 hover:text-white text-sm flex items-center gap-2 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Retour aux tournois
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2 py-1 text-[10px] font-black tracking-widest uppercase rounded ${tournament.status === 'ongoing' ? 'bg-green-500/20 text-green-400' : tournament.status === 'finished' ? 'bg-gray-500/20 text-gray-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {tournament.status === 'ongoing' ? 'En cours' : tournament.status === 'finished' ? 'Terminé' : 'Brouillon'}
              </span>
              <span className="text-gray-400 text-sm font-bold">{tournament.sport} • {tournament.season}</span>
            </div>
            <h1 className="text-4xl font-black font-heading text-white tracking-tight uppercase">{tournament.name}</h1>
          </div>
          <Link href={`/admin/tournaments/${tournament.id}/visuals`} className="admin-btn admin-btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Générer les Visuels
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 mb-6">
        {['overview', 'teams', 'matches', 'standings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            {tab === 'overview' ? 'Vue Générale' : tab === 'teams' ? 'Équipes' : tab === 'matches' ? 'Matchs' : 'Classement'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[#12121A] border border-white/10 rounded-xl p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-black/30 p-6 rounded-lg border border-white/5 text-center">
                <div className="text-4xl font-black text-white mb-1">{teams.length}</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Équipes Inscrites</div>
              </div>
              <div className="bg-black/30 p-6 rounded-lg border border-white/5 text-center">
                <div className="text-4xl font-black text-white mb-1">{matches.length}</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Matchs Programmés</div>
              </div>
              <div className="bg-black/30 p-6 rounded-lg border border-white/5 text-center">
                <div className="text-4xl font-black text-white mb-1">{matches.filter(m => m.status === 'finished').length}</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Matchs Joués</div>
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex gap-4 pt-4">
               <Link href={`/admin/tournaments/${tournament.id}/teams/add`} className="admin-btn flex-1 text-center py-3 bg-white/5 hover:bg-white/10">Gérer les Équipes</Link>
               <Link href={`/admin/tournaments/${tournament.id}/matches/new`} className="admin-btn flex-1 text-center py-3 bg-white/5 hover:bg-white/10">Nouveau Match</Link>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Équipes du tournoi</h2>
              <button className="text-blue-400 text-sm font-bold">+ Ajouter une équipe</button>
            </div>
            {teams.length === 0 ? (
              <p className="text-gray-500 py-4 text-center">Aucune équipe n'a été ajoutée à ce tournoi.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {teams.map((t, idx) => (
                  <div key={idx} className="bg-black/30 p-4 rounded-lg border border-white/5 text-center">
                    <div className="w-12 h-12 bg-white/10 rounded-full mx-auto mb-3 flex items-center justify-center text-xl">🛡️</div>
                    <div className="font-bold text-white text-sm">{t.team?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500 mt-1">Groupe {t.group_name || '-'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Calendrier des matchs</h2>
              <button className="text-blue-400 text-sm font-bold">+ Programmer un match</button>
            </div>
            {matches.length === 0 ? (
              <p className="text-gray-500 py-4 text-center">Aucun match n'est programmé.</p>
            ) : (
              <div className="space-y-3">
                {matches.map((m, idx) => (
                  <Link key={idx} href={`/admin/tournaments/${tournament.id}/matches/${m.id}`} className="block bg-black/30 p-4 rounded-lg border border-white/5 hover:border-white/20 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-xs font-bold text-gray-500 w-24">{new Date(m.match_date).toLocaleDateString()}</div>
                      <div className="flex-1 flex items-center justify-center gap-4">
                        <div className="text-right font-bold text-white flex-1">{m.home_team?.name || 'TBD'}</div>
                        <div className="bg-white/10 px-3 py-1 rounded font-black text-white">
                          {m.status === 'finished' ? `${m.home_score} - ${m.away_score}` : 'VS'}
                        </div>
                        <div className="font-bold text-white flex-1">{m.away_team?.name || 'TBD'}</div>
                      </div>
                    </div>
                    <div className="w-32 text-right">
                       <span className={`px-2 py-1 text-[9px] font-black tracking-widest uppercase rounded ${m.status === 'finished' ? 'bg-gray-500/20 text-gray-400' : m.status === 'ongoing' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                         {m.status === 'finished' ? 'Terminé' : m.status === 'ongoing' ? 'En direct' : 'À venir'}
                       </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'standings' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Classement</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Pos</th>
                    <th className="py-3 px-4">Équipe</th>
                    <th className="py-3 px-4 text-center">MJ</th>
                    <th className="py-3 px-4 text-center">V</th>
                    <th className="py-3 px-4 text-center">N</th>
                    <th className="py-3 px-4 text-center">D</th>
                    <th className="py-3 px-4 text-center">DB</th>
                    <th className="py-3 px-4 text-center text-white">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.sort((a, b) => b.points - a.points || (b.goals_for - b.goals_against) - (a.goals_for - a.goals_against)).map((t, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 font-bold text-white">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-white">{t.team?.name || 'Unknown'}</td>
                      <td className="py-3 px-4 text-center text-gray-400">{t.played}</td>
                      <td className="py-3 px-4 text-center text-gray-400">{t.won}</td>
                      <td className="py-3 px-4 text-center text-gray-400">{t.drawn}</td>
                      <td className="py-3 px-4 text-center text-gray-400">{t.lost}</td>
                      <td className="py-3 px-4 text-center text-gray-400">{t.goals_for - t.goals_against > 0 ? '+' : ''}{t.goals_for - t.goals_against}</td>
                      <td className="py-3 px-4 text-center font-black text-white">{t.points}</td>
                    </tr>
                  ))}
                  {teams.length === 0 && (
                     <tr><td colSpan="8" className="py-8 text-center text-gray-500">Aucune donnée disponible</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
