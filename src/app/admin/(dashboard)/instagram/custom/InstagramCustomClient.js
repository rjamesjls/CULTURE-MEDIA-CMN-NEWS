'use client';

import { useState, useRef, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import Link from 'next/link';
import imglyRemoveBackground from '@imgly/background-removal';

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
  showLive: false,
  socials: { instagram: true, youtube: false, tiktok: false },
  titleSize: 90,
  contentSize: 42,
  tagSize: 28,
});

export default function InstagramCustomClient() {
  const [pages, setPages] = useState([createDefaultPage()]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [bgProgress, setBgProgress] = useState(0);
  
  // Create refs for each page to allow downloading all at once
  // Since we only render the active page in the DOM for preview, 
  // to download ALL, we need to temporarily render them all or download one by one by switching state.
  // Actually, for multiple downloads, we can render all pages invisibly in the DOM.
  
  const activePage = pages[currentIndex];

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
      const blob = await imglyRemoveBackground(activePage.bgImage, {
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

  const getLogoPath = (type) => {
    switch(type) {
      case 'black': return '/backgrounds/cmn-corner-logo-black.png';
      case 'default': return '/assets/logo.png';
      case 'white': 
      default:
        return '/backgrounds/cmn-corner-logo.png';
    }
  };

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

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

        const dataUrl = await htmlToImage.toJpeg(node, {
          quality: 1,
          width: 1080,
          height: 1350,
          pixelRatio: 1
        });
        
        const link = document.createElement('a');
        link.download = `CMN-Insta-Page${i+1}-${Date.now()}.jpg`;
        link.href = dataUrl;
        link.click();
        
        await delay(300); // small delay between downloads to prevent browser blocking
      }
      
      setCurrentIndex(originalIndex);
    } catch (error) {
      console.error('Failed to generate image', error);
      alert('Erreur lors de la génération des images.');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderTemplate = (page) => {
    const { template, bgImage, themeColor, logoType, showLive, tag, title, content, partnerText, socials, titleSize, contentSize, tagSize } = page;
    const logoSrc = getLogoPath(logoType);

    if (template === 't1') {
      // CLASSIC NEWS TEMPLATE
      return (
        <div style={{ width: '1080px', height: '1350px', background: '#0F172A', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
          {bgImage ? (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
              <img src={bgImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
            </div>
          ) : (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, background: 'linear-gradient(45deg, #1e1e1e, #2a2a2a)' }}></div>
          )}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, background: 'linear-gradient(to bottom, rgba(15,23,42,0.1) 0%, rgba(15,23,42,0.6) 40%, rgba(15,23,42,0.95) 100%)' }}></div>
          
          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '80px', boxSizing: 'border-box' }}>
            <div style={{ position: 'absolute', top: '70px', left: '0', width: '100%', display: 'flex', justifyContent: 'center' }}>
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
              {title}
            </h1>

            {content && (
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: `${contentSize}px`, lineHeight: '1.4', fontWeight: '400', margin: '0 0 60px 0', borderLeft: `6px solid ${themeColor}`, paddingLeft: '30px', whiteSpace: 'pre-wrap' }}>
                {content}
              </p>
            )}

            <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '28px', fontWeight: '600', letterSpacing: '2px' }}>CULTUREMEDIA.NEWS</div>
              <div style={{ display: 'flex', gap: '20px', fontSize: '40px', color: 'rgba(255,255,255,0.6)' }}>
                  {socials.instagram && <i className="fab fa-instagram"></i>}
                  {socials.youtube && <i className="fab fa-youtube"></i>}
                  {socials.tiktok && <i className="fab fa-tiktok"></i>}
              </div>
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
              <img src={bgImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
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
                 {title}
               </h1>
            </div>

            {/* Bottom Content (Optional) */}
            {content && (
               <div style={{ padding: '60px 80px', textAlign: 'center' }}>
                 <p style={{ color: '#FFF', fontSize: `${contentSize}px`, fontWeight: '600', textShadow: '0 4px 20px rgba(0,0,0,0.8)', margin: 0 }}>
                   {content}
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
              <img src={bgImage} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(10px)' }} crossOrigin="anonymous" />
            </div>
          )}
          
          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '100px 80px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '80px' }}>
              <img src={logoSrc} alt="CMN" style={{ height: '80px', filter: logoType === 'black' ? 'none' : 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }} />
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {tag && (
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: `${tagSize}px`, fontWeight: '800', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '30px', textAlign: 'center' }}>
                  — {tag} —
                </div>
              )}
              <h1 style={{ color: '#FFF', fontSize: `${titleSize}px`, fontWeight: '900', lineHeight: '1.2', margin: '0 0 50px 0', textAlign: 'center', whiteSpace: 'pre-wrap' }}>
                {title}
              </h1>
              {content && (
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: `${contentSize}px`, lineHeight: '1.5', fontWeight: '400', margin: 0, textAlign: 'center', whiteSpace: 'pre-wrap' }}>
                  {content}
                </p>
              )}
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
        <button 
          onClick={handleDownloadAll} 
          disabled={isDownloading}
          className="admin-btn admin-btn-primary"
          style={{ padding: '12px 25px', fontSize: '16px', fontWeight: 'bold' }}
        >
          {isDownloading ? 'Téléchargement...' : `📥 Télécharger tout (${pages.length})`}
        </button>
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
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Template (Modèle)</label>
              <select value={activePage.template} onChange={e => updateActivePage('template', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '15px', fontWeight: 'bold' }}>
                <option value="t1">Modèle 1 : Classic Premium (Actu)</option>
                <option value="t2">Modèle 2 : Titre Géant (Style MULL)</option>
                <option value="t3">Modèle 3 : Texte Minimal (Citation/Suite)</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Image de fond</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ flex: 1, padding: '10px', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }} />
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
                <input type="text" value={activePage.partnerText} onChange={e => updateActivePage('partnerText', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
              </div>
            )}

            {activePage.template !== 't2' && (
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Tag (ex: NOUVEAUTÉ)</label>
                <input type="text" value={activePage.tag} onChange={e => updateActivePage('tag', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
              </div>
            )}

            {activePage.template !== 't2' && (
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Couleur du Thème</label>
                <input type="color" value={activePage.themeColor} onChange={e => updateActivePage('themeColor', e.target.value)} style={{ width: '100%', height: '42px', padding: '0', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'pointer' }} />
              </div>
            )}

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Titre Principal</label>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Taille: {activePage.titleSize}</span>
              </div>
              <input type="range" min="40" max="350" value={activePage.titleSize} onChange={e => updateActivePage('titleSize', Number(e.target.value))} style={{ width: '100%', marginBottom: '10px' }} />
              <textarea rows="2" value={activePage.title} onChange={e => updateActivePage('title', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Texte Court</label>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Taille: {activePage.contentSize}</span>
              </div>
              <input type="range" min="20" max="100" value={activePage.contentSize} onChange={e => updateActivePage('contentSize', Number(e.target.value))} style={{ width: '100%', marginBottom: '10px' }} />
              <textarea rows="3" value={activePage.content} onChange={e => updateActivePage('content', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
            </div>

            {activePage.template !== 't2' && (
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Type de Logo</label>
                <select value={activePage.logoType} onChange={e => updateActivePage('logoType', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <option value="white">Logo Blanc (Transparent)</option>
                  <option value="black">Logo Noir (Transparent)</option>
                  <option value="default">Logo Standard CMN</option>
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
                <div style={{ display: 'flex', gap: '20px' }}>
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
      </div>
    </div>
  );
}
