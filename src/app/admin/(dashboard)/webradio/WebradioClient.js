'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function WebradioClient() {
  const [state, setState] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [uploading, setUploading] = useState(false);
  const [newTrack, setNewTrack] = useState({ title: '', artist: '', file: null, cover: null });
  
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    // Fetch state
    const { data: st } = await supabase.from('radio_state').select('*, radio_tracks(*)').eq('id', 1).single();
    if (st) setState(st);
    
    // Fetch tracks
    const { data: tr } = await supabase.from('radio_tracks').select('*').order('created_at', { ascending: false });
    if (tr) setTracks(tr);
    
    setIsLoading(false);
  };

  const toggleMode = async (newMode) => {
    await supabase.from('radio_state').update({ mode: newMode }).eq('id', 1);
    fetchData();
  };

  const updateLiveUrl = async (url) => {
    await supabase.from('radio_state').update({ live_url: url }).eq('id', 1);
    fetchData();
  };

  const forceNextTrack = async () => {
    await fetch('/api/radio/next', { method: 'POST' });
    fetchData();
  };

  const deleteTrack = async (id, audio_url) => {
    if (!confirm('Supprimer cette piste ?')) return;
    await supabase.from('radio_tracks').delete().eq('id', id);
    // Optionnel : supprimer le fichier du storage
    if (audio_url && !audio_url.startsWith('http')) {
      await supabase.storage.from('webradio').remove([audio_url]);
    }
    fetchData();
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newTrack.file || !newTrack.title || !newTrack.artist) return alert('Remplissez tous les champs requis');
    
    setUploading(true);
    try {
      const audioExt = newTrack.file.name.split('.').pop();
      const audioFileName = `tracks/${Date.now()}_${Math.random().toString(36).substring(7)}.${audioExt}`;
      
      // Upload audio
      const { error: uploadError } = await supabase.storage.from('webradio').upload(audioFileName, newTrack.file);
      if (uploadError) throw uploadError;

      // Get duration (hack : create object url and read duration)
      const durationMs = await new Promise((resolve) => {
        const audio = new Audio(URL.createObjectURL(newTrack.file));
        audio.onloadedmetadata = () => resolve(Math.round(audio.duration * 1000));
        audio.onerror = () => resolve(180000); // 3 minutes par défaut
      });

      let coverUrl = null;
      if (newTrack.cover) {
        const coverExt = newTrack.cover.name.split('.').pop();
        const coverFileName = `covers/${Date.now()}_${Math.random().toString(36).substring(7)}.${coverExt}`;
        await supabase.storage.from('webradio').upload(coverFileName, newTrack.cover);
        coverUrl = coverFileName;
      }

      await supabase.from('radio_tracks').insert({
        title: newTrack.title,
        artist: newTrack.artist,
        audio_url: audioFileName,
        cover_url: coverUrl,
        duration_ms: durationMs
      });

      setNewTrack({ title: '', artist: '', file: null, cover: null });
      fetchData();
    } catch (err) {
      alert('Erreur lors de l\'upload : ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-white">Chargement...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 text-white">
      <h1 className="text-3xl font-bold">Gestion de la Web Radio</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contrôle Direct / Auto */}
        <div className="bg-[#18153a] border border-[#2d295a] rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="fas fa-broadcast-tower text-purple-500"></i>
            Statut de la Radio
          </h2>
          
          <div className="flex gap-4">
            <button 
              onClick={() => toggleMode('auto')}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${state?.mode === 'auto' ? 'bg-purple-600 text-white' : 'bg-[#2d295a] text-gray-400 hover:bg-[#3d387a]'}`}
            >
              Mode Auto-DJ
            </button>
            <button 
              onClick={() => toggleMode('live')}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${state?.mode === 'live' ? 'bg-red-600 text-white animate-pulse' : 'bg-[#2d295a] text-gray-400 hover:bg-[#3d387a]'}`}
            >
              Mode Direct (Live)
            </button>
          </div>

          {state?.mode === 'live' && (
            <div className="space-y-2">
              <label className="text-sm text-gray-400">URL du flux direct (Icecast/HLS)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  defaultValue={state?.live_url || ''}
                  id="live_url_input"
                  placeholder="https://..."
                  className="flex-1 bg-[#0f0d26] border border-[#2d295a] rounded-lg px-4 py-2 outline-none"
                />
                <button 
                  onClick={() => updateLiveUrl(document.getElementById('live_url_input').value)}
                  className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-bold"
                >
                  Sauver
                </button>
              </div>
            </div>
          )}

          {state?.mode === 'auto' && state?.radio_tracks && (
            <div className="bg-[#0f0d26] p-4 rounded-lg flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden shrink-0">
                {state.radio_tracks.cover_url && (
                  <img 
                    src={state.radio_tracks.cover_url.startsWith('http') ? state.radio_tracks.cover_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/webradio/${state.radio_tracks.cover_url}`} 
                    alt="cover" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-green-400 mb-1 font-bold">EN COURS (AUTO)</p>
                <h3 className="font-bold truncate">{state.radio_tracks.title}</h3>
                <p className="text-sm text-gray-400 truncate">{state.radio_tracks.artist}</p>
              </div>
              <button onClick={forceNextTrack} className="bg-gray-700 hover:bg-gray-600 p-3 rounded-full" title="Passer à la piste suivante">
                <i className="fas fa-forward"></i>
              </button>
            </div>
          )}
        </div>

        {/* Upload */}
        <div className="bg-[#18153a] border border-[#2d295a] rounded-xl p-6">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <i className="fas fa-upload text-blue-500"></i>
            Ajouter une Musique (Auto-DJ)
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-gray-400">Titre</label>
                <input required type="text" value={newTrack.title} onChange={e => setNewTrack({...newTrack, title: e.target.value})} className="w-full bg-[#0f0d26] border border-[#2d295a] rounded-lg px-4 py-2 text-sm outline-none" />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-gray-400">Artiste</label>
                <input required type="text" value={newTrack.artist} onChange={e => setNewTrack({...newTrack, artist: e.target.value})} className="w-full bg-[#0f0d26] border border-[#2d295a] rounded-lg px-4 py-2 text-sm outline-none" />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Fichier Audio (MP3/WAV)</label>
              <input required type="file" accept="audio/*" onChange={e => setNewTrack({...newTrack, file: e.target.files[0]})} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-500" />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400">Pochette / Image (Optionnel)</label>
              <input type="file" accept="image/*" onChange={e => setNewTrack({...newTrack, cover: e.target.files[0]})} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-700 file:text-white hover:file:bg-gray-600" />
            </div>

            <button disabled={uploading} type="submit" className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 rounded-lg font-bold disabled:opacity-50 mt-4">
              {uploading ? 'Envoi en cours...' : 'Ajouter à la bibliothèque'}
            </button>
          </form>
        </div>
      </div>

      {/* Playlist */}
      <div className="bg-[#18153a] border border-[#2d295a] rounded-xl p-6">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
          <i className="fas fa-list-music text-pink-500"></i>
          Bibliothèque Musicale ({tracks.length})
        </h2>
        
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {tracks.map(track => (
            <div key={track.id} className={`flex items-center justify-between p-3 rounded-lg border ${state?.current_track_id === track.id ? 'bg-purple-900/30 border-purple-500/50' : 'bg-[#0f0d26] border-[#2d295a]'}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-800 rounded overflow-hidden shrink-0">
                  {track.cover_url && (
                    <img src={track.cover_url.startsWith('http') ? track.cover_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/webradio/${track.cover_url}`} alt="cover" className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-100">{track.title}</h4>
                  <p className="text-xs text-gray-400">{track.artist}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500 hidden sm:block">
                  {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                </span>
                <button onClick={() => deleteTrack(track.id, track.audio_url)} className="text-red-500 hover:text-red-400 p-2">
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
          {tracks.length === 0 && <p className="text-gray-400 text-center py-8">Aucune musique dans la bibliothèque.</p>}
        </div>
      </div>
    </div>
  );
}
