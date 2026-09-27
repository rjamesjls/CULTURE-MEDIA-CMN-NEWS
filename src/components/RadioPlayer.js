'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function RadioPlayer() {
  const [radioState, setRadioState] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const audioRef = useRef(null);
  const supabase = createClient();
  const nextTrackTimeout = useRef(null);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/radio/state');
      const data = await res.json();
      if (data.success) {
        setRadioState(data.state);
        syncPlayback(data.state);
      }
    } catch (e) {
      console.error("Erreur chargement radio", e);
    }
  };

  const syncPlayback = (state) => {
    if (!audioRef.current || !state) return;

    if (state.mode === 'live' && state.live_url) {
      audioRef.current.src = state.live_url;
      if (isPlaying) audioRef.current.play().catch(console.error);
      return;
    }

    if (state.mode === 'auto' && state.radio_tracks?.audio_url) {
      const audioUrl = state.radio_tracks.audio_url;
      // Convert to full URL if it's just a path
      const fullUrl = audioUrl.startsWith('http') 
        ? audioUrl 
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/webradio/${audioUrl}`;
        
      if (audioRef.current.src !== fullUrl) {
        audioRef.current.src = fullUrl;
      }
      
      const startedAt = new Date(state.track_started_at).getTime();
      const now = Date.now();
      let offsetSec = (now - startedAt) / 1000;
      
      // If we are slightly ahead of start time (due to clock skew), just play from 0
      if (offsetSec < 0) offsetSec = 0;
      
      const durationSec = state.radio_tracks.duration_ms / 1000;
      
      if (offsetSec < durationSec) {
        audioRef.current.currentTime = offsetSec;
        if (isPlaying) audioRef.current.play().catch(console.error);
        
        // Schedule next track
        clearTimeout(nextTrackTimeout.current);
        const remainingMs = (durationSec - offsetSec) * 1000;
        nextTrackTimeout.current = setTimeout(requestNextTrack, remainingMs);
      } else {
        // Track already finished, request next immediately
        requestNextTrack();
      }
    }
  };

  const requestNextTrack = async () => {
    try {
      await fetch('/api/radio/next', { method: 'POST' });
    } catch (e) {
      console.error("Erreur next track", e);
    }
  };

  useEffect(() => {
    fetchState();

    const channel = supabase
      .channel('radio_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'radio_state' }, (payload) => {
        fetchState(); // Re-fetch to get nested track info
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(nextTrackTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Re-sync before playing if auto
      if (radioState?.mode === 'auto') {
        syncPlayback(radioState);
      }
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error("Play error", e));
    }
  };

  if (!radioState || (radioState.mode === 'auto' && !radioState.radio_tracks) || (radioState.mode === 'live' && !radioState.live_url)) {
    return null; // Don't show player if nothing is playing
  }

  const title = radioState.mode === 'live' ? 'En Direct' : radioState.radio_tracks?.title;
  const artist = radioState.mode === 'live' ? 'Émission spéciale' : radioState.radio_tracks?.artist;
  let cover = radioState.mode === 'live' ? '/icon.png' : radioState.radio_tracks?.cover_url;
  
  if (cover && !cover.startsWith('http') && !cover.startsWith('/')) {
    cover = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/webradio/${cover}`;
  }
  if (!cover) cover = '/icon.png';

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${isMinimized ? 'translate-y-[calc(100%-40px)]' : 'translate-y-0'}`}>
      {/* Bouton pour minimiser/agrandir */}
      <div 
        onClick={() => setIsMinimized(!isMinimized)}
        className="absolute -top-8 right-4 bg-gray-900 text-white px-3 py-1 rounded-t-lg cursor-pointer hover:bg-gray-800 text-xs flex items-center gap-2"
      >
        <i className={`fas fa-chevron-${isMinimized ? 'up' : 'down'}`}></i>
        Web Radio
      </div>

      <div className="bg-gray-900 text-white shadow-[0_-5px_20px_rgba(0,0,0,0.5)] h-20 px-4 md:px-8 flex items-center justify-between border-t border-gray-800">
        <audio ref={audioRef} onEnded={() => radioState.mode === 'auto' && requestNextTrack()} />
        
        {/* Infos Musique */}
        <div className="flex items-center gap-4 w-1/3 min-w-[200px]">
          <div className="relative w-12 h-12 rounded bg-gray-800 overflow-hidden shrink-0 hidden sm:block">
            <img src={cover} alt={title} className="w-full h-full object-cover" />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                <div className="w-1 bg-white h-2 animate-[bounce_1s_infinite]"></div>
                <div className="w-1 bg-white h-4 animate-[bounce_1s_infinite_100ms]"></div>
                <div className="w-1 bg-white h-3 animate-[bounce_1s_infinite_200ms]"></div>
              </div>
            )}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              {radioState.mode === 'live' && (
                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">EN DIRECT</span>
              )}
              <h4 className="font-bold text-sm truncate">{title}</h4>
            </div>
            <p className="text-xs text-gray-400 truncate">{artist}</p>
          </div>
        </div>

        {/* Contrôles (Play/Pause) */}
        <div className="flex-1 flex justify-center w-1/3">
          <button 
            onClick={togglePlay}
            className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform"
          >
            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} ml-0.5`}></i>
          </button>
        </div>

        {/* Volume */}
        <div className="w-1/3 flex justify-end items-center gap-3 min-w-[100px]">
          <i className="fas fa-volume-up text-gray-400 text-sm hidden sm:block"></i>
          <input 
            type="range" 
            min="0" max="1" step="0.01" 
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer hidden sm:block accent-white"
          />
        </div>
      </div>
    </div>
  );
}
