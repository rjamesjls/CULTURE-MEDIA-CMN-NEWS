'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function MatchDetailClient({ tournamentId, match, initialEvents, initialTokens, profile }) {
  const [events, setEvents] = useState(initialEvents);
  const [tokens, setTokens] = useState(initialTokens);
  const [loadingToken, setLoadingToken] = useState(false);

  const generateToken = async () => {
    setLoadingToken(true);
    const supabase = createClient();
    const token = crypto.randomUUID();
    
    // Set expiry to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data, error } = await supabase
      .from('referee_tokens')
      .insert([{
        match_id: match.id,
        token: token,
        expires_at: expiresAt.toISOString()
      }])
      .select()
      .single();

    if (!error && data) {
      setTokens([...tokens, data]);
    }
    setLoadingToken(false);
  };

  const copyTokenLink = (token) => {
    const link = `${window.location.origin}/arbitre/${token}`;
    navigator.clipboard.writeText(link);
    alert('Lien copié dans le presse-papier !');
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <Link href={`/admin/tournaments/${tournamentId}`} className="text-gray-400 hover:text-white text-sm flex items-center gap-2 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Retour au tournoi
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black font-heading text-white tracking-tight uppercase">Détail du Match</h1>
            <p className="text-gray-400 mt-1">{new Date(match.match_date).toLocaleString()} • {match.location || 'Lieu à définir'}</p>
          </div>
          <Link href={`/admin/tournaments/${tournamentId}/visuals?match=${match.id}`} className="admin-btn admin-btn-primary flex items-center gap-2">
            Visuels du Match
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score & Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#12121A] border border-white/10 rounded-xl p-8 flex items-center justify-between relative overflow-hidden">
             {/* Background blur effect */}
             <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-blue-600/30 to-purple-600/30 blur-3xl"></div>
             
             <div className="flex-1 text-center relative z-10">
                <div className="w-20 h-20 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">🛡️</div>
                <h2 className="text-2xl font-black text-white uppercase">{match.home_team?.name || 'Home Team'}</h2>
             </div>
             
             <div className="flex-1 text-center relative z-10 px-4">
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">{match.stage || 'Phase de groupe'}</div>
                <div className="text-6xl font-black text-white tracking-tighter">
                  {match.status === 'scheduled' ? 'VS' : `${match.home_score} - ${match.away_score}`}
                </div>
                <div className="mt-4">
                  <span className={`px-3 py-1 text-xs font-black tracking-widest uppercase rounded ${match.status === 'finished' ? 'bg-gray-500/20 text-gray-400' : match.status === 'ongoing' ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-blue-500/20 text-blue-400'}`}>
                    {match.status === 'finished' ? 'Terminé' : match.status === 'ongoing' ? 'En direct' : 'À venir'}
                  </span>
                </div>
             </div>
             
             <div className="flex-1 text-center relative z-10">
                <div className="w-20 h-20 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">🛡️</div>
                <h2 className="text-2xl font-black text-white uppercase">{match.away_team?.name || 'Away Team'}</h2>
             </div>
          </div>

          <div className="bg-[#12121A] border border-white/10 rounded-xl p-6">
             <h3 className="text-lg font-bold text-white mb-4">Événements du match</h3>
             {events.length === 0 ? (
               <p className="text-gray-500 text-center py-4">Aucun événement enregistré.</p>
             ) : (
               <div className="space-y-3">
                 {events.map((event, idx) => (
                   <div key={idx} className="flex items-center gap-4 bg-black/30 p-3 rounded-lg border border-white/5">
                     <div className="font-black text-blue-400 w-12">{event.minute}'</div>
                     <div className="text-xl">
                       {event.event_type === 'goal' ? '⚽' : event.event_type === 'yellow_card' ? '🟨' : '🟥'}
                     </div>
                     <div className="flex-1 text-white font-bold">
                       {event.player?.name || 'Joueur inconnu'}
                     </div>
                     <div className="text-sm text-gray-400">{event.details}</div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* Referee Access Panel */}
        <div className="space-y-6">
          <div className="bg-[#12121A] border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4v-4.257a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
              Accès Arbitre
            </h3>
            <p className="text-sm text-gray-400 mb-6">Générez un lien unique sécurisé pour permettre à l'arbitre de saisir le score et les événements en direct depuis son téléphone, sans avoir besoin de créer de compte.</p>
            
            <button 
              onClick={generateToken} 
              disabled={loadingToken}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 mb-6"
            >
              {loadingToken ? 'Génération...' : '+ Générer un nouveau lien'}
            </button>

            {tokens.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Liens générés</h4>
                {tokens.map((t, idx) => (
                  <div key={idx} className="bg-black/30 border border-white/5 p-3 rounded-lg flex items-center justify-between gap-3">
                    <div className="flex-1 truncate">
                      <div className="text-xs font-mono text-gray-300 truncate">{t.token}</div>
                      <div className={`text-[10px] uppercase font-bold mt-1 ${new Date(t.expires_at) < new Date() ? 'text-red-400' : 'text-green-400'}`}>
                        {new Date(t.expires_at) < new Date() ? 'Expiré' : 'Actif'}
                      </div>
                    </div>
                    <button onClick={() => copyTokenLink(t.token)} className="bg-white/10 hover:bg-white/20 p-2 rounded transition-colors text-white">
                      Copier
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
