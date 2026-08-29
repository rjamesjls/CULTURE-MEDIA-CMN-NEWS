'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import html2canvas from 'html2canvas';

// Visual Components
import MatchResultVisual from '@/components/tournaments/visuals/MatchResultVisual';
import StandingsVisual from '@/components/tournaments/visuals/StandingsVisual';
import TopScorersVisual from '@/components/tournaments/visuals/TopScorersVisual';
import CalendarVisual from '@/components/tournaments/visuals/CalendarVisual';
import LineupVisual from '@/components/tournaments/visuals/LineupVisual';
import PlayerStatsVisual from '@/components/tournaments/visuals/PlayerStatsVisual';
import MatchPosterVisual from '@/components/tournaments/visuals/MatchPosterVisual';

export default function VisualsClient({ tournament, teams, matches, players, events, initialMatchId, profile }) {
  const [activeVisual, setActiveVisual] = useState('match-result');
  const [selectedMatch, setSelectedMatch] = useState(initialMatchId || (matches[0]?.id || ''));
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const element = document.getElementById('visual-preview-container');
    if (!element) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#0a0a0f', // Dark background by default
      });
      
      const link = document.createElement('a');
      link.download = `CMN_${tournament.name}_${activeVisual}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Erreur lors de l\'exportation');
    }
    setIsExporting(false);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <Link href={`/admin/tournaments/${tournament.id}`} className="text-gray-400 hover:text-white text-sm flex items-center gap-2 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Retour au tournoi
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black font-heading text-white tracking-tight uppercase">Studio Visuels</h1>
            <p className="text-gray-400 mt-1">{tournament.name}</p>
          </div>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="admin-btn admin-btn-primary flex items-center gap-2"
          >
            {isExporting ? 'Génération...' : 'Télécharger PNG'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Controls */}
        <div className="bg-[#12121A] border border-white/10 rounded-xl p-6 space-y-6 h-fit">
          <div>
            <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide">Type de visuel</h3>
            <div className="space-y-2">
              {[
                { id: 'match-result', label: 'Résultat de Match' },
                { id: 'match-poster', label: 'Affiche Avant-Match' },
                { id: 'standings', label: 'Classement' },
                { id: 'top-scorers', label: 'Meilleurs Buteurs' },
                { id: 'calendar', label: 'Calendrier' },
                { id: 'lineup', label: 'Composition' },
                { id: 'player-stats', label: 'Statistiques Joueur' }
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setActiveVisual(v.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeVisual === v.id ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {(activeVisual === 'match-result' || activeVisual === 'match-poster' || activeVisual === 'lineup') && (
            <div>
              <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide">Sélectionner un Match</h3>
              <select 
                value={selectedMatch}
                onChange={(e) => setSelectedMatch(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-bold"
              >
                {matches.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.home_team?.name} vs {m.away_team?.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-3 bg-black/50 border border-white/10 rounded-xl p-8 flex items-center justify-center overflow-x-auto">
           {/* This container will be captured by html2canvas */}
           <div id="visual-preview-container" className="w-[1080px] h-[1080px] bg-gradient-to-br from-[#0a0a0f] to-[#1a1a24] relative shadow-2xl overflow-hidden shrink-0" style={{ transform: 'scale(0.5)', transformOrigin: 'top center' }}>
             {/* Logo AFOLUKUTV Watermark */}
             <div className="absolute top-8 left-8 z-50">
               <img src="/backgrounds/cmn-corner-logo.png" alt="AFOLUKUTV" className="h-12 opacity-80" />
             </div>
             
             {/* Visual Content */}
             {activeVisual === 'match-result' && <MatchResultVisual match={matches.find(m => m.id === selectedMatch)} tournament={tournament} events={events} />}
             {activeVisual === 'match-poster' && <MatchPosterVisual match={matches.find(m => m.id === selectedMatch)} tournament={tournament} />}
             {activeVisual === 'standings' && <StandingsVisual tournament={tournament} teams={teams} />}
             {activeVisual === 'top-scorers' && <TopScorersVisual tournament={tournament} events={events} />}
             {activeVisual === 'calendar' && <CalendarVisual tournament={tournament} matches={matches} />}
             {activeVisual === 'lineup' && <LineupVisual match={matches.find(m => m.id === selectedMatch)} tournament={tournament} players={players} />}
             {activeVisual === 'player-stats' && <PlayerStatsVisual tournament={tournament} players={players} events={events} />}
             
             {/* Decorative Elements */}
             <div className="absolute bottom-0 left-0 w-full h-2 bg-blue-600"></div>
           </div>
        </div>
      </div>
    </div>
  );
}
