'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function ArbitreClient({ match, players, initialEvents, tokenId }) {
  const [events, setEvents] = useState(initialEvents);
  const [homeScore, setHomeScore] = useState(match.home_score || 0);
  const [awayScore, setAwayScore] = useState(match.away_score || 0);
  const [matchStatus, setMatchStatus] = useState(match.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Event form state
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [eventType, setEventType] = useState('goal');
  const [minute, setMinute] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [details, setDetails] = useState('');

  const supabase = createClient();

  useEffect(() => {
    // Realtime subscription to match updates (in case another admin edits it)
    const channel = supabase.channel(`match_${match.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${match.id}` }, (payload) => {
        if (payload.new) {
          setHomeScore(payload.new.home_score);
          setAwayScore(payload.new.away_score);
          setMatchStatus(payload.new.status);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_events', filter: `match_id=eq.${match.id}` }, (payload) => {
        // Simple append, actual implementation might need to fetch full player data again or join
        // For simplicity, we just trigger a refresh or handle it
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match.id, supabase]);

  const updateMatchStatus = async (newStatus) => {
    setIsSubmitting(true);
    await supabase.from('matches').update({ status: newStatus }).eq('id', match.id);
    setMatchStatus(newStatus);
    
    // If finished, we could optionally invalidate the token
    if (newStatus === 'finished') {
       await supabase.from('referee_tokens').update({ is_used: true }).eq('token', tokenId);
    }
    
    setIsSubmitting(false);
  };

  const addEvent = async (e) => {
    e.preventDefault();
    if (!selectedTeamId || !minute || !eventType) return;
    
    setIsSubmitting(true);
    
    const newEvent = {
      match_id: match.id,
      team_id: selectedTeamId,
      player_id: playerId || null,
      event_type: eventType,
      minute: parseInt(minute),
      details: details
    };

    const { data, error } = await supabase.from('match_events').insert([newEvent]).select().single();

    if (!error && data) {
      // If it's a goal, auto-update the score
      if (eventType === 'goal') {
        let newHome = homeScore;
        let newAway = awayScore;
        if (selectedTeamId === match.home_team_id) {
          newHome += 1;
          setHomeScore(newHome);
        } else {
          newAway += 1;
          setAwayScore(newAway);
        }
        await supabase.from('matches').update({ home_score: newHome, away_score: newAway }).eq('id', match.id);
      }
      
      // We need to fetch the full event with player details for immediate display
      const { data: fullEvent } = await supabase.from('match_events').select('*, player:player_id(*)').eq('id', data.id).single();
      
      if (fullEvent) {
         setEvents([...events, fullEvent].sort((a, b) => a.minute - b.minute));
      }
      
      // Reset form
      setShowEventForm(false);
      setMinute('');
      setPlayerId('');
      setDetails('');
    }
    
    setIsSubmitting(false);
  };

  const getTeamPlayers = (teamId) => players.filter(p => p.team_id === teamId);

  return (
    <div className="p-4">
      {/* Header Info */}
      <div className="text-center mb-6">
         <h1 className="text-xl font-black text-white uppercase">{match.tournament?.name}</h1>
         <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{match.stage}</p>
      </div>

      {/* Scoreboard */}
      <div className="bg-[#12121A] border border-white/10 rounded-2xl p-6 mb-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-white/10 rounded-full mx-auto mb-2 flex items-center justify-center text-xl">🛡️</div>
            <div className="text-sm font-black text-white uppercase truncate">{match.home_team?.name}</div>
          </div>
          
          <div className="px-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="text-5xl font-black text-white">{homeScore}</div>
              <div className="text-2xl text-gray-500 font-bold">-</div>
              <div className="text-5xl font-black text-white">{awayScore}</div>
            </div>
            <div className="mt-2">
               {matchStatus === 'scheduled' && <button onClick={() => updateMatchStatus('ongoing')} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors">Démarrer le match</button>}
               {matchStatus === 'ongoing' && <button onClick={() => updateMatchStatus('finished')} disabled={isSubmitting} className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors animate-pulse">Terminer le match</button>}
               {matchStatus === 'finished' && <span className="bg-gray-500/20 text-gray-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">Match Terminé</span>}
            </div>
          </div>

          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-white/10 rounded-full mx-auto mb-2 flex items-center justify-center text-xl">🛡️</div>
            <div className="text-sm font-black text-white uppercase truncate">{match.away_team?.name}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {matchStatus === 'ongoing' && !showEventForm && (
        <button 
          onClick={() => { setShowEventForm(true); setSelectedTeamId(match.home_team_id); }}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-center mb-6 shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-transform flex justify-center items-center gap-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Ajouter un événement
        </button>
      )}

      {/* Add Event Form */}
      {showEventForm && (
        <div className="bg-[#12121A] border border-blue-500/50 rounded-2xl p-4 mb-6 relative overflow-hidden">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-white font-bold">Nouvel Événement</h3>
             <button onClick={() => setShowEventForm(false)} className="text-gray-400 hover:text-white p-2">✕</button>
           </div>
           
           <form onSubmit={addEvent} className="space-y-4">
             {/* Team Select */}
             <div className="flex gap-2 p-1 bg-black/50 rounded-lg">
               <button type="button" onClick={() => setSelectedTeamId(match.home_team_id)} className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${selectedTeamId === match.home_team_id ? 'bg-white/20 text-white' : 'text-gray-500'}`}>{match.home_team?.name}</button>
               <button type="button" onClick={() => setSelectedTeamId(match.away_team_id)} className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${selectedTeamId === match.away_team_id ? 'bg-white/20 text-white' : 'text-gray-500'}`}>{match.away_team?.name}</button>
             </div>
             
             {/* Event Type & Minute */}
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Type</label>
                 <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-3 text-white text-sm font-bold appearance-none">
                   <option value="goal">⚽ But</option>
                   <option value="yellow_card">🟨 Carton Jaune</option>
                   <option value="red_card">🟥 Carton Rouge</option>
                   <option value="sub_in">⬆️ Entrée</option>
                   <option value="sub_out">⬇️ Sortie</option>
                 </select>
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Minute</label>
                 <input type="number" value={minute} onChange={(e) => setMinute(e.target.value)} required min="1" max="150" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-3 text-white text-sm font-bold placeholder-gray-600" placeholder="Ex: 45" />
               </div>
             </div>
             
             {/* Player Select */}
             <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Joueur</label>
                <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-3 text-white text-sm font-bold appearance-none">
                  <option value="">-- Inconnu / Autre --</option>
                  {getTeamPlayers(selectedTeamId).map(p => (
                    <option key={p.id} value={p.id}>{p.number ? `${p.number} - ` : ''}{p.name}</option>
                  ))}
                </select>
             </div>
             
             <button type="submit" disabled={isSubmitting} className="w-full bg-white text-black font-black uppercase tracking-wider py-3 rounded-lg mt-2">
               {isSubmitting ? '...' : 'Valider'}
             </button>
           </form>
        </div>
      )}

      {/* Events Timeline */}
      <div>
         <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Fil du match</h3>
         {events.length === 0 ? (
           <div className="text-center py-8 bg-[#12121A] rounded-xl border border-white/5">
             <p className="text-gray-500 text-sm">Le match n'a pas encore commencé ou aucun événement n'a été saisi.</p>
           </div>
         ) : (
           <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-white/10">
             {events.map((event, idx) => {
               const isHome = event.team_id === match.home_team_id;
               return (
                 <div key={idx} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group ${isHome ? 'md:flex-row' : ''}`}>
                   {/* Icon marker */}
                   <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#0a0a0f] bg-black/50 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-lg">
                     {event.event_type === 'goal' ? '⚽' : event.event_type === 'yellow_card' ? '🟨' : event.event_type === 'red_card' ? '🟥' : event.event_type === 'sub_in' ? '⬆️' : '⬇️'}
                   </div>
                   
                   {/* Card */}
                   <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#12121A] border border-white/10 p-3 rounded-lg shadow flex flex-col relative z-10">
                     <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-white text-sm">{event.player?.name || 'Inconnu'}</span>
                        <span className="text-blue-400 font-black text-xs">{event.minute}'</span>
                     </div>
                     <span className="text-xs text-gray-500">{event.event_type === 'goal' ? 'But marqué' : event.details || ''}</span>
                   </div>
                 </div>
               );
             })}
           </div>
         )}
      </div>

    </div>
  );
}
