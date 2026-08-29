'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Film, Edit3, Clock, Trash2, Play, Image as ImageIcon, ArrowLeft } from 'lucide-react';

const whiteYtLogoSvgData = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 20" width="180" height="40" fill="%23FFFFFF"%3E%3Cpath d="M27.972 3.123A3.504 3.504 0 0 0 25.503.654C23.32 0 14.28 0 14.28 0s-9.04 0-11.223.654A3.504 3.504 0 0 0 .588 3.123C0 5.305 0 9.84 0 9.84s0 4.536.588 6.718a3.504 3.504 0 0 0 2.469 2.469c2.183.654 11.223.654 11.223.654s9.04 0 11.223-.654a3.504 3.504 0 0 0 2.469-2.469c.588-2.182.588-6.718.588-6.718s0-4.535-.588-6.718zM11.378 14.02V5.66l7.38 4.18-7.38 4.18z"/%3E%3Cpath d="M39.697 18.57h-3.141V8.406l-1.043.435v-1.74l3.826-1.565h.358v13.034zm8.047.153c-2.43 0-3.99-1.536-3.99-4.275 0-2.816 1.638-4.327 4.096-4.327 2.432 0 3.942 1.536 3.942 4.327 0 2.765-1.562 4.275-4.048 4.275zm.077-1.92c1.075 0 1.664-.973 1.664-2.407 0-1.408-.563-2.355-1.664-2.355-1.126 0-1.715.947-1.715 2.355 0 1.434.589 2.407 1.715 2.407zm10.297 1.767h-2.15v-1.126c-.461.768-1.28 1.28-2.15 1.28-.973 0-1.511-.486-1.511-1.638v-6.912h2.253v6.323c0 .589.205.845.691.845.563 0 .973-.41 1.152-.922V10.174h2.253v8.396zm5.732-8.396h-2.227v8.396h-2.253v-8.396h-2.227V8.406h6.707v1.768zm7.932 8.396h-2.15v-1.126c-.461.768-1.28 1.28-2.15 1.28-.973 0-1.511-.486-1.511-1.638v-6.912h2.253v6.323c0 .589.205.845.691.845.563 0 .973-.41 1.152-.922V10.174h2.253v8.396zm7.424 0h-2.15v-1.1c-.512.768-1.331 1.254-2.304 1.254-1.946 0-3.328-1.408-3.328-4.378 0-2.867 1.434-4.224 3.379-4.224.947 0 1.741.435 2.227 1.126V5.1h2.176v13.47zm-2.15-4.147c0-1.383-.563-2.33-1.639-2.33-1.075 0-1.664.922-1.664 2.33 0 1.408.563 2.33 1.664 2.33 1.076 0 1.639-.922 1.639-2.33zm7.68 0.437h-5.632c.077 1.126.794 1.946 1.971 1.946.845 0 1.511-.384 1.92-1.152l1.792.896c-.742 1.306-1.946 2.176-3.712 2.176-2.586 0-4.173-1.536-4.173-4.352 0-2.714 1.587-4.25 4.045-4.25 2.509 0 3.84 1.51 3.84 4.198v.538zm-2.15-1.638c-.025-1.024-.589-1.741-1.638-1.741-1.024 0-1.613.717-1.741 1.741h3.379z"/%3E%3C/svg%3E';


// --- CANVA-STYLE INLINE EDITING HELPER ---
const EditableSlideText = ({ text, onLineChange, lineIndex, style = {}, placeholder = 'Écrivez ici...' }) => {
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        const lines = (text || '').split('\n');
        lines[lineIndex] = e.currentTarget.innerText;
        onLineChange(lines.join('\n'));
      }}
      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } }}
      style={{
        outline: '1px dashed rgba(244,114,182,0.6)',
        outlineOffset: '2px',
        cursor: 'text',
        minWidth: '20px',
        display: 'inline-block',
        borderRadius: '3px',
        padding: '0 3px',
        ...style
      }}
      title="Cliquer pour éditer directement sur la vidéo"
    >
      {((text || '').split('\n')[lineIndex]) || placeholder}
    </span>
  );
};

