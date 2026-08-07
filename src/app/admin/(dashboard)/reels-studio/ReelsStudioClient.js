'use client';

import React, { useState } from 'react';
import { Upload, Film, Edit3, Type, Clock, Trash2, Play, Image as ImageIcon } from 'lucide-react';

export default function ReelsStudioClient() {
  const [sourceType, setSourceType] = useState('upload'); // 'upload' ou 'article'
  const [slides, setSlides] = useState([
    { id: 1, type: 'video', media: null, text: 'Titre de la vidéo', duration: 5, transition: 'fade' },
  ]);
  const [activeSlideId, setActiveSlideId] = useState(1);
  const [logo, setLogo] = useState('cmn-white');
  const [mention, setMention] = useState('');
  const [template, setTemplate] = useState('standard');
  const [videoFormat, setVideoFormat] = useState('reels'); // 'reels' (9:16) ou 'tv' (16:9)

  const activeSlide = slides.find(s => s.id === activeSlideId);

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
      file: file, // Stocker l'objet File pour l'envoi au backend
      type: file.type.startsWith('video/') ? 'video' : 'image' 
    });
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [outputVideo, setOutputVideo] = useState(null);
  const [progress, setProgress] = useState(0);
  const [publishModal, setPublishModal] = useState(null); // 'instagram' | 'tiktok' | null
  const [publishCaption, setPublishCaption] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublishInstagram = () => {
    if (!outputVideo) return;
    setPublishCaption('');
    setPublishModal('instagram');
  };

  const handlePublishTikTok = () => {
    if (!outputVideo) return;
    setPublishCaption('');
    setPublishModal('tiktok');
  };

  const handlePublishSubmit = async () => {
    if (!outputVideo) return;
    setIsPublishing(true);
    try {
      // Convertir le blob URL en fichier
      const res = await fetch(outputVideo);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('video', blob, `reel_${Date.now()}.webm`);
      formData.append('caption', publishCaption);
      formData.append('platform', publishModal);

      const apiRes = await fetch('/api/reels/publish', {
        method: 'POST',
        body: formData,
      });
      const data = await apiRes.json();
      if (!apiRes.ok) throw new Error(data.error || 'Erreur de publication');
      alert(`✅ Vidéo publiée avec succès sur ${publishModal === 'tiktok' ? 'TikTok' : 'Instagram'} !`);
      setPublishModal(null);
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    }
    setIsPublishing(false);
  };

  // Dessiner les overlays (texte, logo, mention) par-dessus ce qui est déjà sur le canvas
  const drawOverlays = (ctx, slide, canvasWidth, canvasHeight) => {
    if (slide.text) {
      const fontSize = Math.round(canvasWidth * 0.055);
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      const maxWidth = canvasWidth * 0.88;
      const words = slide.text.split(' ');
      const lines = [];
      let currentLine = '';
      for (const word of words) {
        const test = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = test;
        }
      }
      if (currentLine) lines.push(currentLine);

      const lineHeight = fontSize * 1.35;
      const textY = canvasHeight * 0.82;
      const bgColor = template === 'breaking' ? 'rgba(220,38,38,0.9)' : 'rgba(0,0,0,0.7)';
      lines.forEach((line, i) => {
        const tw = ctx.measureText(line).width;
        const tx = (canvasWidth - tw) / 2;
        const ty = textY + i * lineHeight;
        ctx.fillStyle = bgColor;
        ctx.fillRect(tx - 16, ty - fontSize, tw + 32, fontSize * 1.45);
        ctx.fillStyle = '#fff';
        ctx.fillText(line, tx, ty);
      });
    }

    if (mention) {
      const mSize = Math.round(canvasWidth * 0.032);
      ctx.font = `${mSize}px Arial, sans-serif`;
      const mw = ctx.measureText(mention).width;
      const mx = (canvasWidth - mw) / 2;
      const my = canvasHeight * 0.93;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(mx - 10, my - mSize, mw + 20, mSize * 1.4);
      ctx.fillStyle = '#fff';
      ctx.fillText(mention, mx, my);
    }

    if (logo !== 'none') {
      const label = logo === 'culture-media' ? 'CULTURE MEDIA' : 'CMN';
      const lSize = Math.round(canvasWidth * 0.028);
      ctx.font = `bold ${lSize}px Arial, sans-serif`;
      const lw = ctx.measureText(label).width;
      const lx = canvasWidth - lw - 28;
      const ly = 38;
      ctx.fillStyle = logo === 'cmn-white' ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.82)';
      ctx.fillRect(lx - 10, ly - lSize, lw + 20, lSize * 1.5);
      ctx.fillStyle = logo === 'cmn-white' ? '#000' : '#fff';
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

    try {
      const canvasWidth = videoFormat === 'reels' ? 1080 : 1920;
      const canvasHeight = videoFormat === 'reels' ? 1920 : 1080;
      const FPS = 30;

      // 1. Pré-charger tous les médias
      const loadedMedia = await Promise.all(slidesWithMedia.map(slide => {
        return new Promise((resolve) => {
          if (!slide.media) return resolve({ slide, el: null });
          if (slide.type === 'video') {
            const v = document.createElement('video');
            v.crossOrigin = 'anonymous';
            v.muted = true;
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

      setProgress(10);

      // 2. Créer le canvas et démarrer l'enregistrement
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(FPS);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9' : 'video/webm';
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8_000_000,
      });

      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.start(50);

      // 3. Pour chaque slide, boucle RAF pendant la durée
      for (let i = 0; i < loadedMedia.length; i++) {
        const { slide, el } = loadedMedia[i];
        const durationMs = (slide.duration || 3) * 1000;
        const startTime = performance.now();

        await new Promise(resolve => {
          let rafId;
          const loop = (now) => {
            const elapsed = now - startTime;
            if (elapsed >= durationMs) {
              cancelAnimationFrame(rafId);
              return resolve();
            }

            // Fond noir
            ctx.fillStyle = '#111827';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Dessiner le média (cover)
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

            // Overlays (texte, logo, mention)
            drawOverlays(ctx, slide, canvasWidth, canvasHeight);

            rafId = requestAnimationFrame(loop);
          };
          rafId = requestAnimationFrame(loop);
        });

        setProgress(10 + Math.round(((i + 1) / loadedMedia.length) * 85));
      }

      // 4. Stopper et récupérer le blob
      recorder.stop();
      await new Promise(resolve => { recorder.onstop = resolve; });
      setProgress(98);

      const blob = new Blob(chunks, { type: 'video/webm' });
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
    <>
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Film size={28} color="#dc2743" />
          Reels Studio
        </h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Bouton Connecter TikTok */}
          <a href="/api/auth/tiktok" style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', color: '#111827', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <i className="fab fa-tiktok" style={{ color: '#000' }}></i> Connecter TikTok
          </a>
          {/* Bouton Générer */}
          <button onClick={handleGenerate} disabled={isGenerating} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: isGenerating ? '#6b7280' : '#10b981', color: '#fff', fontWeight: 'bold', cursor: isGenerating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', overflow: 'hidden', minWidth: '180px', justifyContent: 'center' }}>
            {isGenerating && (
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progress}%`, background: 'rgba(255,255,255,0.2)', transition: 'width 0.3s ease' }} />
            )}
            <Play size={18} />
            {isGenerating ? `Génération... ${progress}%` : 'Générer la vidéo'}
          </button>

          <div style={{ width: '1px', height: '30px', background: '#e5e7eb' }} />

          {/* Bouton Prévisualiser - toujours visible */}
          <button
            disabled={!outputVideo}
            onClick={() => {
              const vid = document.getElementById('output-video-player');
              if (vid) { vid.scrollIntoView({ behavior: 'smooth', block: 'center' }); vid.play(); }
            }}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: outputVideo ? '#8b5cf6' : '#e5e7eb', color: outputVideo ? '#fff' : '#9ca3af', fontWeight: 'bold', cursor: outputVideo ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
          >
            <Play size={18} />
            Prévisualiser
          </button>

          {/* Bouton Télécharger - toujours visible */}
          <button
            disabled={!outputVideo}
            onClick={() => {
              const a = document.createElement('a');
              a.href = outputVideo;
              a.download = `reel_${Date.now()}.webm`;
              a.click();
            }}
            style={{ padding: '10px 20px', borderRadius: '8px', border: outputVideo ? '1px solid #d1d5db' : 'none', background: outputVideo ? '#fff' : '#e5e7eb', color: outputVideo ? '#374151' : '#9ca3af', fontWeight: 'bold', cursor: outputVideo ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
          >
            <i className="fas fa-download"></i>
            Télécharger
          </button>

          {/* Publier Facebook - toujours visible */}
          <button
            disabled={!outputVideo}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: outputVideo ? '#3b82f6' : '#e5e7eb', color: outputVideo ? '#fff' : '#9ca3af', fontWeight: 'bold', cursor: outputVideo ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
          >
            <i className="fab fa-facebook-f"></i>
            Facebook
          </button>

          {/* Publier Instagram - toujours visible */}
          <button
            disabled={!outputVideo}
            onClick={() => handlePublishInstagram()}
            style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: outputVideo ? 'linear-gradient(45deg, #f09433 0%, #dc2743 50%, #bc1888 100%)' : '#e5e7eb', color: outputVideo ? '#fff' : '#9ca3af', fontWeight: 'bold', cursor: outputVideo ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
          >
            <i className="fab fa-instagram"></i>
            Instagram
          </button>

          {/* Publier TikTok - toujours visible */}
          <button
            disabled={!outputVideo}
            onClick={() => handlePublishTikTok()}
            style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: outputVideo ? '#000000' : '#e5e7eb', color: outputVideo ? '#fff' : '#9ca3af', fontWeight: 'bold', cursor: outputVideo ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
          >
            <i className="fab fa-tiktok"></i>
            TikTok
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
        
        {/* Colonne de Gauche : Aperçu et Source */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', gap: '20px' }}>
            <button 
              onClick={() => setSourceType('upload')}
              style={{ background: 'none', border: 'none', padding: '5px 10px', fontWeight: sourceType === 'upload' ? 'bold' : 'normal', color: sourceType === 'upload' ? '#3b82f6' : '#6b7280', borderBottom: sourceType === 'upload' ? '2px solid #3b82f6' : 'none', cursor: 'pointer' }}
            >
              Vidéos / Images
            </button>
            <button 
              onClick={() => setSourceType('article')}
              style={{ background: 'none', border: 'none', padding: '5px 10px', fontWeight: sourceType === 'article' ? 'bold' : 'normal', color: sourceType === 'article' ? '#10b981' : '#6b7280', borderBottom: sourceType === 'article' ? '2px solid #10b981' : 'none', cursor: 'pointer' }}
            >
              Depuis un Article (IA)
            </button>
          </div>

          {sourceType === 'article' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="Rechercher un article..." style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
              <button style={{ padding: '10px 15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Générer les slides
              </button>
            </div>
          )}

          {/* Player Preview */}
          <div style={{ flex: 1, backgroundColor: '#000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Format constraint */}
            <div style={{ 
              aspectRatio: videoFormat === 'reels' ? '9/16' : '16/9', 
              maxHeight: '100%',
              maxWidth: '100%',
              height: videoFormat === 'reels' ? '100%' : 'auto', 
              width: videoFormat === 'tv' ? '100%' : 'auto',
              backgroundColor: '#1f2937', 
              position: 'relative', 
              border: '1px solid #4b5563',
              boxShadow: '0 0 20px rgba(0,0,0,0.5)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              
              {outputVideo ? (
                <>
                  <video id="output-video-player" src={outputVideo} style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }} controls autoPlay />
                  <button onClick={() => setOutputVideo(null)} style={{ position: 'absolute', top: 10, left: 10, padding: '5px 10px', background: 'rgba(0,0,0,0.7)', color: 'white', border: '1px solid #4b5563', borderRadius: '6px', cursor: 'pointer', zIndex: 10 }}>
                    Retour à l'édition
                  </button>
                </>
              ) : (
                <>
                  {activeSlide?.media ? (
                    activeSlide.type === 'video' ? (
                      <video src={activeSlide.media} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls autoPlay loop muted />
                    ) : (
                      <img src={activeSlide.media} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="slide preview" />
                    )
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                      <ImageIcon size={48} style={{ marginBottom: '10px' }} />
                      <p>Aucun média pour cette slide</p>
                      <label style={{ marginTop: '10px', padding: '8px 15px', backgroundColor: '#374151', borderRadius: '6px', cursor: 'pointer', color: '#fff', fontSize: '14px' }}>
                        Importer un fichier
                        <input type="file" accept="video/*,image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                      </label>
                    </div>
                  )}

                  {/* Watermark / Logo Overlay */}
                  {logo !== 'none' && (
                    <div style={{ position: 'absolute', top: '20px', right: '20px', padding: '5px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '4px', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>
                      {logo === 'cmn-white' ? 'CMN (Blanc)' : logo === 'cmn-black' ? 'CMN (Noir)' : 'CULTURE MEDIA'}
                    </div>
                  )}

                  {/* Text Overlay */}
                  {activeSlide?.text && (
                    <div style={{ position: 'absolute', bottom: '15%', left: '5%', right: '5%', textAlign: 'center' }}>
                      <span style={{ 
                        backgroundColor: template === 'breaking' ? '#ef4444' : 'rgba(0,0,0,0.6)', 
                        color: '#fff', 
                        padding: '8px 12px', 
                        borderRadius: '8px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}>
                        {activeSlide.text}
                      </span>
                    </div>
                  )}

                  {/* Mention Overlay */}
                  {mention && (
                    <div style={{ position: 'absolute', bottom: '5%', left: '0', right: '0', textAlign: 'center', color: '#fff', fontSize: '14px', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                      {mention}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Colonne de Droite : Édition de la Slide Actuelle & Habillage */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', overflowY: 'auto' }}>
          
          <h3 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={18} /> Édition de la Slide
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '5px' }}>Texte affiché</label>
              <textarea 
                value={activeSlide?.text || ''} 
                onChange={(e) => handleUpdateSlide(activeSlide.id, { text: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', minHeight: '80px', fontFamily: 'inherit' }}
                placeholder="Ex: Titre choc..."
              />
            </div>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '5px' }}><Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> Durée (s)</label>
                <input 
                  type="number" 
                  value={activeSlide?.duration || 3}
                  onChange={(e) => handleUpdateSlide(activeSlide.id, { duration: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  min="1"
                  step="0.5"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '5px' }}>Transition sortante</label>
                <select 
                  value={activeSlide?.transition || 'none'}
                  onChange={(e) => handleUpdateSlide(activeSlide.id, { transition: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                >
                  <option value="none">Cut brut</option>
                  <option value="fade">Fondu (Fade)</option>
                  <option value="slide_left">Glissement (Gauche)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '5px' }}>Média</label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', border: '1px dashed #d1d5db', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#f9fafb' }}>
                <Upload size={16} /> {activeSlide?.media ? 'Remplacer le fichier' : 'Uploader un fichier'}
                <input type="file" accept="video/*,image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
              </label>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />

          <h3 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Habillage Global
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '5px' }}>Format de sortie</label>
              <select value={videoFormat} onChange={(e) => setVideoFormat(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                <option value="reels">Reels / Shorts (9:16 - Vertical)</option>
                <option value="tv">TV / YouTube (16:9 - Horizontal)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '5px' }}>Template Design</label>
              <select value={template} onChange={(e) => setTemplate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                <option value="standard">Standard (Texte avec fond sombre)</option>
                <option value="breaking">Breaking News (Bandeau Rouge)</option>
                <option value="quote">Citation (Texte minimaliste)</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '5px' }}>Logo Filigrane</label>
              <select value={logo} onChange={(e) => setLogo(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                <option value="none">Aucun logo</option>
                <option value="cmn-white">CMN Blanc</option>
                <option value="cmn-black">CMN Noir</option>
                <option value="culture-media">Grand logo CULTURE MEDIA</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '5px' }}>Mentions (@)</label>
              <input 
                type="text" 
                value={mention}
                onChange={(e) => setMention(e.target.value)}
                placeholder="ex: @culturemedia"
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Storyboard / Timeline (Bottom) */}
      <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Storyboard ({slides.length} slides)</h3>
          <button 
            onClick={handleAddSlide}
            style={{ padding: '6px 12px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}
          >
            <span style={{ fontSize: '18px', lineHeight: '10px' }}>+</span> Nouvelle Slide
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
          {slides.map((slide, index) => (
            <div 
              key={slide.id}
              onClick={() => setActiveSlideId(slide.id)}
              style={{ 
                minWidth: '120px', 
                height: '160px', 
                border: activeSlideId === slide.id ? '2px solid #3b82f6' : '1px solid #d1d5db',
                borderRadius: '8px',
                position: 'relative',
                cursor: 'pointer',
                backgroundColor: '#f9fafb',
                overflow: 'hidden'
              }}
            >
              {/* Thumbnail */}
              <div style={{ height: '70%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {slide.media ? (
                  <img src={slide.media} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="thumbnail" />
                ) : (
                  <ImageIcon size={24} color="#9ca3af" />
                )}
              </div>
              
              {/* Info */}
              <div style={{ height: '30%', padding: '5px', fontSize: '11px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}>
                  {slide.text || `Slide ${index + 1}`}
                </div>
                <div style={{ color: '#6b7280', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{slide.duration}s</span>
                  {slides.length > 1 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRemoveSlide(slide.id); }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Badge Numéro */}
              <div style={{ position: 'absolute', top: 5, left: 5, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* ── Modal de publication ── */}
    {publishModal && (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '480px', maxWidth: '90vw', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            {publishModal === 'tiktok' ? (
              <div style={{ width: '42px', height: '42px', background: '#000', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fab fa-tiktok" style={{ color: '#fff', fontSize: '20px' }}></i>
              </div>
            ) : (
              <div style={{ width: '42px', height: '42px', background: 'linear-gradient(45deg, #f09433, #bc1888)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fab fa-instagram" style={{ color: '#fff', fontSize: '20px' }}></i>
              </div>
            )}
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                Publier sur {publishModal === 'tiktok' ? 'TikTok' : 'Instagram'}
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                {publishModal === 'tiktok' ? 'Content Posting API v2' : 'Meta Graph API'}
              </p>
            </div>
          </div>

          {/* Légende / Caption */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>
              Légende / Description
            </label>
            <textarea
              value={publishCaption}
              onChange={e => setPublishCaption(e.target.value)}
              placeholder={publishModal === 'tiktok'
                ? 'Ajoutez une description, des hashtags #culture #media...'
                : 'Rédigez votre légende Instagram, ajoutez des #hashtags et @mentions...'}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', minHeight: '100px', fontFamily: 'inherit', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <span style={{ fontSize: '12px', color: publishCaption.length > 2200 ? '#ef4444' : '#9ca3af' }}>
              {publishCaption.length} / {publishModal === 'tiktok' ? '2200' : '2200'} caractères
            </span>
          </div>

          {/* Info API */}
          {publishModal === 'tiktok' && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#166534' }}>
              <strong>ℹ️ Configuration requise :</strong> Ajoutez <code>TIKTOK_CLIENT_KEY</code> et <code>TIKTOK_CLIENT_SECRET</code> dans votre <code>.env.local</code> pour activer la publication.
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setPublishModal(null)}
              style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              onClick={handlePublishSubmit}
              disabled={isPublishing}
              style={{
                padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: isPublishing ? 'not-allowed' : 'pointer', color: '#fff',
                background: isPublishing ? '#9ca3af' : publishModal === 'tiktok' ? '#000' : 'linear-gradient(45deg, #f09433, #bc1888)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {isPublishing ? (
                <><i className="fas fa-spinner fa-spin"></i> Publication...</>
              ) : (
                <><i className={`fab fa-${publishModal}`}></i> Publier maintenant</>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
