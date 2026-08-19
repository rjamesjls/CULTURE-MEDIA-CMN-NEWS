'use client';


const convertImagesToBase64 = async (containerNode) => {
  if (!containerNode) return;
  const imgs = containerNode.querySelectorAll('img');
  const tasks = Array.from(imgs).map(async (img) => {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:')) return;
    try {
      const res = await fetch(src);
      if (!res.ok) return;
      const blob = await res.blob();
      await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === 'string') {
            img.src = reader.result;
          }
          resolve();
        };
        reader.onerror = resolve;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("Base64 image conversion warning:", err);
    }
  });
  await Promise.all(tasks);
};

const getProxiedImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
    return url;
  }
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
};

import { useState, useRef, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import Link from 'next/link';
import { removeBackground } from '@imgly/background-removal';

const createDefaultPage = () => ({
  id: Date.now() + Math.random(),
  template: 't1', // 't1' = Classic, 't2' = Giant Title, 't3' = Minimal Text
  tag: 'NOUVEAUTÉ',
  title: "TITRE",
  content: 'Découvrez le nouveau titre dès maintenant sur toutes les plateformes.',
  partnerText: 'STARPLAY MUSIC',
  bgImage: '',
  themeColor: '#D32F2F',
  logoType: 'white',
  logoVersion: 'new',
  logoPosition: 'top-center',
  highlightColor: '#FBBF24',
  footerText: 'CULTURE MEDIA',
  showLive: false,
  socials: { instagram: true, youtube: false, tiktok: false },
  titleSize: 90,
  contentSize: 42,
  tagSize: 28,
  items: [],
  customBlocks: [],
});


const ensurePageDefaults = (page) => {
  if (!page) return createDefaultPage();
  return {
    ...createDefaultPage(),
    ...page,
    tag: page.tag ?? 'NOUVEAUTÉ',
    title: page.title ?? 'TITRE',
    content: page.content ?? '',
    partnerText: page.partnerText ?? 'STARPLAY MUSIC',
    bgImage: page.bgImage ?? '',
    themeColor: page.themeColor ?? '#D32F2F',
    logoType: page.logoType ?? 'white',
    logoVersion: page.logoVersion ?? 'new',
    logoPosition: page.logoPosition ?? 'top-center',
    highlightColor: page.highlightColor ?? '#FBBF24',
    footerText: page.footerText ?? 'CULTURE MEDIA',
    titleSize: page.titleSize ?? 90,
    contentSize: page.contentSize ?? 42,
    tagSize: page.tagSize ?? 28,
    items: page.items ?? [],
    socials: { instagram: true, youtube: false, tiktok: false, ...(page.socials || {}) }
  };
};


// --- CANVA-STYLE INLINE EDIT & DRAG STUDIO COMPONENTS ---
const EditableText = ({ text, onChange, style = {}, className = '', placeholder = 'Écrivez ici...' }) => {
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onChange(e.currentTarget.innerText)}
      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } }}
      style={{
        outline: '1.5px dashed rgba(56,189,248,0.5)',
        outlineOffset: '3px',
        cursor: 'text',
        minWidth: '20px',
        display: 'inline-block',
        borderRadius: '4px',
        padding: '0 4px',
        transition: 'all 0.2s',
        ...style
      }}
      className={className}
      title="Cliquer pour éditer le texte directement"
    >
      {text || placeholder}
    </span>
  );
};

