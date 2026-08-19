import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

export default function ShortGeneratorModal({ isOpen, video, onClose }) {
  const [startTime, setStartTime] = useState(1);
  const [duration, setDuration] = useState(20);
  const [textOverlay, setTextOverlay] = useState('OUT NOW');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(300);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const playerRef = useRef(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setResultUrl(null);

    try {
      const response = await fetch('/api/shorts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: video.id,
          startTime: parseInt(startTime, 10),
          duration: parseInt(duration, 10),
          textOverlay,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.details ? `${data.error} : ${data.details}` : (data.error || 'Erreur lors de la génération');
        throw new Error(errorMessage);
      }

      setResultUrl(data.url);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseCurrentTime = () => {
    if (playerRef.current) {
      const time = Math.floor(playerRef.current.getCurrentTime());
      setStartTime(time);
    }
  };

  const handleSliderChange = (e) => {
    const time = parseInt(e.target.value, 10);
    setStartTime(time);
    if (playerRef.current) {
      playerRef.current.seekTo(time);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={() => {
          if (!isGenerating) onClose();
        }}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-[#0b0914] border border-[#2d295a] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-full">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2d295a] flex items-center justify-between bg-[#100d23]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-magic text-purple-500"></i> Générateur de Short
          </h2>
          <button 
            onClick={onClose}
            disabled={isGenerating}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* 2-Column Grid */}
        <div className="flex flex-col lg:flex-row overflow-y-auto custom-scrollbar">
          
          {/* Left Column : Settings & Video Player */}
          <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-[#2d295a]">
            {video && (
              <div className="flex flex-col gap-6">
                
                {/* YouTube Player */}
                <div className="rounded-xl overflow-hidden border border-[#2d295a] bg-black aspect-video relative">
                  {mounted && (
                    <ReactPlayer 
                      ref={playerRef}
                      url={`https://youtube.com/watch?v=${video.id}`}
                      width="100%"
                      height="100%"
                      controls={true}
                      onProgress={(p) => setCurrentTime(p.playedSeconds)}
                      onDuration={(d) => setVideoDuration(d)}
                    />
                  )}
                </div>

                {/* Settings Form */}
                <div className="flex flex-col gap-5">
                  {/* Start Time */}
                  <div>
                    <label className="block text-sm font-bold text-gray-200 mb-2 flex justify-between items-center">
                      <span>Point de départ (secondes)</span>
                      <span className="text-purple-400 font-mono">{startTime}s</span>
                    </label>
                    <div className="flex items-center gap-4 mb-2">
                      <input 
                        type="range" 
                        min="0" 
                        max={Math.floor(videoDuration)} 
                        value={startTime} 
                        onChange={handleSliderChange}
                        className="flex-1 accent-purple-500 h-2 bg-[#18153a] rounded-lg appearance-none cursor-pointer"
                        disabled={isGenerating}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <i className="fas fa-info-circle"></i> Le moment où le short va commencer.
                      </p>
                      <button 
                        onClick={handleUseCurrentTime}
                        type="button"
                        className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs font-bold rounded-lg transition-colors border border-purple-500/30"
                      >
                        <i className="fas fa-crosshairs mr-1"></i> Utiliser le temps actuel ({Math.floor(currentTime)}s)
                      </button>
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-bold text-gray-200 mb-2">Durée du Short</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[20, 45, 60].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setDuration(val)}
                          disabled={isGenerating}
                          className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                            duration === val 
                              ? 'bg-purple-600/20 border-purple-500 text-purple-300' 
                              : 'bg-[#18153a] border-[#2d295a] text-gray-400 hover:border-purple-500/50 hover:text-gray-200'
                          }`}
                        >
                          {val} sec
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Overlay */}
                  <div>
                    <label className="block text-sm font-bold text-gray-200 mb-2">Texte d&apos;incrustation (Optionnel)</label>
                    <input 
                      type="text" 
                      value={textOverlay} 
                      onChange={(e) => setTextOverlay(e.target.value)}
                      placeholder="Ex: OUT NOW"
                      disabled={isGenerating}
                      className="w-full px-4 py-3 bg-[#18153a] border border-[#2d295a] rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">Sera affiché au centre de la vidéo.</p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
                      <i className="fas fa-exclamation-circle mt-0.5"></i> {error}
                    </div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || resultUrl !== null}
                    className="w-full mt-2 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <i className="fas fa-spinner fa-spin text-xl"></i>
                        Génération en cours (peut prendre une minute)...
                      </>
                    ) : resultUrl ? (
                      <>
                        <i className="fas fa-check text-xl"></i>
                        Génération Terminée
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic"></i>
                        Générer le Short ({duration}s)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column : Final Preview */}
          <div className="w-full lg:w-[400px] p-6 bg-[#0e0b1c] flex flex-col">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <i className="fas fa-mobile-alt"></i> Aperçu du rendu
            </h3>

            <div className="flex-1 flex flex-col items-center justify-center">
              {resultUrl ? (
                // Final Generated Video
                <div className="w-full max-w-[280px] flex flex-col gap-4 animate-in zoom-in-95">
                  <div className="w-full aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-[#18153a] relative">
                    <video src={resultUrl} controls className="w-full h-full object-contain" autoPlay loop playsInline />
                  </div>
                  <div className="flex gap-2">
                    <a 
                      href={resultUrl}
                      download
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <i className="fas fa-download"></i> Télécharger
                    </a>
                    <button 
                      onClick={() => setResultUrl(null)}
                      className="px-4 py-3 bg-[#18153a] hover:bg-[#2d295a] text-white border border-[#2d295a] rounded-xl font-bold transition-colors text-sm"
                    >
                      Refaire
                    </button>
                  </div>
                </div>
              ) : (
                // Live Template Preview
                <div className="w-full max-w-[280px] aspect-[9/16] bg-[#18153a] rounded-[2rem] overflow-hidden shadow-2xl border-[6px] border-[#2d295a] relative flex items-center justify-center">
                  {/* Simulated 9:16 crop of the thumbnail with gradient overlay */}
                  {video && (
                    <>
                      <img 
                        src={video.thumbnail} 
                        alt="Thumbnail Preview" 
                        className="absolute inset-0 w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40"></div>
                    </>
                  )}
                  
                  {/* Loading overlay */}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                      <i className="fas fa-spinner fa-spin text-4xl text-purple-500 mb-4"></i>
                      <p className="text-white font-bold animate-pulse">Encodage en cours...</p>
                      <p className="text-xs text-gray-400 mt-2 text-center px-4">Création de la vidéo, recadrage et ajout du texte.</p>
                    </div>
                  )}

                  {/* YouTube CTA */}
                  {!isGenerating && (
                    <div className="absolute top-12 w-full flex flex-col items-center justify-center gap-2 z-10">
                      <img src="/assets/youtube-logo.png" alt="YouTube" className="h-10 object-contain drop-shadow-lg" />
                      <span className="text-white text-[11px] font-black tracking-widest bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full uppercase border border-white/20 shadow-lg">
                        Disponible sur YouTube
                      </span>
                    </div>
                  )}

                  {/* Text Overlay Preview */}
                  {!isGenerating && textOverlay && textOverlay.trim().length > 0 && (
                    <div className="absolute z-10 w-full px-4 flex items-center justify-center">
                      <span 
                        className="text-white text-5xl font-black text-center uppercase tracking-tighter" 
                        style={{ 
                          fontFamily: 'Impact, "Montserrat Black", sans-serif',
                          textShadow: '0px 6px 16px rgba(0,0,0,0.9), 0px 2px 4px rgba(0,0,0,0.8)',
                          WebkitTextStroke: '2px rgba(0,0,0,0.8)'
                        }}
                      >
                        {textOverlay}
                      </span>
                    </div>
                  )}
                  
                  {/* UI Safe Zones Mockup (TikTok/Shorts style) */}
                  <div className="absolute right-3 bottom-20 flex flex-col gap-5 z-10">
                    <div className="flex flex-col items-center gap-1"><div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"><i className="fas fa-heart text-sm"></i></div><span className="text-[10px] text-white font-bold drop-shadow-md">12K</span></div>
                    <div className="flex flex-col items-center gap-1"><div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"><i className="fas fa-comment text-sm"></i></div><span className="text-[10px] text-white font-bold drop-shadow-md">45</span></div>
                    <div className="flex flex-col items-center gap-1"><div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"><i className="fas fa-share text-sm"></i></div><span className="text-[10px] text-white font-bold drop-shadow-md">Share</span></div>
                  </div>
                  <div className="absolute left-4 bottom-6 right-16 z-10">
                    <div className="h-4 w-3/4 bg-white/20 backdrop-blur-sm rounded-full mb-3"></div>
                    <div className="h-3 w-1/2 bg-white/20 backdrop-blur-sm rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
            
            {!resultUrl && (
              <p className="text-xs text-gray-500 text-center mt-6">
                L&apos;aperçu est généré à partir de la miniature de la vidéo. Le rendu final utilisera le vrai flux vidéo.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
