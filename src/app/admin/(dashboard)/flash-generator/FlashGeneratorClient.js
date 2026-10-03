'use client';
import { useState, useRef, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import Link from 'next/link';

export default function FlashGeneratorClient() {
  const [globalCategory, setGlobalCategory] = useState("SPORT & JEUNESSE");
  const [globalSource, setGlobalSource] = useState("Commune de Maripasoula");
  const [globalDate, setGlobalDate] = useState(() => {
    const d = new Date();
    return `Le, ${d.getDate()} ${d.toLocaleString('fr-FR', { month: 'long' })} ${d.getFullYear()}`;
  });
  const [globalTitleFontSize, setGlobalTitleFontSize] = useState(65);
  const [globalTitleLineHeight, setGlobalTitleLineHeight] = useState(1.1);
  const [globalBodyFontSize, setGlobalBodyFontSize] = useState(46);
  const [globalBodyLineHeight, setGlobalBodyLineHeight] = useState(1.4);
  const [globalSourceX, setGlobalSourceX] = useState(135);
  const [globalSourceY, setGlobalSourceY] = useState(85);
  const [globalBadgeText, setGlobalBadgeText] = useState("#FLASH");
  const [globalBadgeFontSize, setGlobalBadgeFontSize] = useState(110);
  const [bulkText, setBulkText] = useState("");
  const [posts, setPosts] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // New states for carousel and local overrides
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [applyGlobally, setApplyGlobally] = useState(true);
  const [localOverrides, setLocalOverrides] = useState({});

  const containerRef = useRef(null);

  // Charger depuis le localStorage au premier affichage
  /* eslint-disable react-hooks/exhaustive-deps */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = localStorage.getItem('flashGeneratorSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.globalCategory) setGlobalCategory(parsed.globalCategory);
        if (parsed.globalSource) setGlobalSource(parsed.globalSource);
        if (parsed.globalTitleFontSize) setGlobalTitleFontSize(parsed.globalTitleFontSize);
        if (parsed.globalTitleLineHeight) setGlobalTitleLineHeight(parsed.globalTitleLineHeight);
        if (parsed.globalBodyFontSize) setGlobalBodyFontSize(parsed.globalBodyFontSize);
        if (parsed.globalBodyLineHeight) setGlobalBodyLineHeight(parsed.globalBodyLineHeight);
        if (parsed.globalSourceX !== undefined) setGlobalSourceX(parsed.globalSourceX);
        if (parsed.globalSourceY !== undefined) setGlobalSourceY(parsed.globalSourceY);
        if (parsed.globalBadgeText) setGlobalBadgeText(parsed.globalBadgeText);
        if (parsed.globalBadgeFontSize) setGlobalBadgeFontSize(parsed.globalBadgeFontSize);
        if (parsed.bulkText !== undefined) setBulkText(parsed.bulkText);
        if (parsed.localOverrides) setLocalOverrides(parsed.localOverrides);
        if (parsed.applyGlobally !== undefined) setApplyGlobally(parsed.applyGlobally);
      } catch (e) {
        console.error(e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Sauvegarder dans le localStorage à chaque changement
  useEffect(() => {
    if (!isLoaded) return;
    const settings = {
      globalCategory,
      globalSource,
      globalTitleFontSize,
      globalTitleLineHeight,
      globalBodyFontSize,
      globalBodyLineHeight,
      globalSourceX,
      globalSourceY,
      globalBadgeText,
      globalBadgeFontSize,
      bulkText,
      localOverrides,
      applyGlobally
    };
    localStorage.setItem('flashGeneratorSettings', JSON.stringify(settings));
  }, [globalCategory, globalSource, globalTitleFontSize, globalTitleLineHeight, globalBodyFontSize, globalBodyLineHeight, globalSourceX, globalSourceY, globalBadgeText, globalBadgeFontSize, bulkText, localOverrides, applyGlobally, isLoaded]);

function handleParse() {
    if (!bulkText.trim()) {
      setPosts([]);
      return;
    }
    const blocks = bulkText.split(/\n\s*-{3,}\s*\n/).filter(b => b.trim() !== '');
    const parsed = blocks.map((block, index) => {
      const lines = block.trim().split('\n');
      const title = lines[0] ? lines[0].trim() : "SANS TITRE";
      
      let bodyLines = lines.slice(1);
      let localSource = globalSource;
      let localCategory = globalCategory;
      let localLocation = null;

      if (bodyLines.length > 0) {
        // We look at the last 6 lines to be safe
        for (let i = bodyLines.length - 1; i >= Math.max(0, bodyLines.length - 6); i--) {
          const line = bodyLines[i].trim();
          if (line === "") continue;
          
          if (line.toLowerCase().startsWith('source :') || line.toLowerCase().startsWith('source:')) {
            localSource = line.replace(/^source\s*:/i, '').trim();
            bodyLines[i] = "";
          }
          else if (line.toLowerCase().match(/^cat[eé]gorie\s*:/)) {
            localCategory = line.replace(/^cat[eé]gorie\s*:/i, '').trim();
            bodyLines[i] = "";
          }
          else if (line.toLowerCase().startsWith('lieu :') || line.toLowerCase().startsWith('lieu:')) {
            localLocation = line.replace(/^lieu\s*:/i, '').trim();
            bodyLines[i] = "";
          }
        }
        
        while(bodyLines.length > 0 && bodyLines[bodyLines.length - 1].trim() === "") {
          bodyLines.pop();
        }
      }

      const body = bodyLines.join('\n');
      
      let location = "GUYANE";
      if (localLocation) {
        location = localLocation;
      } else if (title.includes('—')) {
        location = title.split('—').pop().trim();
      } else if (title.includes('-')) {
        location = title.split('-').pop().trim();
      }
      return { id: index, title, body, location, source: localSource, category: localCategory };
    });
    setPosts(parsed);

    // Bounds for preview index
    if (currentPreviewIndex >= parsed.length && parsed.length > 0) {
      setCurrentPreviewIndex(parsed.length - 1);
    } else if (parsed.length === 0) {
      setCurrentPreviewIndex(0);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      handleParse();
    }
  }, [bulkText, globalSource, globalCategory, isLoaded]);

  

  const getActiveValue = (key, globalValue) => {
    if (applyGlobally) return globalValue;
    return localOverrides[currentPreviewIndex]?.[key] ?? globalValue;
  };

  const handleUpdate = (key, value, globalSetter) => {
    if (applyGlobally) {
      globalSetter(value);
    } else {
      setLocalOverrides(prev => ({
        ...prev,
        [currentPreviewIndex]: {
          ...(prev[currentPreviewIndex] || {}),
          [key]: value
        }
      }));
    }
  };

  const handleDownloadAll = async () => {
    if (posts.length === 0) return;
    setIsGenerating(true);
    
    try {
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const node = document.getElementById(`flash-post-${post.id}`);
        if (!node) continue;
        
        const dataUrl = await htmlToImage.toPng(node, {
          quality: 1,
          pixelRatio: 2,
          width: 1080,
          height: 1350,
          skipFonts: false,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }
        });
        
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `flash-info-${i + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadCurrent = async () => {
    if (posts.length === 0) return;
    setIsGenerating(true);
    try {
      const post = posts[currentPreviewIndex];
      const node = document.getElementById(`flash-post-${post.id}`);
      if (!node) return;
      
      const dataUrl = await htmlToImage.toPng(node, {
        quality: 1,
        pixelRatio: 2,
        width: 1080,
        height: 1350,
        skipFonts: false,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `flash-info-${currentPreviewIndex + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderTemplate = (post, index) => {
    const bgImage = "/backgrounds/bg-template-fr.png";
    
    const override = localOverrides[index] || {};
    const tBadgeText = override.badgeText ?? globalBadgeText;
    const tBadgeFontSize = override.badgeFontSize ?? globalBadgeFontSize;
    const tTitleFontSize = override.titleFontSize ?? globalTitleFontSize;
    const tTitleLineHeight = override.titleLineHeight ?? globalTitleLineHeight;
    const tBodyFontSize = override.bodyFontSize ?? globalBodyFontSize;
    const tBodyLineHeight = override.bodyLineHeight ?? globalBodyLineHeight;
    const tSourceX = override.sourceX ?? globalSourceX;
    const tSourceY = override.sourceY ?? globalSourceY;

    return (
      <div 
        id={`flash-post-${post.id}`}
        style={{
          width: "1080px",
          height: "1350px",
          backgroundImage: `url(${bgImage})`,
          backgroundColor: "#0d069b",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          overflow: "hidden",
          fontFamily: '"Montserrat", sans-serif',
          display: "flex",
          flexDirection: "column",
          transform: "scale(0.35)",
          transformOrigin: "top left",
          flexShrink: 0,
        }}
      >
        {/* ── HEADER ── */}
        <div style={{
          padding: "20px 30px 14px 30px",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          {/* Left: Logo + NEWS badge + Tagline */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <img src="/afoluku-tv-logo.png" alt="AFOLUKU TV" style={{ height: "120px", objectFit: "contain", objectPosition: "left", marginTop: "-20px" }} crossOrigin="anonymous" />
            <div style={{ display: "flex", alignItems: "center", marginTop: "12px", gap: "14px" }}>
              <div style={{ backgroundColor: "#e41318", color: "#fff", padding: "1px 18px", borderRadius: "8px", fontWeight: "900", fontSize: "24px", letterSpacing: "2px", WebkitTextStroke: "1px #fff" }}>
                NEWS
              </div>
              <div style={{ fontSize: "19px", fontWeight: "600", color: "#fff", letterSpacing: "1px" }}>
                NOTRE MÉDIA, NOS CULTURES, NOS HISTOIRES
              </div>
            </div>
          </div>
          {/* Right: Date + Category */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", paddingTop: "4px" }}>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#fff", marginTop: "24px" }}>
              {globalDate}
            </div>
            <div style={{ backgroundColor: "#ffce00", color: "#000", padding: "6px 20px", fontWeight: "900", fontSize: "22px", borderRadius: "4px", textTransform: "uppercase" }}>
              {post.category}
            </div>
          </div>
        </div>

        {/* #FLASH & LOCATION */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", width: "100%", flexShrink: 0, overflow: "visible", marginTop: "60px", gap: "15px" }}>
          <div style={{ color: "#fff", display: "flex", alignItems: "center" }}>
            <span style={{ fontFamily: "'Anton', sans-serif", fontSize: `${tBadgeFontSize}px`, letterSpacing: "2px", lineHeight: "1", transform: "skewX(-15deg)", display: "inline-block", WebkitTextStroke: "3px #fff" }}>
              {tBadgeText}
            </span>
          </div>

          <div style={{ backgroundColor: "#ffce00", padding: "8px 35px", display: "flex", alignItems: "center", flexShrink: 0, transform: "skewX(15deg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", transform: "skewX(-15deg)" }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#e41318" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                <circle cx="12" cy="10" r="3" fill="#e41318" stroke="none" />
              </svg>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: "42px", fontWeight: "900", color: "#e41318", display: "inline-block", paddingRight: "8px", whiteSpace: "nowrap", textTransform: "uppercase" }}>
                {post.location}
              </span>
            </div>
          </div>
        </div>

        {/* TITLE */}
        <div style={{ padding: "30px 35px 15px 35px", color: "#fff", fontSize: `${tTitleFontSize}px`, fontWeight: "900", textTransform: "uppercase", textAlign: "center", lineHeight: tTitleLineHeight }}>
          {post.title}
        </div>

        {/* BODY */}
        <div style={{ flex: 1, padding: "20px 80px 20px 80px", fontSize: `${tBodyFontSize}px`, lineHeight: tBodyLineHeight, color: "#fff", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "flex-start", textTransform: "uppercase", fontWeight: "800", whiteSpace: "pre-wrap" }}>
          {post.body}
        </div>

        {/* SOURCE */}
        <div style={{ position: "absolute", bottom: `${tSourceY}px`, left: `${tSourceX}px`, display: "flex", alignItems: "center", zIndex: 20 }}>
          <span style={{ color: "#fff", fontWeight: "bold", fontSize: "18px" }}>{post.source}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,600;1,700;1,800;1,900&display=swap');
      `}} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
        <Link href="/admin/articles" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#1f2937', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #d1d5db' }}>
          <i className="fas fa-arrow-left"></i> Retour Newsroom
        </Link>
        <h1 style={{ margin: 0, fontSize: '28px' }}><i className="fas fa-bolt" style={{ color: '#e41318' }}></i> Générateur Flash Info Rapide</h1>
      </div>

      <div className="responsive-flex-row">

        {/* COLUMN 2: SETTINGS */}
        <div style={{ flex: "1 1 300px", maxWidth: "100%", display: 'flex', flexDirection: 'column', gap: '15px' }}>

          
          <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', color: '#1f2937' }}>
              <input 
                type="checkbox" 
                checked={applyGlobally} 
                onChange={e => setApplyGlobally(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              Appliquer les réglages à toutes les images
            </label>
            {!applyGlobally && (
              <p style={{ margin: '5px 0 0 28px', fontSize: '12px', color: '#6b7280' }}>
                Les modifications affecteront uniquement l&apos;image {currentPreviewIndex + 1}.</p>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontWeight: 'bold', margin: 0 }}>Titre Principal</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button 
                  onClick={() => handleUpdate('badgeText', "#FLASH", setGlobalBadgeText)}
                  style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: getActiveValue('badgeText', globalBadgeText) === "#FLASH" ? '#0d069b' : '#e5e7eb', color: getActiveValue('badgeText', globalBadgeText) === "#FLASH" ? '#fff' : '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  #FLASH
                </button>
                <button 
                  onClick={() => handleUpdate('badgeText', "BREAKING NEWS", setGlobalBadgeText)}
                  style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: getActiveValue('badgeText', globalBadgeText) === "BREAKING NEWS" ? '#0d069b' : '#e5e7eb', color: getActiveValue('badgeText', globalBadgeText) === "BREAKING NEWS" ? '#fff' : '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  BREAKING NEWS
                </button>
              </div>
            </div>
            <input 
              type="text" 
              value={getActiveValue('badgeText', globalBadgeText)} 
              onChange={e => handleUpdate('badgeText', e.target.value, setGlobalBadgeText)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Taille du Titre Principal ({getActiveValue('badgeFontSize', globalBadgeFontSize)}px)</label>
            <input 
              type="range" 
              min="50" 
              max="200" 
              step="2"
              value={getActiveValue('badgeFontSize', globalBadgeFontSize)} 
              onChange={e => handleUpdate('badgeFontSize', parseInt(e.target.value), setGlobalBadgeFontSize)}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Taille du titre ({getActiveValue('titleFontSize', globalTitleFontSize)}px)</label>
            <input 
              type="range" 
              min="30" 
              max="120" 
              step="2"
              value={getActiveValue('titleFontSize', globalTitleFontSize)} 
              onChange={e => handleUpdate('titleFontSize', parseInt(e.target.value), setGlobalTitleFontSize)}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Interligne du titre ({getActiveValue('titleLineHeight', globalTitleLineHeight)})</label>
            <input 
              type="range" 
              min="0.8" 
              max="2.5" 
              step="0.05"
              value={getActiveValue('titleLineHeight', globalTitleLineHeight)} 
              onChange={e => handleUpdate('titleLineHeight', parseFloat(e.target.value), setGlobalTitleLineHeight)}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Taille du texte ({getActiveValue('bodyFontSize', globalBodyFontSize)}px)</label>
            <input 
              type="range" 
              min="20" 
              max="100" 
              step="2"
              value={getActiveValue('bodyFontSize', globalBodyFontSize)} 
              onChange={e => handleUpdate('bodyFontSize', parseInt(e.target.value), setGlobalBodyFontSize)}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Interligne du texte ({getActiveValue('bodyLineHeight', globalBodyLineHeight)})</label>
            <input 
              type="range" 
              min="1.0" 
              max="3.0" 
              step="0.1"
              value={getActiveValue('bodyLineHeight', globalBodyLineHeight)} 
              onChange={e => handleUpdate('bodyLineHeight', parseFloat(e.target.value), setGlobalBodyLineHeight)}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Catégorie Globale</label>
            <input 
              type="text" 
              value={globalCategory} 
              onChange={e => setGlobalCategory(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Source Globale</label>
            <input 
              type="text" 
              value={globalSource} 
              onChange={e => setGlobalSource(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '12px' }}>Source X ({getActiveValue('sourceX', globalSourceX)}px)</label>
              <input type="range" min="0" max="1000" step="1" value={getActiveValue('sourceX', globalSourceX)} onChange={e => handleUpdate('sourceX', parseInt(e.target.value), setGlobalSourceX)} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '12px' }}>Source Y ({getActiveValue('sourceY', globalSourceY)}px)</label>
              <input type="range" min="0" max="500" step="1" value={getActiveValue('sourceY', globalSourceY)} onChange={e => handleUpdate('sourceY', parseInt(e.target.value), setGlobalSourceY)} style={{ width: '100%' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Date</label>
            <input 
              type="text" 
              value={globalDate} 
              onChange={e => setGlobalDate(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
        </div>

        </div>

        {/* COLUMN 1: TEXT */}
        <div style={{ flex: "1 1 300px", maxWidth: "100%", display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
              Texte Brut (Séparez chaque image par ---)
            </label>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              rows="35"
              placeholder="SPORT — MARIPASOULA
La commune organise sa fête...

Ceci est un retour à la ligne avec espace (paragraphe).
Source : Mairie de Maripasoula
Catégorie : ÉVÈNEMENT\nLieu : MARIPASOULA CENTRE
---
SANTÉ — CAYENNE
Le centre hospitalier recrute...

Ici la source et catégorie globale seront utilisées."
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' }}
            />
          </div>
          
          {posts.length > 0 && (
            <div style={{ padding: '12px', backgroundColor: '#e5e7eb', color: '#374151', borderRadius: '6px', fontWeight: 'bold', textAlign: 'center', fontSize: '15px' }}>
              <i className="fas fa-check-circle" style={{ color: '#10b981', marginRight: '8px' }}></i>
              {posts.length} {posts.length > 1 ? 'images prêtes' : 'image prête'}
            </div>
          )}
          
          {posts.length > 0 && (
            <button 
              onClick={handleDownloadAll}
              disabled={isGenerating}
              style={{ padding: '12px', backgroundColor: '#e41318', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isGenerating ? 'not-allowed' : 'pointer', fontSize: '16px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}
            >
              {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-download"></i>}
              {isGenerating ? "Génération en cours..." : "Tout télécharger"}
            </button>
          )}
        </div>

        {/* RIGHT COLUMN: Previews */}
        <div style={{ flex: 1, backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '100px' }}>
              <i className="fas fa-images" style={{ fontSize: '48px', marginBottom: '15px' }}></i>
              <p>Collez votre texte pour voir les images générées.</p>
            </div>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Pagination Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <button 
                  onClick={() => setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1))}
                  disabled={currentPreviewIndex === 0}
                  style={{ padding: '8px 15px', backgroundColor: currentPreviewIndex === 0 ? '#d1d5db' : '#0d069b', color: '#fff', border: 'none', borderRadius: '6px', cursor: currentPreviewIndex === 0 ? 'not-allowed' : 'pointer' }}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <span style={{ fontWeight: 'bold', fontSize: '18px', minWidth: '80px', textAlign: 'center' }}>
                  {currentPreviewIndex + 1} / {posts.length}
                </span>
                <button 
                  onClick={() => setCurrentPreviewIndex(Math.min(posts.length - 1, currentPreviewIndex + 1))}
                  disabled={currentPreviewIndex === posts.length - 1}
                  style={{ padding: '8px 15px', backgroundColor: currentPreviewIndex === posts.length - 1 ? '#d1d5db' : '#0d069b', color: '#fff', border: 'none', borderRadius: '6px', cursor: currentPreviewIndex === posts.length - 1 ? 'not-allowed' : 'pointer' }}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>

              {/* Single Download Button */}
              <button 
                onClick={handleDownloadCurrent}
                disabled={isGenerating}
                style={{ marginBottom: '20px', padding: '10px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isGenerating ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}
              >
                {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-download"></i>}
                {isGenerating ? "Génération..." : "Télécharger cette image uniquement"}
              </button>

              {/* Carousel Container */}
              <div style={{ width: '378px', height: '472px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', width: `${posts.length * 378}px`, transform: `translateX(-${currentPreviewIndex * 378}px)`, transition: 'transform 0.3s ease-in-out' }}>
                  {posts.map((post, index) => (
                    <div key={post.id} style={{ width: '378px', height: '472px', flexShrink: 0 }}>
                      {renderTemplate(post, index)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