export default function ReelsStudioClient() {
  const [sourceType, setSourceType] = useState('upload');
  const defaultMusicText = "UNE NOUVELLE SORTIE DE 'NOM DE L'ARTISTE'\nSONG TITLE\nNEW DROP\nDISPONIBLE SUR";
  const [slides, setSlides] = useState([
    { id: 1, type: 'video', media: null, text: defaultMusicText, duration: 10, transition: 'none' },
  ]);
  const [activeSlideId, setActiveSlideId] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimelineTime, setCurrentTimelineTime] = useState(0);
  const [logo, setLogo] = useState('culture-media');
  const [mention, setMention] = useState('');
  const [template, setTemplate] = useState('music-promo');
  const [videoFormat, setVideoFormat] = useState('reels'); // 'reels' (9:16) ou 'tv' (16:9)
  const [promoGradientColor, setPromoGradientColor] = useState('#0B132B');
  const [promoGradientOpacity, setPromoGradientOpacity] = useState(85); // % opacity // default black
  const [promoTopTextSize, setPromoTopTextSize] = useState(130);
  const [promoTopTextY, setPromoTopTextY] = useState(55); // percentage
  const [globalAudio, setGlobalAudio] = useState(null); // MP3/WAV background track URL
  const [artistVideos, setArtistVideos] = useState([]);
  const [artistName, setArtistName] = useState('');

  const activeSlide = slides.find(s => s.id === activeSlideId);

  // Initialize from URL parameters (shortcut from Charts)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const title = urlParams.get('title');
      const artist = urlParams.get('artist');
      if (artist) {
        setArtistName(artist);
        fetch(`/api/youtube/search?q=${encodeURIComponent(artist)}`)
          .then(res => res.json())
          .then(data => {
            if (data.videos) setArtistVideos(data.videos);
          })
          .catch(err => console.error("Error fetching artist videos:", err));
      }
      if (title) {
        setSlides([{ 
          id: 1, 
          type: 'video', 
          media: null, 
          text: `OUT NOW\n${title}\n${artist || ''}\nDISPONIBLE SUR YOUTUBE`, 
          duration: 15, 
          transition: 'none' 
        }]);
        setTemplate('music-promo');
      }
    }
  }, []);

  const totalDuration = slides.reduce((acc, s) => acc + (s.duration || 10), 0);

  useEffect(() => {
    let raf;
    let lastTime = performance.now();
    
    const loop = (now) => {
      if (isPlaying) {
        const dt = (now - lastTime) / 1000;
        setCurrentTimelineTime(prev => {
          let next = prev + dt;
          if (next > totalDuration) next = 0; // loop
          return next;
        });
      }
      lastTime = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, totalDuration]);

  const handleAddSlide = () => {
    const newId = slides.length > 0 ? Math.max(...slides.map(s => s.id)) + 1 : 1;
    setSlides([...slides, { id: newId, type: 'image', media: null, text: '', duration: 3, transition: 'none' }]);
    setActiveSlideId(newId);
  };

  const handleRemoveSlide = (id) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter(s => s.id !== id);
    setSlides(newSlides);
    if (activeSlideId === id) setActiveSlideId(newSlides[0].id);
  };

  const handleUpdateSlide = (id, updates) => {
    setSlides(slides.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    handleUpdateSlide(activeSlideId, { 
      media: url, 
      file: file, 
      type: file.type.startsWith('video/') ? 'video' : 'image' 
    });
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [outputVideo, setOutputVideo] = useState(null);
  const [progress, setProgress] = useState(0);

  // --- DRAW OVERLAYS FUNCTION (CANVAS) ---
  
// Helper to convert hex color to rgba string
const hex2rgbStr = (hex, opacity = 1) => {
  if (!hex || hex[0] !== '#') return `rgba(10, 17, 40, ${opacity})`;
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

  const drawOverlays = (ctx, slide, canvasWidth, canvasHeight, ytLogoImg = null) => {
    if (template === 'music-promo') {
      const hex2rgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16) || 0;
        const g = parseInt(hex.slice(3, 5), 16) || 0;
        const b = parseInt(hex.slice(5, 7), 16) || 0;
        return `${r},${g},${b}`;
      };
      
      const opacityFrac = (promoGradientOpacity || 85) / 100;

      // Background Gradient Overlay (Dynamic promoGradientColor)
      const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      grad.addColorStop(0, hex2rgbStr(promoGradientColor, 0.85 * opacityFrac));
      grad.addColorStop(0.5, hex2rgbStr(promoGradientColor, 0.45 * opacityFrac));
      grad.addColorStop(1, hex2rgbStr(promoGradientColor, 0.95 * opacityFrac));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const texts = slide.text ? slide.text.split('\n') : [];
      const subheader = texts[0] || "UNE NOUVELLE SORTIE DE 'NOM DE L'ARTISTE'";
      const songTitle = texts[1] || "SONG TITLE";
      const outNowText = texts[2] || "NEW DROP";
      const platformsText = texts[3] || "DISPONIBLE SUR YOUTUBE";

      // Top Subheader has been moved below the song title

      // White Border around Center Square Frame (Canvas Video Area)
      const frameSize = canvasWidth * 0.70;
      const frameX = (canvasWidth - frameSize) / 2;
      const frameY = 110;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 8;
      ctx.strokeRect(frameX, frameY, frameSize, frameSize);

      // Bottom Section: NEW DROP (JUSTE SOUS LE CADRE)
      const bottomStartY = frameY + frameSize + 120;
      ctx.font = '900 95px "Arial Black", Impact, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 20;
      ctx.fillText(outNowText.toUpperCase(), canvasWidth / 2, bottomStartY);
      ctx.shadowBlur = 0;

      // Bottom Section: SONG TITLE (JUSTE AU DESSUS DE LA DISPONIBILITE)
      const titleFontSize = promoTopTextSize || 64;
      const songTitleY = bottomStartY + 85;

      ctx.font = `900 ${titleFontSize}px "Arial Black", Impact, sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 20;

      const titleLines = songTitle.split(' ');
      let finalY = songTitleY;
      if (titleLines.length >= 2) {
        ctx.fillText(titleLines[0].toUpperCase(), canvasWidth / 2, songTitleY);
        ctx.fillText(titleLines.slice(1).join(' ').toUpperCase(), canvasWidth / 2, songTitleY + titleFontSize * 0.95);
        finalY = songTitleY + titleFontSize * 0.95;
      } else {
        ctx.fillText(songTitle.toUpperCase(), canvasWidth / 2, songTitleY);
      }
      ctx.shadowBlur = 0;

      // Artist Name (subheader) below song title
      const artistY = finalY + 35;
      ctx.font = '900 24px Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(subheader.toUpperCase(), canvasWidth / 2, artistY);

      const outNowY = artistY + 45;
      // Subtitle: DISPONIBLE SUR + Logo YouTube (découpé au millimètre 798x151)
      const rawDispText = texts[3] || "DISPONIBLE SUR";
      const dispText = (rawDispText.replace(/\bYOUTUBE\b/gi, '').trim() || "DISPONIBLE SUR").toUpperCase();
      ctx.font = '900 24px Arial, sans-serif';
      ctx.fillStyle = '#E2E8F0';

      const textWidth = ctx.measureText(dispText).width;
      let logoHeight = 40;
      let logoWidth = Math.round(logoHeight * 5.285); // 211px
      const gap = 16;
      let totalWidth = textWidth + gap + logoWidth;
      
      const maxTotalWidth = canvasWidth * 0.9;
      if (totalWidth > maxTotalWidth) {
        logoWidth = maxTotalWidth - textWidth - gap;
        logoHeight = Math.round(logoWidth / 5.285);
        totalWidth = maxTotalWidth;
      }
      
      const startX = (canvasWidth - totalWidth) / 2;

      ctx.textAlign = 'left';
      ctx.fillText(dispText, startX, outNowY + 60);

      if (ytLogoImg) {
        const logoY = outNowY + 60 - 12 - (logoHeight / 2);
        ctx.drawImage(ytLogoImg, startX + textWidth + gap, logoY, logoWidth, logoHeight);
      }  }
    // 3. MENTIONS
    if (mention && template !== 'music-promo') {
      const mSize = Math.round(canvasWidth * 0.032);
      ctx.font = `${mSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      const mx = canvasWidth / 2;
      const my = canvasHeight * 0.93;
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 5;
      ctx.fillText(mention, mx, my);
      ctx.shadowBlur = 0;
    }

    // 4. LOGO WATERMARK
    if (logo !== 'none') {
      const label = logo === 'culture-media' ? 'A FOLUKU TV' : 'AFOLUKUTV';
      const lSize = Math.round(canvasWidth * 0.028);
      ctx.font = `bold ${lSize}px Arial, sans-serif`;
      const lw = ctx.measureText(label).width;
      const lx = canvasWidth - lw - 28;
      const ly = 50;
      ctx.fillStyle = logo === 'cmn-white' ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.82)';
      ctx.fillRect(lx - 10, ly - lSize, lw + 20, lSize * 1.5);
      ctx.fillStyle = logo === 'cmn-white' ? '#000' : '#fff';
      ctx.textAlign = 'left';
      ctx.fillText(label, lx, ly);
    }
  };

  const handleGenerate = async () => {
    const slidesWithMedia = slides.filter(s => s.media);
    if (slidesWithMedia.length === 0) {
      alert('Importez au moins un fichier image ou vidéo dans vos slides avant de générer.');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setOutputVideo(null);

    try {
      const canvasWidth = videoFormat === 'reels' ? 1080 : 1920;
      const canvasHeight = videoFormat === 'reels' ? 1920 : 1080;
      const FPS = 30;

      const loadedMedia = await Promise.all(slidesWithMedia.map(slide => {
        return new Promise((resolve) => {
          if (!slide.media) return resolve({ slide, el: null });
          if (slide.type === 'video') {
            const v = document.createElement('video');
            v.crossOrigin = 'anonymous';
            v.muted = false; // We use Web Audio API to mix, user interaction allows unmuted play
            v.src = slide.media;
            v.onloadeddata = () => resolve({ slide, el: v });
            v.onerror = () => resolve({ slide, el: null });
            v.load();
          } else {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve({ slide, el: img });
            img.onerror = () => resolve({ slide, el: null });
            img.src = slide.media;
          }
        });
      }));

      // Preload Youtube Logo for Canvas
      const ytLogoImg = new Image();
      ytLogoImg.crossOrigin = 'anonymous';
      ytLogoImg.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"%3E%3Cpath fill="%23FF0000" d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/%3E%3C/svg%3E';
      await new Promise(r => { ytLogoImg.onload = r; ytLogoImg.onerror = r; });

      setProgress(10);

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');

      const canvasStream = canvas.captureStream(FPS);

      // -- AUDIO MIXING SETUP --
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();

      // Add background audio if exists
      let bgAudioEl = null;
      if (globalAudio) {
        bgAudioEl = new Audio(globalAudio);
        bgAudioEl.crossOrigin = 'anonymous';
        const bgSource = audioCtx.createMediaElementSource(bgAudioEl);
        bgSource.connect(dest);
        bgAudioEl.play().catch(e => console.warn('Could not play bg audio:', e));
      }

      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);

      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
        mimeType = 'video/webm;codecs=h264';
      }
      
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 2_500_000, 
      });

      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.start(50);

      for (let i = 0; i < loadedMedia.length; i++) {
        const { slide, el } = loadedMedia[i];
        const durationMs = (slide.duration || 3) * 1000;
        const startTime = performance.now();

        if (el && slide.type === 'video') {
          el.currentTime = slide.trimStart || 0;
          // Connect video audio to Web Audio if not muted
          if (!slide.muteOriginal && !el._audioConnected) {
            try {
              const source = audioCtx.createMediaElementSource(el);
              source.connect(dest);
              el._audioConnected = true;
            } catch (e) {
              console.warn("Could not connect video audio:", e);
            }
          }
          el.muted = slide.muteOriginal || false;
          await el.play().catch(e => console.warn('Could not play video:', e));
        }

        await new Promise(resolve => {
          let rafId;
          const loop = (now) => {
            const elapsed = now - startTime;
            if (elapsed >= durationMs) {
              cancelAnimationFrame(rafId);
              if (el && slide.type === 'video') el.pause();
              return resolve();
            }

            // Fill black background
            ctx.fillStyle = '#0b0914';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Draw Video/Image
            if (el) {
              const nw = el.videoWidth || el.naturalWidth;
              const nh = el.videoHeight || el.naturalHeight;
              if (nw && nh) {
                const scale = Math.max(canvasWidth / nw, canvasHeight / nh);
                const dw = nw * scale;
                const dh = nh * scale;
                const dx = (canvasWidth - dw) / 2;
                const dy = (canvasHeight - dh) / 2;
                ctx.drawImage(el, dx, dy, dw, dh);
              }
            }

            // Draw Overlays
            drawOverlays(ctx, slide, canvasWidth, canvasHeight, ytLogoImg);

            rafId = requestAnimationFrame(loop);
          };
          rafId = requestAnimationFrame(loop);
        });

        setProgress(10 + Math.round(((i + 1) / loadedMedia.length) * 85));
      }

      recorder.stop();
      await new Promise(resolve => { recorder.onstop = resolve; });
      setProgress(98);

      if (bgAudioEl) bgAudioEl.pause();
      audioCtx.close();

      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setOutputVideo(url);
      setProgress(100);

    } catch (err) {
      console.error('Erreur génération:', err);
      alert(`Erreur : ${err.message}`);
    }
    setIsGenerating(false);
  };

  return (
    <div className="bg-[#0b0914] -m-6 p-6 min-h-screen font-sans text-gray-200 flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-[#2d295a] pb-4">
        <div>
          <a href="/admin/charts" className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-1 text-sm font-medium transition-colors">
            <ArrowLeft size={16} /> Retour aux classements
          </a>
          <h1 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Film size={16} className="text-white" />
            </div>
            Reels Studio <span className="bg-blue-600 text-[10px] px-2 py-1 rounded-full uppercase tracking-wider ml-2">Pro Editor</span>
          </h1>
        </div>
        

      </div>

      {/* Main Workspace */}
      <div className="flex flex-col gap-6 flex-1 pb-10 w-full">
        
        {/* Top Section : Preview + Settings */}
        <div className="flex flex-col xl:flex-row gap-6 w-full justify-center">
          
          {/* Zone d'aperçu (Smartphone) */}
          <div className="flex-1 max-w-[800px] flex justify-center bg-[#100d23] rounded-3xl border border-[#242145] p-6 pt-10 items-start overflow-hidden min-h-[400px]">
            <div className="relative aspect-[9/16] h-full max-h-[700px] w-auto bg-black rounded-[40px] border-[8px] border-[#1f1c3d] shadow-2xl overflow-hidden flex-shrink-0 @container">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[30%] h-[3%] min-h-[16px] max-h-[24px] bg-[#1f1c3d] rounded-b-2xl z-20"></div>

            {outputVideo ? (
              <div className="w-full h-full relative">
                <video src={outputVideo} className="w-full h-full object-contain bg-black" controls autoPlay loop />
                <button onClick={() => setOutputVideo(null)} className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-sm border border-white/20">
                  <Edit3 size={12} className="inline mr-2" /> Retour Éditeur
                </button>
              </div>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center bg-[#18153a] overflow-hidden">
                {activeSlide?.media ? (
                  activeSlide.type === 'video' ? (
                    <video 
                      src={activeSlide.media} 
                      className="w-full h-full object-cover opacity-60" 
                      autoPlay 
                      muted={activeSlide.muteOriginal || false}
                      onTimeUpdate={(e) => {
                        const v = e.target;
                        const start = activeSlide.trimStart || 0;
                        const end = start + (activeSlide.duration || 10);
                        if (v.currentTime >= end || v.currentTime < start) {
                          v.currentTime = start;
                        }
                      }}
                    />
                  ) : (
                    <img src={activeSlide.media} className="w-full h-full object-cover opacity-60" alt="preview" />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <ImageIcon size={48} className="mb-4 opacity-50" />
                    <p className="text-sm font-medium">Aucun média</p>
                  </div>
                )}
                
                {/* CSS OVERLAYS SIMULATING CANVAS (PREVIEW ONLY) */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
                  {/* Music Promo Template Preview */}
              {template === 'music-promo' && (
                    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none" style={{ background: `linear-gradient(180deg, ${hex2rgbStr(promoGradientColor, (promoGradientOpacity || 85)/100)} 0%, ${hex2rgbStr(promoGradientColor, 0.4)} 50%, ${hex2rgbStr(promoGradientColor, (promoGradientOpacity || 85)/100)} 100%)` }}>
                      
                      {/* Top Header removed to place below song title */}

                      {/* Center Frame White Border (Wraps video area) */}
                      <div className="my-auto mx-auto w-[82%] aspect-square border-4 border-white rounded-lg shadow-2xl flex items-center justify-center relative overflow-hidden bg-black/20">
                        {!activeSlide?.media && (
                          <span className="text-white/60 font-bold text-xs">Artwork / Video Here</span>
                        )}
                      </div>

                      {/* Bottom Section: SONG TITLE, NEW DROP, DISPONIBLE SUR & LOGO */}
                      <div className="text-center pb-2 space-y-2 pt-5">
                        {/* NEW DROP (En plus gros) */}
                        <h3 className="text-white font-black text-3xl tracking-tighter uppercase leading-none drop-shadow-lg" style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}>
                          {activeSlide?.text?.split('\n')[2] || "NEW DROP"}
                        </h3>

                        <h2 className="text-white font-black uppercase leading-tight tracking-tight drop-shadow-md" style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: `${(promoTopTextSize || 64) * 0.32}px` }}>
                          {activeSlide?.text?.split('\n')[1] || "SONG TITLE"}
                        </h2>

                        {/* Artist Name */}
                        <p className="text-white text-[9px] font-black tracking-widest uppercase pb-1">
                          {activeSlide?.text?.split('\n')[0] || "UNE NOUVELLE SORTIE DE 'NOM DE L'ARTISTE'"}
                        </p>

                        {/* Subtitle / Platform Text: DISPONIBLE SUR + Logo YouTube */}
                        <div className="flex flex-col items-center gap-1 pt-3">
                          <span className="text-gray-200 text-xs font-black tracking-widest uppercase">
                            {(activeSlide?.text?.split('\n')[3] || "DISPONIBLE SUR").replace(/\bYOUTUBE\b/gi, '').trim() || "DISPONIBLE SUR"}
                          </span>
                          <img 
                            src="/youtube-user-logo.png" 
                            alt="YouTube" 
                            className="w-[60%] h-auto object-contain" 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Standard Text Preview */}
                  {template !== 'music-promo' && activeSlide?.text && (
                    <div className="absolute bottom-[20%] w-full flex justify-center px-4">
                      <span className={`px-4 py-2 text-white font-bold text-center leading-snug ${template === 'breaking' ? 'bg-red-600' : 'bg-black/70'}`}>
                        {activeSlide.text}
                      </span>
                    </div>
                  )}
                  
                  {/* Watermark Preview */}
                  {logo !== 'none' && (
                    <div className="absolute top-[40px] right-[10px]">
                      <span className={`px-2 py-1 text-[10px] font-bold ${logo === 'cmn-white' ? 'bg-white/90 text-black' : 'bg-black/80 text-white'}`}>
                        {logo === 'culture-media' ? 'A FOLUKU TV' : 'AFOLUKUTV'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          </div>

        {/* Colonne de Droite (Sidebar) : Paramètres */}
        <div className="w-full xl:w-[350px] flex-shrink-0 flex flex-col gap-6">
          
          {/* Actions : Générer & Télécharger */}
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleGenerate} 
              disabled={isGenerating} 
              className="w-full py-4 rounded-xl border-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden text-lg"
            >
              {isGenerating && (
                <div className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-300" style={{ width: `${progress}%` }} />
              )}
              <Play size={20} className={isGenerating ? "animate-pulse" : ""} />
              {isGenerating ? `Création... ${progress}%` : 'Générer la vidéo'}
            </button>
            
            <button 
              disabled={!outputVideo}
              onClick={() => {
                const a = document.createElement('a');
                a.href = outputVideo;
                a.download = `reels_studio_${Date.now()}.mp4`;
                a.click();
              }}
              className="w-full py-3 rounded-xl border border-[#2d295a] bg-[#18153a] hover:bg-[#242145] text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              <i className="fas fa-download"></i>
              Télécharger
            </button>
          </div>
          
          <div className="bg-[#100d23] border border-[#242145] p-6 rounded-3xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Edit3 size={18} className="text-blue-500" /> Paramètres Globaux
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">Template Design</label>
                <select 
                  value={template} 
                  onChange={(e) => setTemplate(e.target.value)} 
                  className="w-full bg-[#18153a] border border-[#2d295a] text-white rounded-xl p-3 outline-none focus:border-blue-500"
                >
                  <option value="music-promo">🔥 Sortie Musique (OUT NOW)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">Format</label>
                <select 
                  value={videoFormat} 
                  onChange={(e) => setVideoFormat(e.target.value)} 
                  className="w-full bg-[#18153a] border border-[#2d295a] text-white rounded-xl p-3 outline-none focus:border-blue-500"
                >
                  <option value="reels">Reels / Shorts (9:16)</option>
                  <option value="tv">TV / YouTube (16:9)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">Logo Filigrane</label>
                <select 
                  value={logo} 
                  onChange={(e) => setLogo(e.target.value)} 
                  className="w-full bg-[#18153a] border border-[#2d295a] text-white rounded-xl p-3 outline-none focus:border-blue-500"
                >
                  <option value="culture-media">A FOLUKU TV</option>
                  <option value="cmn-white">AFOLUKUTV (Blanc)</option>
                  <option value="cmn-black">AFOLUKUTV (Noir)</option>
                  <option value="none">Aucun</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-[#100d23] border border-[#242145] p-6 rounded-3xl flex-1">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Film size={18} className="text-purple-500" /> Éditer la Vidéo (Slide {activeSlideId})
            </h3>

            <div className="space-y-6">
              {/* Upload Button */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">Source du fichier</label>
                <label className="flex items-center justify-center gap-3 w-full p-6 border-2 border-dashed border-[#2d295a] bg-[#18153a] hover:bg-[#242145] hover:border-blue-500/50 rounded-2xl cursor-pointer transition-colors group">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{activeSlide?.media ? 'Remplacer le fichier' : 'Importer une vidéo'}</p>
                    <p className="text-gray-500 text-sm">MP4, WebM ou Images</p>
                  </div>
                  <input type="file" accept="video/*,image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              {/* Vidéos YouTube de l'artiste */}
              {artistVideos.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2">Vidéos de {artistName} (YouTube)</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {artistVideos.map(video => (
                      <div 
                        key={video.id} 
                        className="flex-shrink-0 w-32 cursor-pointer group"
                        onClick={() => {
                          const newSlides = [...slides];
                          const idx = newSlides.findIndex(s => s.id === activeSlideId);
                          // En réalité, nous avons juste l'ID YouTube ou la miniature, 
                          // mais pour la démo on peut utiliser la miniature comme média ou simuler la vidéo
                          if (idx !== -1) {
                            newSlides[idx].media = video.thumbnail;
                            setSlides(newSlides);
                          }
                        }}
                      >
                        <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-transparent group-hover:border-blue-500 transition-colors">
                          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors"></div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-blue-500 text-white rounded-full p-1"><Play size={14} /></div>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate mt-1">{video.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2"><Clock size={14} className="inline mr-1"/> Début (secondes)</label>
                  <input 
                    type="number" 
                    value={activeSlide?.trimStart || 0}
                    onChange={(e) => handleUpdateSlide(activeSlide.id, { trimStart: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#18153a] border border-[#2d295a] text-white rounded-xl p-3 outline-none focus:border-blue-500"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2"><Clock size={14} className="inline mr-1"/> Durée d'export (secondes)</label>
                  <input 
                    type="number" 
                    value={activeSlide?.duration || 10}
                    onChange={(e) => handleUpdateSlide(activeSlide.id, { duration: parseFloat(e.target.value) || 10 })}
                    className="w-full bg-[#18153a] border border-[#2d295a] text-white rounded-xl p-3 outline-none focus:border-blue-500"
                    min="1"
                    step="1"
                  />
                </div>
              </div>

              {/* Audio Upload */}
              <div className="bg-[#18153a] border border-[#2d295a] p-4 rounded-2xl">
                <label className="block text-xs font-bold text-gray-400 mb-2">Piste Audio Globale (Optionnelle)</label>
                <div className="flex items-center gap-4">
                   <label className="bg-[#242145] hover:bg-[#2d295a] px-4 py-2 rounded-lg cursor-pointer text-sm font-bold transition-colors">
                     Importer MP3/WAV
                     <input type="file" accept="audio/*" className="hidden" onChange={(e) => {
                       if (e.target.files[0]) {
                         setGlobalAudio(URL.createObjectURL(e.target.files[0]));
                       }
                     }} />
                   </label>
                   {globalAudio && (
                     <div className="flex items-center gap-2 text-sm text-green-400">
                       <span>✅ Audio chargé</span>
                       <button onClick={() => setGlobalAudio(null)} className="text-red-400 hover:text-red-300"><Trash2 size={14}/></button>
                     </div>
                   )}
                </div>
                {activeSlide?.type === 'video' && (
                  <div className="mt-4 flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="muteOriginal"
                      checked={activeSlide.muteOriginal || false}
                      onChange={(e) => handleUpdateSlide(activeSlide.id, { muteOriginal: e.target.checked })}
                      className="w-4 h-4 accent-blue-500 rounded border-[#2d295a] bg-[#242145]"
                    />
                    <label htmlFor="muteOriginal" className="text-sm cursor-pointer select-none">Couper le son d'origine de la vidéo</label>
                  </div>
                )}
              </div>


              {template === 'music-promo' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">Taille du Titre du morceau</label>
                      <input 
                        type="range" min="50" max="250" value={promoTopTextSize}
                        onChange={(e) => setPromoTopTextSize(parseInt(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">Position verticale</label>
                      <input 
                        type="range" min="10" max="90" value={promoTopTextY}
                        onChange={(e) => setPromoTopTextY(parseInt(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">Couleur du dégradé (Bas)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={promoGradientColor} 
                          onChange={(e) => setPromoGradientColor(e.target.value)}
                          className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-xs font-mono text-gray-400 uppercase">{promoGradientColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">Opacité du Dégradé en bas ({promoGradientOpacity}%)</label>
                      <input 
                        type="range" min="0" max="100" value={promoGradientOpacity}
                        onChange={(e) => setPromoGradientOpacity(parseInt(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2">Contenu du Template</label>
                    <div className="text-xs text-gray-500 mb-2 space-y-1">
                      <p>Ligne 1 : En-tête (ex: UNE NOUVELLE SORTIE DE 'NOM DE L'ARTISTE')</p>
                      <p>Ligne 2 : Titre du morceau (ex: SONG TITLE)</p>
                      <p>Ligne 3 : Grand Titre bas (ex: OUT NOW)</p>
                      <p>Ligne 4 : Texte du bouton YouTube (ex: DISPONIBLE SUR YOUTUBE)</p>
                    </div>
                    <textarea 
                      value={activeSlide?.text || ''} 
                      onChange={(e) => handleUpdateSlide(activeSlide.id, { text: e.target.value })}
                      className="w-full bg-[#18153a] border border-[#2d295a] text-emerald-400 font-mono rounded-xl p-4 outline-none focus:border-blue-500 h-32 resize-none leading-relaxed"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          
        </div>
        </div>
        
        {/* Timeline Bottom Panel */}
        <div className="bg-[#100d23] border border-[#242145] rounded-3xl p-4 flex-shrink-0 shadow-2xl w-full">
            <div className="flex justify-between items-center mb-4 px-2">
               <h3 className="text-sm font-bold text-white flex items-center gap-2"><Film size={14} className="text-blue-500" /> Timeline Editor</h3>
               <div className="flex items-center gap-4">
                 <button onClick={() => setIsPlaying(!isPlaying)} className="bg-[#18153a] hover:bg-[#242145] w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors">
                   <Play size={14} className={isPlaying ? "text-blue-500" : ""} />
                 </button>
                 <div className="text-xs font-mono text-gray-400 bg-black/50 px-3 py-1 rounded-lg">Durée totale : <span className="text-white font-bold">{totalDuration}s</span></div>
               </div>
            </div>
            
            <div className="relative w-full bg-[#0b0914] rounded-xl h-[350px] border border-[#2d295a] overflow-x-auto overflow-y-auto flex flex-col p-4 custom-scrollbar">
                {/* Time axis */}
                <div className="h-6 w-[2000px] flex items-end border-b border-[#2d295a] mb-2 relative flex-shrink-0">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="absolute text-[9px] text-gray-500 border-l border-[#2d295a] h-2 pl-1" style={{ left: `${i * 100}px` }}>00:{i * 10}</div>
                    ))}
                </div>

                {/* Tracks */}
                <div className="flex-1 relative w-[2000px]">
                   
                   {/* Playhead */}
                   <div className="absolute top-[-24px] bottom-0 w-px bg-red-500 z-50 pointer-events-none" style={{ left: `${currentTimelineTime * 10}px` }}>
                     <div className="absolute top-0 left-[-4px] w-0 h-0 border-l-[4.5px] border-l-transparent border-r-[4.5px] border-r-transparent border-t-[6px] border-t-red-500"></div>
                   </div>

                   {/* Video Track */}
                   <div className="absolute top-0 left-0 flex gap-1 h-14 items-center min-w-max">
                      {slides.map(slide => {
                        const width = (slide.duration || 10) * 10;
                        return (
                          <div 
                            key={slide.id} 
                            onClick={() => setActiveSlideId(slide.id)}
                            className={`h-full rounded-md flex flex-col justify-center px-2 cursor-pointer transition-all border-2 overflow-hidden relative group ${activeSlideId === slide.id ? 'border-blue-500 bg-blue-900/30' : 'border-[#2d295a] bg-[#18153a] hover:border-gray-500'}`}
                            style={{ width: `${Math.max(width, 40)}px` }}
                          >
                            {slide.media && <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{backgroundImage: `url(${slide.media})`}}></div>}
                            <span className="text-[10px] font-bold text-gray-300 truncate relative z-10">{slide.type === 'video' ? '🎬' : '🖼️'} Clip {slide.id}</span>
                            <span className="text-[9px] text-gray-500 relative z-10">{slide.duration}s</span>
                            
                            <button onClick={(e) => { e.stopPropagation(); handleRemoveSlide(slide.id); }} className="absolute top-1 right-1 text-red-400 opacity-0 group-hover:opacity-100 bg-black/50 rounded-full p-1 transition-opacity">
                              <Trash2 size={10} />
                            </button>
                          </div>
                        );
                      })}
                      <button onClick={handleAddSlide} className="h-full w-12 rounded-md border-2 border-dashed border-[#2d295a] text-gray-500 hover:text-white hover:border-white transition-colors flex items-center justify-center">
                         +
                      </button>
                   </div>

                   {/* Text / Overlay Track */}
                   <div className="absolute top-[64px] left-0 flex gap-1 h-8 items-center min-w-max">
                      <div className="h-full rounded-md bg-purple-900/30 border border-purple-500/50 flex items-center p-2 truncate" style={{ width: `${totalDuration * 10}px` }}>
                         <span className="text-[10px] font-bold text-purple-400">T <span>Overlays & Template ({template})</span></span>
                      </div>
                   </div>

                   {/* Audio Track */}
                   <div className="absolute top-[104px] left-0 flex gap-1 h-10 items-center min-w-max">
                      {globalAudio ? (
                         <div className="h-full rounded-md bg-green-900/30 border border-green-500 flex items-center p-2" style={{ width: `${totalDuration * 10}px` }}>
                            <span className="text-[10px] font-bold text-green-400 flex items-center gap-2">🎵 Piste Audio (BGM)</span>
                         </div>
                      ) : (
                         <div className="h-full rounded-md border border-dashed border-[#2d295a] flex items-center p-2 text-gray-600" style={{ width: `${totalDuration * 10}px` }}>
                            <span className="text-[10px] font-bold">Aucune musique de fond (Glisser ici)</span>
                         </div>
                      )}
                   </div>

                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