export default function InstagramCustomClient() {
  const [pages, setPages] = useState([createDefaultPage()]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [bgProgress, setBgProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [caption, setCaption] = useState('');
  const [savedSessions, setSavedSessions] = useState([]);
  
  useEffect(() => {
    fetch('/api/library/save-session')
      .then(res => res.json())
      .then(data => {
        if (data.sessions) setSavedSessions(data.sessions);
      })
      .catch(e => console.error(e));
  }, []);
  
  // Create refs for each page to allow downloading all at once
  // Since we only render the active page in the DOM for preview, 
  // to download ALL, we need to temporarily render them all or download one by one by switching state.
  // Actually, for multiple downloads, we can render all pages invisibly in the DOM.
  
  const activePage = ensurePageDefaults(pages[currentIndex]);

  const updateActivePage = (key, value) => {
    const newPages = [...pages];
    newPages[currentIndex] = { ...newPages[currentIndex], [key]: value };
    setPages(newPages);
  };

  const updateSocials = (net) => {
    const newPages = [...pages];
    newPages[currentIndex].socials = { 
      ...newPages[currentIndex].socials, 
      [net]: !newPages[currentIndex].socials[net] 
    };
    setPages(newPages);
  };

  useEffect(() => {
    // Si on arrive depuis les classements YouTube
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('source') === 'charts') {
      const chartsData = localStorage.getItem('youtube_charts_export');
      if (chartsData) {
        try {
          const parsed = JSON.parse(chartsData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPages(parsed.map(ensurePageDefaults));
          }
        } catch(e) {
          console.error("Erreur lecture charts export", e);
        }
        localStorage.removeItem('youtube_charts_export');
        
        // Remove 'source' from URL without reloading
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  const addPage = () => {
    const newPage = { ...activePage, id: Date.now() + Math.random() };
    setPages([...pages, newPage]);
    setCurrentIndex(pages.length);
  };

  const removePage = (index) => {
    if (pages.length <= 1) return;
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
    if (currentIndex >= newPages.length) {
      setCurrentIndex(newPages.length - 1);
    }
  };

  
  
  const addCustomTextBlock = () => {
    const newBlock = {
      id: 'block_' + Date.now(),
      text: 'Nouveau Texte Libre',
      fontSize: 32,
      color: '#FFFFFF',
      fontWeight: 'bold',
      x: 0,
      y: 0
    };
    const currentBlocks = activePage.customBlocks || [];
    updateActivePage('customBlocks', [...currentBlocks, newBlock]);
  };

  const removeCustomTextBlock = (id) => {
    const currentBlocks = (activePage.customBlocks || []).filter(b => b.id !== id);
    updateActivePage('customBlocks', currentBlocks);
  };

  const updateCustomTextBlock = (id, updates) => {
    const currentBlocks = (activePage.customBlocks || []).map(b => b.id === id ? { ...b, ...updates } : b);
    updateActivePage('customBlocks', currentBlocks);
  };

  const handleItemImageUpload = (itemIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const currentItems = [...(activePage.items || [])];
      if (currentItems[itemIndex]) {
        currentItems[itemIndex] = { ...currentItems[itemIndex], image: dataUrl };
        updateActivePage('items', currentItems);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateActivePage('bgImage', url);
    }
  };

  const handleRemoveBg = async () => {
    if (!activePage.bgImage) return;
    setIsProcessingBg(true);
    setBgProgress(0);
    try {
      const blob = await removeBackground(activePage.bgImage, {
        progress: (key, current, total) => {
          if (total && current <= total) {
            setBgProgress(Math.round((current / total) * 100));
          }
        }
      });
      const url = URL.createObjectURL(blob);
      updateActivePage('bgImage', url);
    } catch (error) {
      console.error('Background removal failed', error);
      alert("Erreur lors du détourage de l'image.");
    } finally {
      setIsProcessingBg(false);
      setBgProgress(0);
    }
  };

  const getLogoPath = (type, version) => {
    if (version === 'old') {
      switch(type) {
        case 'black': return '/backgrounds/cmn-corner-logo-black.png';
        case 'default': return '/assets/logo.png';
        case 'white': 
        default:
          return '/backgrounds/cmn-corner-logo.png';
      }
    } else {
      switch(type) {
        case 'black': return '/backgrounds/afoluku-corner-logo-black.png';
        case 'default': return '/assets/logo.png';
        case 'white': 
        default:
          return '/backgrounds/afoluku-corner-logo.png';
      }
    }
  };

  const getLogoContainerStyle = (position) => {
    if (!position) position = 'top-center';
    const isTop = position.startsWith('top');
    const isLeft = position.endsWith('left');
    const isRight = position.endsWith('right');
    const isCenter = position.endsWith('center');

    return {
      position: 'absolute',
      top: isTop ? '70px' : 'auto',
      bottom: !isTop ? '70px' : 'auto',
      left: isLeft ? '80px' : (isCenter ? '0' : 'auto'),
      right: isRight ? '80px' : (isCenter ? '0' : 'auto'),
      width: isCenter ? '100%' : 'auto',
      display: 'flex',
      justifyContent: isCenter ? 'center' : 'flex-start',
      zIndex: 100,
    };
  };

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const renderTextWithHighlights = (text, highlightColor) => {
    if (!text) return null;
    const parts = text.split(/(\*[^*]+\*)/g);
    const colorToUse = highlightColor || '#FBBF24';
    return parts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return <span key={i} style={{ color: colorToUse }}>{part.slice(1, -1)}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    try {
      // We will loop through each page, set it as active, wait a bit, then capture.
      const originalIndex = currentIndex;
      
      for (let i = 0; i < pages.length; i++) {
        setCurrentIndex(i);
        await delay(300); // Wait for React to re-render and images to load
        
        const node = document.getElementById('export-template-node');
        if (!node) continue;

        // Suppress specific html-to-image CORS errors from triggering the Next.js dev overlay
        const originalConsoleError = console.error;
        console.error = (...args) => {
          const fullMsg = args.map(a => typeof a === 'object' ? (a.message || '') : String(a)).join(' ').toLowerCase();
          if (
            fullMsg.includes('cssrules') || 
            fullMsg.includes('insertrule') || 
            fullMsg.includes('inlining remote css') ||
            fullMsg.includes('reading css rules') ||
            fullMsg.includes('font-awesome') ||
            fullMsg.includes('fonts.googleapis')
          ) {
            return; // Ignore html-to-image font loading errors
          }
          originalConsoleError(...args);
        };

        // Pre-convert all remote images to Base64 data URLs for 100% perfect canvas rendering
        await convertImagesToBase64(node);

        let dataUrl;
        try {
          dataUrl = await htmlToImage.toJpeg(node, {
            quality: 0.95,
            width: 1080,
            height: 1350,
            pixelRatio: 1,
            skipFonts: true,
            cacheBust: true,
            imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
          });
        } finally {
          console.error = originalConsoleError;
        }
        
        const fileName = `AFOLUKU-Insta-Page${i+1}-${Date.now()}.jpg`;
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
        
        // Upload to Library
        try {
          const uploadRes = await fetch('/api/library/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64: dataUrl,
              fileName: fileName,
              fileType: 'image/jpeg',
              source: 'generation'
            })
          });
          if (!uploadRes.ok) {
            const errData = await uploadRes.json();
            console.error('Erreur upload:', errData);
            alert(`Attention : L'image ${fileName} n'a pas pu être sauvegardée dans la médiathèque (Erreur: ${errData.details || errData.error || uploadRes.statusText})`);
          }
        } catch(e) { 
          console.error('Library upload failed', e);
          alert(`Erreur réseau lors de la sauvegarde de ${fileName} dans la médiathèque.`);
        }
        
        await delay(300); // small delay between downloads to prevent browser blocking
      }
      
      setCurrentIndex(originalIndex);
    } catch (error) {
      console.error('Failed to generate image', error);
      const msg = error?.message || (typeof error === 'string' ? error : 'Impossible d\'exporter le visuel'); alert(`Erreur lors de la génération des images : ${msg}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveSession = async () => {
    setIsSaving(true);
    try {
      const title = pages[0]?.title || `Session du ${new Date().toLocaleDateString('fr-FR')}`;
      const res = await fetch('/api/library/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionId,
          title: `Carrousel: ${title}`,
          pagesData: pages
        })
      });
      const data = await res.json();
      if (data.id) setSessionId(data.id);
      alert('Session sauvegardée avec succès !');
    } catch(e) {
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const generateStandardCaption = () => {
    const mainTitle = pages[0]?.title ? pages[0].title.replace(/\*/g, '') : "Titre de l'Article";
    const text = `${mainTitle}

Découvrez la suite sur notre site ! 🔗 Lien en bio ou en story.

👇 Soutenez AFOLUKU :
❤️ Aimez ce post si vous validez
💬 Donnez votre avis en commentaire
🚀 Partagez à vos amis
✅ Abonnez-vous pour ne rien manquer !

#AFOLUKU #Actu #CultureMedia #News`;
    setCaption(text);
  };

  const renderTemplate = (page) => {
    const { template, bgImage, themeColor, highlightColor, logoType, logoVersion, logoPosition, showLive, tag, title, content, partnerText, footerText, socials, titleSize, contentSize, tagSize } = page;
    const logoSrc = getLogoPath(logoType, logoVersion);

    if (template === 't1') {
      // CLASSIC NEWS TEMPLATE
      return (
        <div style={{ width: '1080px', height: '1350px', background: '#0F172A', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
          {bgImage ? (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
              <img src={getProxiedImageUrl(bgImage)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, background: 'linear-gradient(45deg, #1e1e1e, #2a2a2a)' }}></div>
          )}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, background: 'linear-gradient(to bottom, rgba(15,23,42,0.1) 0%, rgba(15,23,42,0.6) 40%, rgba(15,23,42,0.95) 100%)' }}></div>
          
          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '80px', boxSizing: 'border-box' }}>
            <div style={getLogoContainerStyle(logoPosition)}>
              <img src={logoSrc} alt="CMN" style={{ height: '80px', filter: logoType === 'black' ? 'none' : 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
              {showLive && (
                <span style={{ background: '#ef4444', color: '#FFF', padding: '15px 30px', borderRadius: '40px', fontSize: `${tagSize}px`, fontWeight: '900', letterSpacing: '3px', boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#FFF' }}></div>
                  EN DIRECT
                </span>
              )}
              {tag && (
                <span style={{ background: themeColor, color: '#FFF', padding: '15px 30px', borderRadius: '40px', fontSize: `${tagSize}px`, fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase', boxShadow: `0 10px 30px ${themeColor}80` }}>
                  {tag}
                </span>
              )}
            </div>

            <h1 style={{ color: '#FFF', fontSize: `${titleSize}px`, fontWeight: '900', lineHeight: '1.05', margin: '0 0 40px 0', textShadow: '0 10px 40px rgba(0,0,0,0.5)', whiteSpace: 'pre-wrap' }}>
              {renderTextWithHighlights(title, highlightColor)}
            </h1>

            {content && (
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: `${contentSize}px`, lineHeight: '1.4', fontWeight: '400', margin: '0 0 60px 0', borderLeft: `6px solid ${themeColor}`, paddingLeft: '30px', whiteSpace: 'pre-wrap' }}>
                {renderTextWithHighlights(content, highlightColor)}
              </p>
            )}

            <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '28px', fontWeight: '600', letterSpacing: '2px' }}>{footerText || 'AFOLUKU.COM'}</div>
              <div style={{ display: 'flex', gap: '20px', fontSize: '40px', color: 'rgba(255,255,255,0.6)' }}>
                  {socials.instagram && <svg viewBox="0 0 448 512" fill="currentColor" width="1em" height="1em"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>}
                  {socials.youtube && <svg viewBox="0 0 576 512" fill="currentColor" width="1em" height="1em"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/></svg>}
                  {socials.tiktok && <svg viewBox="0 0 448 512" fill="currentColor" width="1em" height="1em"><path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31v89.89a74.62 74.62 0 1 0 52.23 71.18V0l88 0a121.18 121.18 0 0 0 1.86 22.17h0A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z"/></svg>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (template === 't9') {
      // INNOVATE-X NEON SPEAKER TEMPLATE (EXACT REPLICA)
      return (
        <div style={{ width: '1080px', height: '1350px', background: 'linear-gradient(180deg, #4A044E 0%, #701A75 35%, #3B0764 70%, #170326 100%)', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
          
          {/* Cyber Circuit Trace Overlay */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15, pointerEvents: 'none', backgroundImage: 'radial-gradient(#E879F9 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div style={{ position: 'absolute', top: '10%', left: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(236,72,153,0.35) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '-100px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

          {/* Background Image fallback if uploaded */}
          {bgImage && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.15 }}>
              <img src={getProxiedImageUrl(bgImage)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            </div>
          )}

          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '50px 55px', boxSizing: 'border-box' }}>
            
            {/* Top Logo & Presenter Bar */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', fontWeight: '800', letterSpacing: '4px', textTransform: 'uppercase' }}>PRESENT</span>
              <img src={logoSrc} alt="CMN" style={{ height: '45px', filter: 'drop-shadow(0 4px 10px rgba(236,72,153,0.6))' }} />
              <span style={{ color: '#F472B6', fontSize: '22px', fontWeight: '900', letterSpacing: '2px' }}>2026</span>
            </div>

            {/* Title Section with Lightning Icon */}
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <div style={{ color: '#F472B6', fontSize: '18px', fontWeight: '800', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '8px' }}>
                T H E M E
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                <div style={{ fontSize: '70px', filter: 'drop-shadow(0 0 25px #F59E0B)' }}>⚡</div>
                <h1 style={{ 
                  color: '#FFF', 
                  fontSize: '62px', 
                  fontWeight: '900', 
                  lineHeight: '1.0', 
                  margin: 0, 
                  textTransform: 'uppercase', 
                  letterSpacing: '-1px',
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  filter: 'drop-shadow(0 0 25px rgba(236,72,153,0.8))'
                }}>
                  <EditableText text={title || 'SHAPING THE FUTURE WITH IDEAS'} onChange={(val) => updateActivePage('title', val)} style={{ color: '#FFF' }} />
                </h1>
              </div>
            </div>

            {/* Center Speaker Image Container */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
              
              <div style={{ width: '420px', height: '520px', borderRadius: '30px', overflow: 'hidden', border: '3px solid rgba(244,114,182,0.6)', boxShadow: '0 0 50px rgba(236,72,153,0.5)', background: 'linear-gradient(180deg, rgba(59,7,100,0.5) 0%, rgba(23,3,38,0.8) 100%)', position: 'relative' }}>
                {activePage.items && activePage.items[0]?.image ? (
                  <img src={getProxiedImageUrl(activePage.items[0].image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                ) : (bgImage ? (
                  <img src={getProxiedImageUrl(bgImage)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F472B6', fontSize: '64px', fontWeight: 'bold' }}>
                    {(title || 'S')[0]}
                  </div>
                ))}
              </div>

              {/* Speaker Name Overlay (Bottom Right Signature Badge) */}
              <div style={{ position: 'absolute', bottom: '20px', right: '30px', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(244,114,182,0.5)', padding: '14px 22px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', textAlign: 'right' }}>
                <div style={{ color: '#F472B6', fontSize: '14px', fontStyle: 'italic', fontWeight: '700', fontFamily: 'serif' }}>Speaker</div>
                <div style={{ color: '#FFF', fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                  <EditableText text={activePage.items && activePage.items[0]?.title ? activePage.items[0].title : (partnerText || 'Dr. Aminu Yusuf')} onChange={(val) => updateActivePage('partnerText', val)} style={{ color: '#FFF' }} />
                </div>
                <div style={{ color: '#CBD5E1', fontSize: '13px', fontWeight: '600' }}>
                  <EditableText text={activePage.items && activePage.items[0]?.subtitle ? activePage.items[0].subtitle : (content || '(AI Specialist)')} onChange={(val) => updateActivePage('content', val)} style={{ color: '#CBD5E1' }} />
                </div>
              </div>
            </div>

            {/* Bottom Event Pills (Venue + Date) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', marginBottom: '20px', marginTop: '10px' }}>
              <div style={{ background: 'linear-gradient(135deg, #EC4899 0%, #D946EF 100%)', color: '#FFF', padding: '18px 25px', borderRadius: '22px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 10px 30px rgba(236,72,153,0.4)', border: '1px solid rgba(255,255,255,0.3)' }}>
                <span style={{ fontSize: '28px' }}>📍</span>
                <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <EditableText text={tag || 'Eko Convention Centre, Lagos'} onChange={(val) => updateActivePage('tag', val)} style={{ color: '#FFF' }} />
                </span>
              </div>

              <div style={{ background: '#FFF', color: '#000', padding: '14px 28px', borderRadius: '22px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '2px solid #F472B6' }}>
                <span style={{ fontSize: '28px' }}>🗓️</span>
                <div>
                  <div style={{ fontSize: '26px', fontWeight: '900', lineHeight: '1.0' }}>15th</div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#C026D3', textTransform: 'uppercase' }}>Nov, 2026</div>
                </div>
              </div>
            </div>

            {/* Footer Registration Link */}
            <div style={{ textAlign: 'center', color: '#F472B6', fontSize: '17px', fontWeight: '800', letterSpacing: '2px' }}>
              ➔ Register at; <EditableText text={footerText || 'www.innovatex.com'} onChange={(val) => updateActivePage('footerText', val)} style={{ color: '#F472B6' }} />
            </div>
          </div>
        </div>
      );
    }

    if (template === 't6') {
      // CYBER TECH NEON 4.0 TEMPLATE (HBR SLANTED COLUMNS STYLE)
      const itemsList = (page.items || []).length > 0 ? page.items.slice(0, 4) : [
        { title: 'MR. NGUYỄN THÀNH', subtitle: 'Sáng lập tổ chức', image: '' },
        { title: 'MR. TONY DZUNG', subtitle: 'Chairman of HBR', image: '' },
        { title: 'MR. CẤN VĂN LỰC', subtitle: 'Cố vấn cấp cao', image: '' },
        { title: 'MR. NGUYỄN KIM', subtitle: 'Chuyên gia tài chính', image: '' }
      ];

      return (
        <div style={{ width: '1080px', height: '1350px', background: 'linear-gradient(180deg, #050B14 0%, #0A192F 50%, #030712 100%)', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
          {/* Cyber Neon Flare Orbs */}
          <div style={{ position: 'absolute', top: '-100px', right: '-50px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-100px', left: '-50px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(2,132,199,0.25) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

          {bgImage && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.2 }}>
              <img src={getProxiedImageUrl(bgImage)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(20px) hue-rotate(180deg)' }} referrerPolicy="no-referrer" />
            </div>
          )}

          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '50px 50px', boxSizing: 'border-box' }}>
            
            {/* Header / Logo Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <img src={logoSrc} alt="CMN" style={{ height: '55px', filter: 'drop-shadow(0 4px 15px rgba(56,189,248,0.5))' }} />
              {tag && (
                <span style={{ 
                  background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)', 
                  color: '#FFF', 
                  padding: '8px 24px', 
                  borderRadius: '6px', 
                  fontSize: '16px', 
                  fontWeight: '900', 
                  letterSpacing: '2px', 
                  textTransform: 'uppercase',
                  boxShadow: '0 0 20px rgba(14,165,233,0.5)',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}>
                  ⚡ {tag}
                </span>
              )}
            </div>

            {/* 3D Cyan Cyber Title */}
            <div style={{ textAlign: 'right', marginBottom: '40px', paddingRight: '20px' }}>
              <h1 style={{ 
                color: '#38BDF8', 
                fontSize: '64px', 
                fontWeight: '900', 
                lineHeight: '1.0', 
                margin: '0', 
                textTransform: 'uppercase', 
                letterSpacing: '-1px',
                background: 'linear-gradient(180deg, #E0F2FE 0%, #38BDF8 50%, #0284C7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 20px rgba(56, 189, 248, 0.6))'
              }}>
                {title || 'TRÍ TUỆ ĐẦU TƯ 4.0'}
              </h1>
              <div style={{ color: '#F1F5F9', fontSize: '20px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', marginTop: '10px' }}>
                {content || 'LE GUIDE ULTIME POUR RÉUSSIR VOS PROJETS'}
              </div>
            </div>

            {/* 4 Slanted Parallel Columns (Angled Speaker Cards) */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', alignItems: 'end', paddingBottom: '30px' }}>
              {itemsList.map((item, idx) => (
                <div key={idx} style={{ 
                  height: idx % 2 === 0 ? '540px' : '490px',
                  background: 'linear-gradient(180deg, rgba(14,165,233,0.15) 0%, rgba(15,23,42,0.85) 100%)', 
                  borderRadius: '16px', 
                  border: '1.5px solid #38BDF8', 
                  boxShadow: '0 0 25px rgba(56,189,248,0.3)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  overflow: 'hidden',
                  transform: 'skewX(-4deg)',
                  position: 'relative'
                }}>
                  {/* Photo inside slanted card */}
                  <div style={{ flex: 1, position: 'relative', width: '100%', overflow: 'hidden', transform: 'skewX(4deg) scale(1.15)' }}>
                    {item.image ? (
                      <img src={getProxiedImageUrl(item.image)} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8', fontSize: '32px', fontWeight: 'bold', background: '#0F172A' }}>
                        {(item.title || 'A')[0]}
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70px', background: 'linear-gradient(0deg, rgba(15,23,42,1) 0%, rgba(15,23,42,0) 100%)' }} />
                  </div>

                  {/* Label below */}
                  <div style={{ padding: '15px 12px', background: '#0F172A', transform: 'skewX(4deg)', borderTop: '1px solid rgba(56,189,248,0.3)' }}>
                    <div style={{ color: '#FFF', fontSize: '15px', fontWeight: '900', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: '12px', fontWeight: '600', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.subtitle || item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Event Banner */}
            <div style={{ borderTop: '1px solid rgba(56,189,248,0.3)', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#FFF', fontSize: '24px', fontWeight: '900', letterSpacing: '1px' }}>{footerText || 'Hà Nội 22/07/2026'}</div>
                <div style={{ color: '#F59E0B', fontSize: '14px', fontWeight: '700', marginTop: '2px' }}>Duy nhất 50 vé VIP giao lưu cùng diễn giả</div>
              </div>
              <div style={{ background: 'rgba(56,189,248,0.15)', color: '#38BDF8', padding: '10px 22px', borderRadius: '30px', fontSize: '15px', fontWeight: '800', border: '1px solid #38BDF8' }}>
                {partnerText || 'CULTURE MEDIA 4.0'}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (template === 't7') {
      // WEB3 CRYPTO SPACE HALO TEMPLATE
      const itemsList = (page.items || []).length > 0 ? page.items.slice(0, 4) : [
        { title: 'ELIZABETH ADELIN', subtitle: 'Community BlockDevId', value: 'MODERATOR', image: '' },
        { title: 'DENNIS', subtitle: 'Head of Community', value: 'SPEAKER', image: '' },
        { title: 'CARRINA CHITTRA', subtitle: 'Web3 Content Creator', value: 'SPEAKER', image: '' },
        { title: 'WINSTON RENATAN', subtitle: 'CEO Encoteki', value: 'SPEAKER', image: '' }
      ];

      return (
        <div style={{ width: '1080px', height: '1350px', background: '#020617', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
          {/* Top & Bottom Giant Neon Ring Halos */}
          <div style={{ position: 'absolute', top: '-250px', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '500px', borderRadius: '50%', border: '2px solid rgba(56,189,248,0.6)', boxShadow: '0 0 80px rgba(56,189,248,0.5)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-250px', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '500px', borderRadius: '50%', border: '2px solid rgba(56,189,248,0.6)', boxShadow: '0 0 80px rgba(56,189,248,0.5)', pointerEvents: 'none' }} />

          {bgImage && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.12 }}>
              <img src={getProxiedImageUrl(bgImage)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            </div>
          )}

          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '50px 45px', boxSizing: 'border-box' }}>
            
            {/* Corporate Logo Header */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', marginBottom: '35px' }}>
              <img src={logoSrc} alt="CMN" style={{ height: '45px' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '20px' }}>|</span>
              <span style={{ color: '#FFF', fontWeight: '800', fontSize: '18px', letterSpacing: '2px' }}>BLOCKDEV • UPH</span>
            </div>

            {/* Title & Tagline */}
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
              <h1 style={{ color: '#FFF', fontSize: '52px', fontWeight: '900', letterSpacing: '-0.5px', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
                {title || 'BUILDING IN THE CRYPTO SPACE'}
              </h1>
              <div style={{ color: '#38BDF8', fontSize: '18px', fontWeight: '700', letterSpacing: '4px', textTransform: 'uppercase' }}>
                {content || 'LEARN. BUILD. MAKE IMPACT. BEYOND THE CHARTS'}
              </div>
            </div>

            {/* Row of 4 Glassmorphism Cards */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'center' }}>
              {itemsList.map((item, idx) => (
                <div key={idx} style={{ 
                  height: '420px', 
                  background: 'linear-gradient(180deg, rgba(30,58,138,0.6) 0%, rgba(15,23,42,0.9) 100%)', 
                  borderRadius: '20px', 
                  border: '1px solid rgba(56,189,248,0.4)', 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(56,189,248,0.2)', 
                  padding: '15px', 
                  boxSizing: 'border-box',
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  {/* Photo Container */}
                  <div style={{ width: '100%', height: '230px', borderRadius: '14px', overflow: 'hidden', background: '#0F172A', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {item.image ? (
                      <img src={getProxiedImageUrl(item.image)} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8', fontSize: '32px', fontWeight: 'bold' }}>
                        {(item.title || 'A')[0]}
                      </div>
                    )}
                  </div>

                  {/* Role Pill */}
                  <div style={{ color: '#38BDF8', fontSize: '11px', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {item.value || (idx === 0 ? 'MODERATOR' : 'SPEAKER')}
                  </div>

                  {/* Name */}
                  <div style={{ color: '#FFF', fontSize: '15px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1.2', marginBottom: '4px' }}>
                    {item.title}
                  </div>

                  {/* Subtitle */}
                  <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '500', lineHeight: '1.3' }}>
                    {item.subtitle}
                  </div>
                </div>
              ))}
            </div>

            {/* Event Time & Venue Box */}
            <div style={{ textAlign: 'center', marginTop: '30px', padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ color: '#FFF', fontSize: '22px', fontWeight: '800' }}>
                {footerText || 'Wednesday, 15 October 2026 | 13.00'}
              </div>
              <div style={{ color: '#38BDF8', fontSize: '16px', fontWeight: '600', marginTop: '4px' }}>
                {partnerText || 'HOPE Building, Lippo Village • Official Event'}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (template === 't8') {
      // PURPLE ROCKET POP TEMPLATE (DUO/TRIO TECH EVENT STYLE)
      const itemsList = (page.items || []).length > 0 ? page.items.slice(0, 2) : [
        { title: 'Iji Fred', subtitle: 'Director of Engineering, Enyata', image: '', color: '#A855F7' },
        { title: 'Elizabeth Eyinade', subtitle: 'HR Consultant / Product Manager', image: '', color: '#F59E0B' }
      ];

      return (
        <div style={{ width: '1080px', height: '1350px', background: 'linear-gradient(180deg, #2E1065 0%, #3B0764 50%, #1E1B4B 100%)', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
          {/* Ambient Glows */}
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

          {bgImage && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.15 }}>
              <img src={getProxiedImageUrl(bgImage)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            </div>
          )}

          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '55px 60px', boxSizing: 'border-box' }}>
            
            {/* Header Logo & Event Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <img src={logoSrc} alt="CMN" style={{ height: '55px' }} />
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>
                BUILDUP COHORT 1
              </div>
            </div>

            {/* Title Container */}
            <div style={{ marginBottom: '40px' }}>
              <h1 style={{ color: '#FFF', fontSize: '56px', fontWeight: '900', lineHeight: '1.1', margin: '0 0 15px 0' }}>
                {title || "What's Next After Tech Training?"}
              </h1>
              <div style={{ background: '#581C87', color: '#FFF', padding: '16px 24px', borderRadius: '12px', fontSize: '24px', fontWeight: '800', borderLeft: '6px solid #F59E0B' }}>
                {content || 'Positioning Yourself for Real Opportunities as a NewBie'}
              </div>
            </div>

            {/* Speakers Label */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ background: '#F59E0B', color: '#000', padding: '8px 22px', borderRadius: '30px', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase' }}>
                {tag || 'Intervenants'}
              </span>
            </div>

            {/* Duo / Trio Color Block Speaker Cards */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '25px', alignItems: 'center' }}>
              {itemsList.map((item, idx) => {
                const cardColor = idx % 2 === 0 ? '#C084FC' : '#FBBF24';
                return (
                  <div key={idx} style={{ 
                    height: '480px', 
                    background: '#1E1B4B', 
                    borderRadius: '24px', 
                    overflow: 'hidden', 
                    border: '1px solid rgba(255,255,255,0.15)', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Color background portrait card */}
                    <div style={{ flex: 1, background: cardColor, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      {item.image ? (
                        <img src={getProxiedImageUrl(item.image)} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: '48px', fontWeight: '900', color: '#000', marginBottom: '40px' }}>
                          {(item.title || 'A')[0]}
                        </div>
                      )}
                    </div>

                    {/* Dark Caption Box */}
                    <div style={{ padding: '20px 20px', background: '#0F172A' }}>
                      <div style={{ color: '#FFF', fontSize: '22px', fontWeight: '900', marginBottom: '4px' }}>
                        {item.title}
                      </div>
                      <div style={{ color: '#94A3B8', fontSize: '14px', fontWeight: '600' }}>
                        {item.subtitle || item.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Banner */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '25px', marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#FFF', fontSize: '26px', fontWeight: '900' }}>{footerText || 'Thursday 30th April, 2026'}</div>
                <div style={{ color: '#F59E0B', fontSize: '20px', fontWeight: '800' }}>4:00pm GMT</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#C084FC', fontSize: '15px', fontWeight: '700' }}>Live on official stream</div>
                <div style={{ color: '#FFF', fontSize: '16px', fontWeight: '800' }}>{partnerText || 'meet.jit.si / culturemedia'}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (template === 't5') {
      // PRESTIGE GOLD GRID TOP 10 TEMPLATE (AWARD / GALLERY STYLE)
      return (
        <div style={{ width: '1080px', height: '1350px', background: 'linear-gradient(180deg, #090703 0%, #171105 50%, #090703 100%)', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
          {/* Glowing Ambient Particles & Gold Flares */}
          <div style={{ position: 'absolute', top: '-150px', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '500px', background: 'radial-gradient(circle, rgba(245,158,11,0.28) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(217,119,6,0.18) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

          {bgImage && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.15 }}>
              <img src={getProxiedImageUrl(bgImage)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(25px) sepia(50%)' }} referrerPolicy="no-referrer" />
            </div>
          )}

          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '40px 45px', boxSizing: 'border-box' }}>
            
            {/* Header / Partner Strip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <img src={logoSrc} alt="CMN" style={{ height: '50px', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.8))' }} />
              {tag && (
                <span style={{ 
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', 
                  color: '#000', 
                  padding: '6px 20px', 
                  borderRadius: '30px', 
                  fontSize: '16px', 
                  fontWeight: '900', 
                  letterSpacing: '2px', 
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 20px rgba(245,158,11,0.5)'
                }}>
                  🏆 {tag}
                </span>
              )}
            </div>

            {/* 3D Golden Title */}
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{ color: '#FBBF24', fontSize: '22px', fontWeight: '800', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '4px' }}>
                PALMARÈS OFFICIEL
              </div>
              <h1 style={{ 
                color: '#FFF', 
                fontSize: '48px', 
                fontWeight: '900', 
                lineHeight: '1.05', 
                margin: '0', 
                textTransform: 'uppercase', 
                letterSpacing: '-1px',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #FBBF24 50%, #D97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 15px rgba(245, 158, 11, 0.4))'
              }}>
                {title}
              </h1>
            </div>

            {/* 10 Cards Grid (5 columns x 2 rows) */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: '15px', alignItems: 'center' }}>
              {(page.items || []).slice(0, 10).map((item, index) => {
                const rank = index + 1;
                const isTop1 = rank === 1;

                return (
                  <div key={index} style={{ 
                    height: '100%',
                    maxHeight: '430px',
                    display: 'flex', 
                    flexDirection: 'column', 
                    background: isTop1 ? 'linear-gradient(180deg, rgba(245,158,11,0.2) 0%, rgba(20,15,5,0.9) 100%)' : 'rgba(20,15,5,0.7)', 
                    borderRadius: '16px', 
                    overflow: 'hidden', 
                    border: isTop1 ? '2px solid #F59E0B' : '1px solid rgba(245,158,11,0.3)',
                    boxShadow: isTop1 ? '0 0 25px rgba(245,158,11,0.4)' : '0 4px 15px rgba(0,0,0,0.4)',
                    position: 'relative'
                  }}>
                    {/* Rank Badge Header */}
                    <div style={{ 
                      position: 'absolute', 
                      top: '8px', 
                      left: '8px', 
                      zIndex: 10,
                      background: isTop1 ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'rgba(0,0,0,0.75)',
                      color: isTop1 ? '#000' : '#FBBF24',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '900',
                      border: '1px solid rgba(245,158,11,0.4)'
                    }}>
                      {isTop1 ? '👑 #1' : `#${rank}`}
                    </div>

                    {/* Image / Portrait */}
                    <div style={{ flex: 1, position: 'relative', width: '100%', overflow: 'hidden', background: '#171105' }}>
                      {item.image ? (
                        <img 
                          src={getProxiedImageUrl(item.image)} 
                          alt=""
                          referrerPolicy="no-referrer"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBBF24', fontSize: '24px', fontWeight: 'bold' }}>
                          {(item.title || 'A')[0]}
                        </div>
                      )}
                      
                      {/* Gradient overlay on bottom of image */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50px', background: 'linear-gradient(0deg, rgba(13,10,5,1) 0%, rgba(13,10,5,0) 100%)' }} />
                    </div>

                    {/* Artist & Value Label Box */}
                    <div style={{ padding: '8px 8px 10px 8px', textAlign: 'center', background: '#0D0A05' }}>
                      <div style={{ color: '#FFF', fontSize: '13px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </div>
                      <div style={{ color: '#FBBF24', fontSize: '11px', fontWeight: '700', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.value || item.subtitle}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>


            {/* Custom Free Text Blocks Layer */}
            {(page.customBlocks || []).map((block) => (
              <div 
                key={block.id} 
                style={{ 
                  position: 'absolute', 
                  top: `${block.y ?? 50}%`, 
                  left: `${block.x ?? 50}%`, 
                  transform: 'translate(-50%, -50%)', 
                  zIndex: 999,
                  background: 'rgba(15,23,42,0.85)',
                  backdropFilter: 'blur(10px)',
                  border: '1.5px dashed #38BDF8',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <EditableText
                  text={block.text}
                  onChange={(val) => updateCustomTextBlock(block.id, { text: val })}
                  style={{
                    color: block.color || '#FFF',
                    fontSize: `${block.fontSize || 32}px`,
                    fontWeight: block.fontWeight || 'bold'
                  }}
                />
                <button 
                  onClick={() => removeCustomTextBlock(block.id)}
                  style={{ background: '#EF4444', color: '#FFF', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Supprimer ce texte libre"
                >
                  ✕
                </button>
              </div>
            ))}

            
            {/* Overlay Dégradé Sombre en Bas */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 5
            }} />

            {/* Footer */}
            <div style={{ borderTop: '1px solid rgba(245,158,11,0.2)', paddingTop: '15px', marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: '#FBBF24', fontSize: '18px', fontWeight: '800', letterSpacing: '3px' }}>{footerText || 'CULTURE MEDIA'}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: '600' }}>{partnerText || 'STATISTIQUES OFFICIELLES'}</div>
            </div>
          </div>
        </div>
      );
    } 

    if (template === 't2') {
      // GIANT TITLE TEMPLATE (MULL STYLE)
      return (
        <div style={{ width: '1080px', height: '1350px', background: '#0F172A', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
          {bgImage && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
              <img src={getProxiedImageUrl(bgImage)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            </div>
          )}
          {/* Subtle gradient to ensure text readability but keep the image clear */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.5) 100%)' }}></div>
          
          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '60px 80px' }}>
              <div style={{ color: '#FFF', fontSize: '45px', fontWeight: '900', letterSpacing: '-1px', textTransform: 'uppercase', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
                {partnerText}
              </div>
              <div style={{ color: '#FFF', fontSize: '38px', fontWeight: '900', letterSpacing: '2px', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
                CMN NEWS
              </div>
            </div>

            {/* Giant Centered Title */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <h1 style={{ 
                 color: '#FFF', 
                 fontSize: `${titleSize}px`, 
                 fontWeight: '900', 
                 lineHeight: '0.9', 
                 margin: 0, 
                 textAlign: 'center',
                 textTransform: 'uppercase',
                 letterSpacing: '-5px',
                 textShadow: '0 10px 50px rgba(0,0,0,0.8)',
                 whiteSpace: 'pre-wrap',
                 width: '100%',
                 padding: '0 40px'
               }}>
                 {renderTextWithHighlights(title, highlightColor)}
               </h1>
            </div>

            {/* Bottom Content (Optional) */}
            {content && (
               <div style={{ padding: '60px 80px', textAlign: 'center' }}>
                 <p style={{ color: '#FFF', fontSize: `${contentSize}px`, fontWeight: '600', textShadow: '0 4px 20px rgba(0,0,0,0.8)', margin: 0 }}>
                   {renderTextWithHighlights(content, highlightColor)}
                 </p>
               </div>
            )}
          </div>
        </div>
      );
    }

    if (template === 't3') {
      // MINIMAL TEXT TEMPLATE
      return (
        <div style={{ width: '1080px', height: '1350px', background: themeColor, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
          {bgImage && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.3 }}>
              <img src={getProxiedImageUrl(bgImage)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(10px)' }} referrerPolicy="no-referrer" />
            </div>
          )}
          
          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '100px 80px', boxSizing: 'border-box' }}>
            <div style={getLogoContainerStyle(logoPosition)}>
              <img src={logoSrc} alt="CMN" style={{ height: '80px', filter: logoType === 'black' ? 'none' : 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }} />
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {tag && (
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: `${tagSize}px`, fontWeight: '800', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '30px', textAlign: 'center' }}>
                  — {tag} —
                </div>
              )}
              <h1 style={{ color: '#FFF', fontSize: `${titleSize}px`, fontWeight: '900', lineHeight: '1.2', margin: '0 0 50px 0', textAlign: 'center', whiteSpace: 'pre-wrap' }}>
                {renderTextWithHighlights(title, highlightColor)}
              </h1>
              {content && (
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: `${contentSize}px`, lineHeight: '1.5', fontWeight: '400', margin: 0, textAlign: 'center', whiteSpace: 'pre-wrap' }}>
                  {renderTextWithHighlights(content, highlightColor)}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (template === 't4') {
      // ULTRA-MODERN BILLBOARD STYLE TOP 10 RANKING TEMPLATE
      return (
        <div style={{ width: '1080px', height: '1350px', background: '#0B0818', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
          {/* Ambient Glow Orbs */}
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(14,165,233,0.25) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

          {bgImage && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.18 }}>
              <img src={getProxiedImageUrl(bgImage)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(30px) saturate(180%)' }} referrerPolicy="no-referrer" />
            </div>
          )}
          
          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '45px 55px', boxSizing: 'border-box' }}>
            
            {/* Header with Logo & Tag */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src={logoSrc} alt="CMN" style={{ height: '55px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' }} />
              </div>
              {tag && (
                <span style={{ 
                  background: 'linear-gradient(135deg, #0284C7 0%, #7C3AED 100%)', 
                  color: '#FFF', 
                  padding: '8px 22px', 
                  borderRadius: '30px', 
                  fontSize: '18px', 
                  fontWeight: '800', 
                  letterSpacing: '2px', 
                  textTransform: 'uppercase',
                  boxShadow: '0 8px 25px rgba(124, 58, 237, 0.4)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  🔥 {tag}
                </span>
              )}
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <h1 style={{ 
                color: '#FFF', 
                fontSize: '50px', 
                fontWeight: '900', 
                lineHeight: '1.1', 
                margin: '0', 
                textTransform: 'uppercase', 
                letterSpacing: '-1px',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 10px 30px rgba(0,0,0,0.9)'
              }}>
                {title}
              </h1>
            </div>

            {/* Top 10 Items List */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
              {(page.items || []).slice(0, 10).map((item, index) => {
                const rank = index + 1;
                const isTop1 = rank === 1;
                const isTop2 = rank === 2;
                const isTop3 = rank === 3;

                let rowBg = 'rgba(255, 255, 255, 0.04)';
                let rowBorder = '1px solid rgba(255, 255, 255, 0.08)';
                let rankColor = 'rgba(255, 255, 255, 0.5)';
                let rankBadge = `#${rank}`;
                let rowGlow = 'none';

                if (isTop1) {
                  rowBg = 'linear-gradient(90deg, rgba(245, 158, 11, 0.25) 0%, rgba(30, 27, 75, 0.7) 100%)';
                  rowBorder = '1.5px solid rgba(245, 158, 11, 0.8)';
                  rankColor = '#FBBF24';
                  rankBadge = '👑 #1';
                  rowGlow = '0 8px 30px rgba(245, 158, 11, 0.25)';
                } else if (isTop2) {
                  rowBg = 'linear-gradient(90deg, rgba(148, 163, 184, 0.2) 0%, rgba(30, 27, 75, 0.6) 100%)';
                  rowBorder = '1.5px solid rgba(148, 163, 184, 0.6)';
                  rankColor = '#E2E8F0';
                  rankBadge = '🥈 #2';
                } else if (isTop3) {
                  rowBg = 'linear-gradient(90deg, rgba(217, 119, 6, 0.2) 0%, rgba(30, 27, 75, 0.6) 100%)';
                  rowBorder = '1.5px solid rgba(217, 119, 6, 0.6)';
                  rankColor = '#F59E0B';
                  rankBadge = '🥉 #3';
                }

                return (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    background: rowBg, 
                    borderRadius: isTop1 ? '18px' : '14px', 
                    padding: isTop1 ? '13px 20px' : '10px 16px', 
                    border: rowBorder,
                    boxShadow: rowGlow,
                    backdropFilter: 'blur(12px)'
                  }}>
                    {/* Rank Badge */}
                    <div style={{ 
                      width: isTop1 ? '85px' : '65px', 
                      color: rankColor, 
                      fontSize: isTop1 ? '25px' : '21px', 
                      fontWeight: '900',
                      letterSpacing: '-0.5px'
                    }}>
                      {rankBadge}
                    </div>

                    {/* Thumbnail */}
                    <div style={{ position: 'relative', marginRight: '16px', flexShrink: 0, width: isTop1 ? '64px' : '50px', height: isTop1 ? '64px' : '50px', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', border: isTop1 ? '2px solid #FBBF24' : '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.image ? (
                        <img 
                          src={getProxiedImageUrl(item.image)} 
                          alt=""
                          referrerPolicy="no-referrer"
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover'
                          }} 
                          onError={(e) => {
                            if (e.target.src && e.target.src.includes('maxresdefault.jpg')) {
                              e.target.src = e.target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                            } else if (e.target.src && e.target.src.includes('hqdefault.jpg')) {
                              e.target.src = e.target.src.replace('hqdefault.jpg', 'mqdefault.jpg');
                            } else {
                              e.target.style.display = 'none';
                            }
                          }}
                        />
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: isTop1 ? '20px' : '16px', fontWeight: 'bold' }}>
                          {(item.title || 'CM')[0].toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Artist & Track Info */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '10px' }}>
                      <div style={{ 
                        color: isTop1 ? '#FFF' : '#F1F5F9', 
                        fontSize: isTop1 ? '24px' : '20px', 
                        fontWeight: isTop1 ? '900' : '700', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        maxWidth: '460px' 
                      }}>
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div style={{ 
                          color: isTop1 ? '#FCD34D' : 'rgba(255,255,255,0.55)', 
                          fontSize: isTop1 ? '17px' : '15px', 
                          fontWeight: '600', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          marginTop: '2px'
                        }}>
                          {item.subtitle}
                        </div>
                      )}
                    </div>

                    {/* Metric Value Badge */}
                    <div style={{ 
                      background: isTop1 ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'rgba(255,255,255,0.08)', 
                      color: isTop1 ? '#000' : '#38BDF8', 
                      fontSize: isTop1 ? '21px' : '18px', 
                      fontWeight: '900', 
                      textAlign: 'right', 
                      padding: isTop1 ? '7px 16px' : '5px 12px',
                      borderRadius: '30px',
                      border: isTop1 ? 'none' : '1px solid rgba(56,189,248,0.3)',
                      boxShadow: isTop1 ? '0 4px 15px rgba(245,158,11,0.4)' : 'none',
                      flexShrink: 0
                    }}>
                      {item.value}
                    </div>
                  </div>
                );
              })}
            </div>


            {/* Custom Free Text Blocks Layer */}
            {(page.customBlocks || []).map((block) => (
              <div 
                key={block.id} 
                style={{ 
                  position: 'absolute', 
                  top: `${block.y ?? 50}%`, 
                  left: `${block.x ?? 50}%`, 
                  transform: 'translate(-50%, -50%)', 
                  zIndex: 999,
                  background: 'rgba(15,23,42,0.85)',
                  backdropFilter: 'blur(10px)',
                  border: '1.5px dashed #38BDF8',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <EditableText
                  text={block.text}
                  onChange={(val) => updateCustomTextBlock(block.id, { text: val })}
                  style={{
                    color: block.color || '#FFF',
                    fontSize: `${block.fontSize || 32}px`,
                    fontWeight: block.fontWeight || 'bold'
                  }}
                />
                <button 
                  onClick={() => removeCustomTextBlock(block.id)}
                  style={{ background: '#EF4444', color: '#FFF', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Supprimer ce texte libre"
                >
                  ✕
                </button>
              </div>
            ))}

            
            {/* Overlay Dégradé Sombre en Bas */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 5
            }} />

            {/* Footer */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '18px', marginTop: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '19px', fontWeight: '700', letterSpacing: '3px' }}>{footerText || 'CULTURE MEDIA'}</div>
              <div style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '5px 15px', borderRadius: '15px', fontSize: '15px', fontWeight: '600' }}>
                {partnerText || 'STATISTIQUES OFFICIELLES'}
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link href="/admin/instagram" className="admin-btn admin-btn-secondary" style={{ padding: '8px 15px' }}>
            <i className="fas fa-arrow-left"></i> Retour
          </Link>
          <h1 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Super Générateur Multipage (1080x1350)</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            onChange={(e) => {
              const session = savedSessions.find(s => s.id === e.target.value);
              if (session && session.pages_data) {
                setPages(session.pages_data);
                setSessionId(session.id);
                setCurrentIndex(0);
              }
            }}
            value={sessionId || ''}
            disabled={savedSessions.length === 0}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', background: '#F8FAFC', opacity: savedSessions.length === 0 ? 0.6 : 1 }}
          >
            <option value="">{savedSessions.length === 0 ? '📂 Aucune sauvegarde' : '📂 Charger une session...'}</option>
            {savedSessions.map((s, idx) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          <button 
            onClick={handleSaveSession} 
            disabled={isSaving}
            className="admin-btn admin-btn-secondary"
            style={{ padding: '12px 25px', fontSize: '16px', fontWeight: 'bold' }}
          >
            {isSaving ? 'Sauvegarde...' : '💾 Sauvegarder'}
          </button>
          <button 
            onClick={handleDownloadAll} 
            disabled={isDownloading}
            className="admin-btn admin-btn-primary"
            style={{ padding: '12px 25px', fontSize: '16px', fontWeight: 'bold' }}
          >
            {isDownloading ? 'Téléchargement...' : `📥 Télécharger tout (${pages.length})`}
          </button>
        </div>
      </div>

      {/* Pages Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px' }}>
        {pages.map((p, index) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', background: currentIndex === index ? 'var(--color-primary, #D32F2F)' : '#FFF', color: currentIndex === index ? '#FFF' : '#0F172A', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: currentIndex === index ? 'none' : '1px solid #E2E8F0' }}>
            <button 
              onClick={() => setCurrentIndex(index)}
              style={{ padding: '12px 20px', background: 'none', border: 'none', color: 'inherit', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
            >
              Page {index + 1}
            </button>
            {pages.length > 1 && (
              <button 
                onClick={() => removePage(index)}
                style={{ padding: '12px 15px', background: 'rgba(0,0,0,0.1)', border: 'none', color: 'inherit', cursor: 'pointer' }}
                title="Supprimer la page"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        ))}
        <button 
          onClick={addPage}
          style={{ padding: '12px 20px', background: '#F1F5F9', border: '1px dashed #94A3B8', color: '#475569', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Ajouter une page
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 500px', gap: '40px', alignItems: 'flex-start' }}>
        
        {/* LEFT: Controls */}
        <div style={{ background: '#FFF', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Réglages - Page {currentIndex + 1}</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            
            {/* CANVA-STYLE STUDIO CONTROL BUTTON */}
            <div style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', padding: '18px', borderRadius: '14px', border: '1px solid #4F46E5', boxShadow: '0 4px 15px rgba(79,70,229,0.2)', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ color: '#FFF', fontWeight: '900', fontSize: '15px' }}>⚡ Studio d'Édition Libre (Style Canva)</span>
                <span style={{ color: '#818CF8', fontSize: '12px', fontWeight: 'bold' }}>Double-clic sur l'aperçu pour éditer !</span>
              </div>
              <p style={{ color: '#A5B4FC', fontSize: '13px', margin: '0 0 12px 0' }}>
                Cliquez directement sur n'importe quel texte du visuel pour le modifier sur place, ou ajoutez des blocs de texte libres.
              </p>
              <button
                type="button"
                onClick={addCustomTextBlock}
                style={{ width: '100%', padding: '12px', background: '#4F46E5', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79,70,229,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                ➕ Ajouter un Texte Libre sur le Visuel
              </button>

              {(activePage.customBlocks || []).length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(activePage.customBlocks || []).map((b) => (
                    <div key={b.id} style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#FFF', fontSize: '12px', fontWeight: 'bold' }}>{b.text}</span>
                        <button onClick={() => removeCustomTextBlock(b.id)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕ Supprimer</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <div>
                          <span style={{ color: '#A5B4FC', fontSize: '10px' }}>Taille</span>
                          <input type="range" min="16" max="100" value={b.fontSize || 32} onChange={(e) => updateCustomTextBlock(b.id, { fontSize: Number(e.target.value) })} style={{ width: '100%' }} />
                        </div>
                        <div>
                          <span style={{ color: '#A5B4FC', fontSize: '10px' }}>Pos X ({b.x || 50}%)</span>
                          <input type="range" min="0" max="100" value={b.x || 50} onChange={(e) => updateCustomTextBlock(b.id, { x: Number(e.target.value) })} style={{ width: '100%' }} />
                        </div>
                        <div>
                          <span style={{ color: '#A5B4FC', fontSize: '10px' }}>Pos Y ({b.y || 50}%)</span>
                          <input type="range" min="0" max="100" value={b.y || 50} onChange={(e) => updateCustomTextBlock(b.id, { y: Number(e.target.value) })} style={{ width: '100%' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

<div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Template (Modèle)</label>
              <select value={activePage.template} onChange={e => updateActivePage('template', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '15px', fontWeight: 'bold' }}>
                <option value="t1">Modèle 1 : Classic Premium (Actu)</option>
                <option value="t2">Modèle 2 : Titre Géant (Style MULL)</option>
                <option value="t3">Modèle 3 : Texte Minimal (Citation/Suite)</option>
                <option value="t4">Modèle 4 : Classement Liste (Top 10)</option>
                <option value="t5">Modèle 5 : Grille Prestige Or (Top 10 Galerie 5x2)</option>
                <option value="t6">Modèle 6 : Cyber Tech Neon (4 Colonnes Biseautées - Style HBR)</option>
                <option value="t7">Modèle 7 : Web3 Glassmorphism (Halo Néon & Cartes - Style Crypto)</option>
                <option value="t8">Modèle 8 : Purple Rocket Pop (Duo/Trio Cartes Event - Style Tech)</option>
                <option value="t9">Modèle 9 : InnovateX Neon Speaker (Copie Conforme Affiche)</option>
              </select>
            </div>

            <div 
              style={{ gridColumn: '1 / -1', padding: '15px', border: '2px dashed #CBD5E1', borderRadius: '8px', background: '#F8FAFC', outline: 'none', transition: 'all 0.2s' }}
              tabIndex="0"
              onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
              onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
              onPaste={(e) => {
                const items = e.clipboardData?.items;
                if (!items) return;
                for (let i = 0; i < items.length; i++) {
                  if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                      const url = URL.createObjectURL(file);
                      updateActivePage('bgImage', url);
                      e.preventDefault();
                      break;
                    }
                  }
                }
              }}
            >
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
                Image de fond 
                <span style={{ fontWeight: 'normal', color: '#64748B', fontSize: '12px', marginLeft: '8px' }}>
                  (Cliquez dans cette zone puis <strong>Ctrl+V / Cmd+V</strong> pour coller une image)
                </span>
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ flex: 1, padding: '10px', background: '#FFF', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                {activePage.bgImage && (
                  <button 
                    onClick={handleRemoveBg}
                    disabled={isProcessingBg}
                    style={{ padding: '10px 15px', background: isProcessingBg ? '#94A3B8' : '#10B981', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isProcessingBg ? 'not-allowed' : 'pointer', minWidth: '180px' }}
                  >
                    {isProcessingBg ? (bgProgress > 0 ? `Détourage... ${bgProgress}%` : 'Détourage...') : '🪄 Détourer (IA)'}
                  </button>
                )}
              </div>
            </div>

            {activePage.template === 't2' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Texte Haut Gauche (ex: Label / Partenaire)</label>
                <input type="text" value={activePage.partnerText || ''} onChange={e => updateActivePage('partnerText', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
              </div>
            )}

            {activePage.template !== 't2' && (
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Tag (ex: NOUVEAUTÉ)</label>
                <input type="text" value={activePage.tag || ''} onChange={e => updateActivePage('tag', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
              </div>
            )}

            {activePage.template !== 't2' && (
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Couleur du Thème</label>
                <input type="color" value={activePage.themeColor || '#D32F2F'} onChange={e => updateActivePage('themeColor', e.target.value)} style={{ width: '100%', height: '42px', padding: '0', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'pointer' }} />
              </div>
            )}

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Couleur de mise en évidence (pour le texte entre *)</label>
              <input type="color" value={activePage.highlightColor || '#FBBF24'} onChange={e => updateActivePage('highlightColor', e.target.value)} style={{ width: '100%', height: '42px', padding: '0', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'pointer', marginBottom: '10px' }} />
              <p style={{fontSize: '13px', color: '#64748B', margin: '0 0 20px 0'}}>Astuce: Entourez un mot avec des astérisques pour le colorer, ex: <b>*Ceci* est coloré</b></p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Titre Principal</label>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Taille: {activePage.titleSize}</span>
              </div>
              <input type="range" min="40" max="350" value={activePage.titleSize || 80} onChange={e => updateActivePage('titleSize', Number(e.target.value))} style={{ width: '100%', marginBottom: '10px' }} />
              <textarea rows="2" value={activePage.title || ''} onChange={e => updateActivePage('title', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Texte Court</label>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Taille: {activePage.contentSize}</span>
              </div>
              <input type="range" min="20" max="100" value={activePage.contentSize || 30} onChange={e => updateActivePage('contentSize', Number(e.target.value))} style={{ width: '100%', marginBottom: '10px' }} />
              <textarea rows="3" value={activePage.content || ''} onChange={e => updateActivePage('content', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
            </div>

            {activePage.template !== 't2' && (
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Version du Logo</label>
                <select value={activePage.logoVersion || 'new'} onChange={e => updateActivePage('logoVersion', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '10px' }}>
                  <option value="new">Nouveau Logo (AFOLUKU)</option>
                  <option value="old">Ancien Logo (Culture Media)</option>
                </select>
                
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Position du Logo</label>
                <select value={activePage.logoPosition || 'top-center'} onChange={e => updateActivePage('logoPosition', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '10px' }}>
                  <option value="top-center">Haut Centre</option>
                  <option value="top-left">Haut Gauche</option>
                  <option value="top-right">Haut Droite</option>
                  <option value="bottom-center">Bas Centre</option>
                  <option value="bottom-left">Bas Gauche</option>
                  <option value="bottom-right">Bas Droite</option>
                </select>

                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Couleur du Logo</label>
                <select value={activePage.logoType || 'white'} onChange={e => updateActivePage('logoType', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <option value="white">Logo Blanc (Transparent)</option>
                  <option value="black">Logo Noir (Transparent)</option>
                  <option value="default">Logo Standard</option>
                </select>
              </div>
            )}

            {activePage.template === 't1' && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={activePage.showLive} onChange={e => updateActivePage('showLive', e.target.checked)} style={{ width: '20px', height: '20px' }} />
                  Afficher Badge "LIVE"
                </label>
              </div>
            )}

            {activePage.template === 't1' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Réseaux Sociaux (Pied de page)</label>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={activePage.socials.instagram} onChange={() => updateSocials('instagram')} /> Instagram
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={activePage.socials.youtube} onChange={() => updateSocials('youtube')} /> YouTube
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={activePage.socials.tiktok} onChange={() => updateSocials('tiktok')} /> TikTok
                  </label>
                </div>
                
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Texte du pied de page</label>
                <input type="text" value={activePage.footerText || 'AFOLUKU.COM'} onChange={e => updateActivePage('footerText', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
              </div>
            )}

          </div>
        </div>

        {/* RIGHT: Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'sticky', top: '20px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '15px', color: '#64748B' }}>Aperçu Page {currentIndex + 1}</h2>
          
          <div style={{ 
            width: '400px', height: '500px', position: 'relative', overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', borderRadius: '16px'
          }}>
            <div style={{ 
              transform: 'scale(0.37037)', transformOrigin: 'top left',
              width: '1080px', height: '1350px', position: 'absolute', top: 0, left: 0
            }}>
              
              <div id="export-template-node">
                 {renderTemplate(activePage)}
              </div>

            </div>
          </div>
        </div>
      
            {['t4', 't5', 't6', 't7', 't8', 't9'].includes(activePage.template) && (
              <div style={{ gridColumn: '1 / -1', marginTop: '10px', paddingTop: '20px', borderTop: '2px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🎨 Personnaliser les Photos & Titres du Top 10
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(activePage.items || []).slice(0, 10).map((item, idx) => (
                    <div key={idx} style={{ background: '#F8FAFC', padding: '12px 15px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: '900', fontSize: '15px', color: idx === 0 ? '#F59E0B' : (idx === 1 ? '#94A3B8' : (idx === 2 ? '#D97706' : '#64748B')), width: '28px', textAlign: 'center' }}>
                        #{idx + 1}
                      </span>
                      <div style={{ width: '45px', height: '45px', borderRadius: '8px', overflow: 'hidden', background: '#CBD5E1', flexShrink: 0, position: 'relative', border: '1px solid #CBD5E1' }}>
                        {item.image ? (
                          <img src={getProxiedImageUrl(item.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 'bold' }}>
                            {(item.title || 'A')[0]}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <input 
                          type="text" 
                          value={item.title || ''} 
                          onChange={(e) => {
                            const currentItems = [...(activePage.items || [])];
                            currentItems[idx] = { ...currentItems[idx], title: e.target.value };
                            updateActivePage('items', currentItems);
                          }}
                          placeholder="Nom de l'artiste / Titre"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="text" 
                            value={item.subtitle || ''} 
                            onChange={(e) => {
                              const currentItems = [...(activePage.items || [])];
                              currentItems[idx] = { ...currentItems[idx], subtitle: e.target.value };
                              updateActivePage('items', currentItems);
                            }}
                            placeholder="Sous-titre (ex: Artiste / Secteur)"
                            style={{ flex: 1, padding: '4px 8px', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                          />
                          <input 
                            type="text" 
                            value={item.value || ''} 
                            onChange={(e) => {
                              const currentItems = [...(activePage.items || [])];
                              currentItems[idx] = { ...currentItems[idx], value: e.target.value };
                              updateActivePage('items', currentItems);
                            }}
                            placeholder="Stat (ex: +45.2K vues)"
                            style={{ width: '120px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 12px', background: '#0EA5E9', color: '#FFF', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(14,165,233,0.2)' }}>
                          📷 Photo
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleItemImageUpload(idx, e)}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

</div>

      {/* SECTION LEGENDE */}
      <div style={{ marginTop: '30px', background: '#FFF', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Légende Classique Standard</h2>
          <button 
            onClick={generateStandardCaption}
            className="admin-btn admin-btn-primary"
            style={{ padding: '8px 15px', fontSize: '14px' }}
          >
            <i className="fas fa-magic"></i> Générer la légende
          </button>
        </div>
        <textarea 
          value={caption || ''}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Cliquez sur 'Générer la légende' ou tapez votre texte ici..."
          style={{ width: '100%', minHeight: '180px', padding: '15px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', lineHeight: '1.5', fontFamily: 'inherit' }}
        />
        {caption && (
          <button 
            onClick={() => { navigator.clipboard.writeText(caption); alert('Légende copiée !'); }}
            className="admin-btn admin-btn-secondary"
            style={{ marginTop: '10px' }}
          >
            <i className="fas fa-copy"></i> Copier
          </button>
        )}
      </div>

    </div>
  );
}