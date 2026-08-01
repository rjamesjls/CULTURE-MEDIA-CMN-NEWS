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
  
  // New features
  const [themeColor, setThemeColor] = useState('#D32F2F');
  const [logoType, setLogoType] = useState('white');
  const [showLive, setShowLive] = useState(false);
  const [socials, setSocials] = useState({ instagram: true, youtube: false, tiktok: false });

  const templateRef = useRef(null);

  const getLogoPath = () => {
    switch(logoType) {
      case 'black': return '/backgrounds/cmn-corner-logo-black.png';
      case 'default': return '/assets/logo.png';
      case 'white': 
      default:
        return '/backgrounds/cmn-corner-logo.png';
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBgImage(url);
    }
  };

  const handleSocialChange = (net) => {
    setSocials(prev => ({ ...prev, [net]: !prev[net] }));
  };

  const handleDownload = async () => {
    if (!templateRef.current) return;
    setIsDownloading(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      
      const dataUrl = await htmlToImage.toJpeg(templateRef.current, {
        quality: 1,
        width: 1080,
        height: 1350,
        pixelRatio: 1
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
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Image de fond</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%', padding: '10px', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Tag (ex: NOUVEAUTÉ)</label>
              <input type="text" value={tag} onChange={e => setTag(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Couleur du Thème</label>
              <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} style={{ width: '100%', height: '42px', padding: '0', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'pointer' }} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Titre Principal</label>
              <textarea rows="2" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Texte Court</label>
              <textarea rows="3" value={content} onChange={e => setContent(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Type de Logo</label>
              <select value={logoType} onChange={e => setLogoType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <option value="white">Logo Blanc (Transparent)</option>
                <option value="black">Logo Noir (Transparent)</option>
                <option value="default">Logo Standard CMN</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showLive} onChange={e => setShowLive(e.target.checked)} style={{ width: '20px', height: '20px' }} />
                Afficher Badge "LIVE"
              </label>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Réseaux Sociaux (Pied de page)</label>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={socials.instagram} onChange={() => handleSocialChange('instagram')} /> Instagram
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={socials.youtube} onChange={() => handleSocialChange('youtube')} /> YouTube
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={socials.tiktok} onChange={() => handleSocialChange('tiktok')} /> TikTok
                </label>
              </div>
            </div>
            
            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
              <button 
                onClick={handleDownload} 
                disabled={isDownloading}
                style={{ 
                  width: '100%', padding: '15px', 
                  background: isDownloading ? '#94A3B8' : 'var(--color-primary, #D32F2F)', 
                  color: '#FFF', border: 'none', borderRadius: '8px', 
                  fontSize: '16px', fontWeight: 'bold', cursor: isDownloading ? 'not-allowed' : 'pointer',
                }}
              >
                {isDownloading ? 'Génération en cours...' : '📥 Télécharger l\'image'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'sticky', top: '20px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '15px', color: '#64748B' }}>Aperçu (Échelle réduite)</h2>
          
          <div style={{ 
            width: '400px', height: '500px', position: 'relative', overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', borderRadius: '16px'
          }}>
            <div style={{ 
              transform: 'scale(0.37037)', transformOrigin: 'top left',
              width: '1080px', height: '1350px', position: 'absolute', top: 0, left: 0
            }}>
              
              <div ref={templateRef} style={{ width: '1080px', height: '1350px', background: '#0F172A', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
                
                {/* Background Image */}
                {bgImage ? (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                    <img src={bgImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                  </div>
                ) : (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, background: 'linear-gradient(45deg, #1e1e1e, #2a2a2a)' }}></div>
                )}
                
                {/* Overlays */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, background: 'linear-gradient(to bottom, rgba(15,23,42,0.1) 0%, rgba(15,23,42,0.6) 40%, rgba(15,23,42,0.95) 100%)' }}></div>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.6) 100%)' }}></div>

                <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '80px', boxSizing: 'border-box' }}>
                  
                  {/* Top Logo */}
                  <div style={{ position: 'absolute', top: '70px', left: '0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <img src={getLogoPath()} alt="Culture Média News" style={{ height: '80px', filter: logoType === 'black' ? 'none' : 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }} />
                  </div>

                  {/* Tags and Live */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                    {showLive && (
                      <span style={{
                        background: '#ef4444', color: '#FFF', padding: '15px 30px', 
                        borderRadius: '40px', fontSize: '28px', fontWeight: '900', letterSpacing: '3px',
                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)', display: 'flex', alignItems: 'center', gap: '15px'
                      }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#FFF' }}></div>
                        EN DIRECT
                      </span>
                    )}
                    {tag && (
                      <span style={{ 
                        background: themeColor, // Solid color for html-to-image compatibility
                        color: '#FFF', padding: '15px 30px', borderRadius: '40px', 
                        fontSize: '28px', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase',
                        boxShadow: `0 10px 30px ${themeColor}80`, // Colored shadow
                      }}>
                        {tag}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h1 style={{ color: '#FFF', fontSize: '90px', fontWeight: '900', lineHeight: '1.05', margin: '0 0 40px 0', textShadow: '0 10px 40px rgba(0,0,0,0.5)', whiteSpace: 'pre-wrap' }}>
                    {title}
                  </h1>

                  {/* Text Content */}
                  {content && (
                    <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '42px', lineHeight: '1.4', fontWeight: '400', margin: '0 0 60px 0', borderLeft: `6px solid ${themeColor}`, paddingLeft: '30px', whiteSpace: 'pre-wrap' }}>
                      {content}
                    </p>
                  )}

                  {/* Footer Area */}
                  <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '28px', fontWeight: '600', letterSpacing: '2px' }}>
                      CULTUREMEDIA.NEWS
                    </div>
                    
                    {/* Socials */}
                    <div style={{ display: 'flex', gap: '20px', fontSize: '40px', color: 'rgba(255,255,255,0.6)' }}>
                       {socials.instagram && <i className="fab fa-instagram"></i>}
                       {socials.youtube && <i className="fab fa-youtube"></i>}
                       {socials.tiktok && <i className="fab fa-tiktok"></i>}
                       {(!socials.instagram && !socials.youtube && !socials.tiktok) && (
                          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }}></div>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }}></div>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }}></div>
                          </div>
                       )}
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
