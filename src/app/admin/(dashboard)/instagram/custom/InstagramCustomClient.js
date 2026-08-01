'use client';

import { useState, useRef, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import Link from 'next/link';

export default function InstagramCustomClient() {
  const [tag, setTag] = useState('NOUVEAUTÉ');
  const [title, setTitle] = useState("Nom de l'artiste - Titre");
  const [content, setContent] = useState('Découvrez le nouveau titre dès maintenant sur toutes les plateformes.');
  const [bgImage, setBgImage] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  
  const templateRef = useRef(null);

  // Handle local image upload preview
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBgImage(url);
    }
  };

  const handleDownload = async () => {
    if (!templateRef.current) return;
    setIsDownloading(true);
    try {
      // Small delay to ensure any fonts/images are rendered
      await new Promise(r => setTimeout(r, 100));
      
      const dataUrl = await htmlToImage.toJpeg(templateRef.current, {
        quality: 1,
        width: 1080,
        height: 1350,
        pixelRatio: 1 // Force 1:1 scale export
      });
      
      const link = document.createElement('a');
      link.download = `CMN-Insta-${tag.replace(/[^a-zA-Z0-9]/g, '-')}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to generate image', error);
      alert('Erreur lors de la génération de l\'image.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <Link href="/admin/instagram" className="admin-btn admin-btn-secondary" style={{ padding: '8px 15px' }}>
          <i className="fas fa-arrow-left"></i> Retour
        </Link>
        <h1 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Générateur Info Courte (1080x1350)</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 500px', gap: '40px', alignItems: 'flex-start' }}>
        
        {/* LEFT: Controls */}
        <div style={{ background: '#FFF', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Personnalisation</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Tag / Rubrique (ex: NOUVEAUTÉ)</label>
              <input 
                type="text" 
                value={tag} 
                onChange={e => setTag(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '15px', textTransform: 'uppercase' }} 
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Titre Principal</label>
              <textarea 
                rows="2"
                value={title} 
                onChange={e => setTitle(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '15px', resize: 'vertical' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Texte Court</label>
              <textarea 
                rows="3"
                value={content} 
                onChange={e => setContent(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '15px', resize: 'vertical' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Image de fond</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ flex: 1, padding: '10px', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}
                />
              </div>
            </div>

            <button 
              onClick={handleDownload} 
              disabled={isDownloading}
              style={{ 
                marginTop: '10px', padding: '15px', 
                background: isDownloading ? '#94A3B8' : 'var(--color-primary, #D32F2F)', 
                color: '#FFF', border: 'none', borderRadius: '8px', 
                fontSize: '16px', fontWeight: 'bold', cursor: isDownloading ? 'not-allowed' : 'pointer',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
              }}
            >
              {isDownloading ? (
                <>Génération en cours...</>
              ) : (
                <><i className="fas fa-download"></i> Télécharger l'image</>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT: Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'sticky', top: '20px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '15px', color: '#64748B' }}>Aperçu (Échelle réduite)</h2>
          
          {/* This wrapper scales the 1080x1350 template down so it fits nicely in the dashboard UI */}
          <div style={{ 
            width: '400px', 
            height: '500px', // 400 * (1350/1080)
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            borderRadius: '16px'
          }}>
            <div style={{ 
              transform: 'scale(0.37037)', // 400 / 1080 = 0.37037
              transformOrigin: 'top left',
              width: '1080px',
              height: '1350px',
              position: 'absolute',
              top: 0,
              left: 0
            }}>
              
              {/* THE ACTUAL TEMPLATE EXPORTED BY HTML-TO-IMAGE */}
              <div 
                ref={templateRef} 
                style={{ 
                  width: '1080px', 
                  height: '1350px', 
                  background: '#0F172A',
                  position: 'relative',
                  overflow: 'hidden',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}
              >
                {/* Background Image with Dark Premium Overlay */}
                {bgImage ? (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                    <img src={bgImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                  </div>
                ) : (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, background: 'linear-gradient(45deg, #1e1e1e, #2a2a2a)' }}></div>
                )}
                
                {/* Gradient Overlays for readability and premium feel */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, background: 'linear-gradient(to bottom, rgba(15,23,42,0.1) 0%, rgba(15,23,42,0.6) 40%, rgba(15,23,42,0.95) 100%)' }}></div>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.6) 100%)' }}></div>

                {/* Content Container */}
                <div style={{ 
                  position: 'relative', zIndex: 10, width: '100%', height: '100%', 
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', 
                  padding: '80px', boxSizing: 'border-box' 
                }}>
                  
                  {/* Top Logo */}
                  <div style={{ position: 'absolute', top: '70px', left: '0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <img src="/assets/logo.png" alt="Culture Média News" style={{ height: '80px', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }} />
                  </div>

                  {/* Tag */}
                  {tag && (
                    <div style={{ marginBottom: '40px' }}>
                      <span style={{ 
                        background: 'rgba(255, 255, 255, 0.1)', 
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(255,255,255,0.2)',
                        color: '#FFF', 
                        padding: '15px 30px', 
                        borderRadius: '40px', 
                        fontSize: '28px', 
                        fontWeight: '800', 
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                      }}>
                        {tag}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h1 style={{ 
                    color: '#FFF', 
                    fontSize: '90px', 
                    fontWeight: '900', 
                    lineHeight: '1.05', 
                    margin: '0 0 40px 0',
                    textShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {title}
                  </h1>

                  {/* Text Content */}
                  {content && (
                    <p style={{ 
                      color: 'rgba(255,255,255,0.9)', 
                      fontSize: '42px', 
                      lineHeight: '1.4', 
                      fontWeight: '400',
                      margin: '0 0 60px 0',
                      borderLeft: '6px solid var(--color-primary, #D32F2F)',
                      paddingLeft: '30px',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {content}
                    </p>
                  )}

                  {/* Bottom Footer Area (e.g. Website URL) */}
                  <div style={{ 
                    borderTop: '2px solid rgba(255,255,255,0.1)', 
                    paddingTop: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '28px', fontWeight: '600', letterSpacing: '2px' }}>
                      CULTUREMEDIA.NEWS
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      {/* Fake social dots to look premium */}
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }}></div>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }}></div>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }}></div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
