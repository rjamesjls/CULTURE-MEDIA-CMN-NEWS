'use client';

import { useState } from 'react';
import Link from 'next/link';
import { generateSpinoff, saveSpinoffs, publishToFacebook } from './actions';
import SpeechButton from '@/components/SpeechButton';

export default function SpinoffsClient({ article, initialSpinoffs }) {
  const [versionsMap, setVersionsMap] = useState(() => {
    const init = {};
    Object.keys(initialSpinoffs || {}).forEach(k => {
      init[k] = [initialSpinoffs[k]];
    });
    return init;
  });
  const [currentIndexMap, setCurrentIndexMap] = useState(() => {
    const init = {};
    Object.keys(initialSpinoffs || {}).forEach(k => {
      init[k] = 0;
    });
    return init;
  });
  const [instructionsMap, setInstructionsMap] = useState({});
  const [activeTab, setActiveTab] = useState('social');
  const [loadingMap, setLoadingMap] = useState({});
  const [displayLangMap, setDisplayLangMap] = useState({});
  
  // Publish Modal State
  const [publishModal, setPublishModal] = useState({ isOpen: false, formatId: null, text: null, isPublishing: false });

  const TABS = [
    { id: 'social', label: 'Réseaux Sociaux', icon: 'fa-hashtag' },
    { id: 'video', label: 'Scripts Vidéo', icon: 'fa-video' },
    { id: 'audio', label: 'Audio & Radio', icon: 'fa-microphone' },
    { id: 'text', label: 'Versions Articles', icon: 'fa-file-alt' },
    { id: 'translate', label: 'Traductions', icon: 'fa-language' },
    { id: 'direct', label: 'Messages Directs', icon: 'fa-comment-dots' }
  ];

  const FORMATS = {
    social: [
      { id: 'facebook', label: 'Post Facebook', icon: 'fa-facebook', color: '#1877f2' },
      { id: 'linkedin', label: 'Post LinkedIn', icon: 'fa-linkedin', color: '#0a66c2' },
      { id: 'instagram_post', label: 'Idée Post Instagram', icon: 'fa-instagram', color: '#e1306c' },
      { id: 'instagram_caption', label: 'Légende Instagram', icon: 'fa-instagram', color: '#e1306c' }
    ],
    video: [
      { id: 'tiktok_script', label: 'Script TikTok', icon: 'fa-tiktok', color: '#000000' },
      { id: 'reel_script', label: 'Script Reel (Insta)', icon: 'fa-instagram', color: '#e1306c' },
      { id: 'youtube_short', label: 'Script YouTube Short', icon: 'fa-youtube', color: '#ff0000' }
    ],
    audio: [
      { id: 'radio_script', label: 'Script Radio', icon: 'fa-broadcast-tower', color: '#8b5cf6' },
      { id: 'podcast', label: 'Structure Podcast', icon: 'fa-podcast', color: '#8b5cf6' }
    ],
    text: [
      { id: 'flash_info', label: 'Flash Info (Dépêche)', icon: 'fa-bolt', color: '#eab308' },
      { id: 'short_version', label: 'Version Courte (100 mots)', icon: 'fa-compress-alt', color: '#10b981' },
      { id: 'medium_version', label: 'Version Moyenne (300 mots)', icon: 'fa-align-left', color: '#3b82f6' },
      { id: 'long_version', label: 'Version Longue (Analyse)', icon: 'fa-expand-alt', color: '#6366f1' },
    ],
    translate: [
      { id: 'en_translation', label: 'Traduction: Anglais', icon: 'fa-globe-americas', color: '#3b82f6' },
      { id: 'es_translation', label: 'Traduction: Espagnol', icon: 'fa-globe-europe', color: '#f59e0b' },
      { id: 'pt_translation', label: 'Traduction: Portugais', icon: 'fa-globe-americas', color: '#10b981' },
      { id: 'bushinengue_translation', label: 'Traduction: Bushinengué', icon: 'fa-globe-africa', color: '#8b5cf6' },
    ],
    direct: [
      { id: 'newsletter', label: 'Encart Newsletter', icon: 'fa-envelope', color: '#f59e0b' },
      { id: 'push_notif', label: 'Notification Push', icon: 'fa-mobile-alt', color: '#10b981' },
      { id: 'sms', label: 'SMS Informatique', icon: 'fa-sms', color: '#10b981' },
      { id: 'whatsapp', label: 'Message WhatsApp', icon: 'fa-whatsapp', color: '#25d366' }
    ]
  };

  const handleGenerate = async (formatId) => {
    setLoadingMap(prev => ({ ...prev, [formatId]: true }));
    const instructions = instructionsMap[formatId] || "";
    try {
      const res = await generateSpinoff(article.id, formatId, instructions);
      if (res.success) {
        setVersionsMap(prev => {
          const currentList = prev[formatId] || [];
          return { ...prev, [formatId]: [...currentList, res.text] };
        });
        setCurrentIndexMap(prev => {
          const currentList = versionsMap[formatId] || [];
          return { ...prev, [formatId]: currentList.length };
        });
        setInstructionsMap(prev => ({ ...prev, [formatId]: "" }));
      } else {
        alert("Erreur: " + res.error);
      }
    } catch (e) {
      alert("Erreur inattendue");
    } finally {
      setLoadingMap(prev => ({ ...prev, [formatId]: false }));
    }
  };

  const handleSaveText = async (formatId, newText) => {
    await saveSpinoffs(article.id, { [formatId]: newText });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const openPublishModal = (formatId, text) => {
    setPublishModal({ isOpen: true, formatId, text, isPublishing: false });
  };

  const closePublishModal = () => {
    setPublishModal({ isOpen: false, formatId: null, text: null, isPublishing: false });
  };

  const confirmPublish = async () => {
    if (!publishModal.formatId || !publishModal.text) return;
    
    setPublishModal(prev => ({ ...prev, isPublishing: true }));
    try {
      if (publishModal.formatId === 'facebook') {
        const res = await publishToFacebook(article.id, publishModal.text);
        if (res.success) {
          alert("Succès ! Post publié sur Facebook.");
          closePublishModal();
        } else {
          alert("Erreur de publication : " + res.error);
          setPublishModal(prev => ({ ...prev, isPublishing: false }));
        }
      } else {
        alert("Publication directe non supportée pour ce réseau pour le moment.");
        closePublishModal();
      }
    } catch (e) {
      alert("Erreur inattendue : " + e.message);
      setPublishModal(prev => ({ ...prev, isPublishing: false }));
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '50px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admin/publication-center" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <i className="fas fa-arrow-left"></i> Retour au Publication Center
        </Link>
      </div>

      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: '#111827', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>✨</span> Déclinaisons & Multi-formats
          </h2>
          <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>
            Déclinez automatiquement cet article en 15 formats différents d'un simple clic.
          </p>
        </div>
        <div style={{ backgroundColor: '#f3f4f6', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e5e7eb', maxWidth: '300px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Article Source</div>
          <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{article.title}</div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                borderRadius: '30px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#111827' : '#f3f4f6',
                color: activeTab === tab.id ? '#fff' : '#4b5563',
                fontWeight: activeTab === tab.id ? '600' : '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <i className={`fas ${tab.icon}`}></i> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {FORMATS[activeTab].map(format => {
          const versions = versionsMap[format.id] || [];
          const currentIndex = currentIndexMap[format.id] || 0;
          const currentText = versions[currentIndex];
          const instructions = instructionsMap[format.id] || "";
          
          return (
          <div key={format.id} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', color: '#111827' }}>
                <i className={`fab ${format.icon} fas ${format.icon}`} style={{ color: format.color, fontSize: '18px' }}></i>
                {format.label}
              </div>
              
              {/* Version Navigation */}
              {versions.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6b7280' }}>
                  <button 
                    onClick={() => setCurrentIndexMap(prev => ({ ...prev, [format.id]: Math.max(0, (prev[format.id] || 0) - 1) }))}
                    disabled={currentIndex === 0}
                    style={{ border: 'none', background: 'none', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', color: currentIndex === 0 ? '#d1d5db' : '#374151', padding: '0 4px' }}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <span>v{currentIndex + 1}/{versions.length}</span>
                  <button 
                    onClick={() => setCurrentIndexMap(prev => ({ ...prev, [format.id]: Math.min(versions.length - 1, (prev[format.id] || 0) + 1) }))}
                    disabled={currentIndex === versions.length - 1}
                    style={{ border: 'none', background: 'none', cursor: currentIndex === versions.length - 1 ? 'not-allowed' : 'pointer', color: currentIndex === versions.length - 1 ? '#d1d5db' : '#374151', padding: '0 4px' }}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>
            
            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              {currentText !== undefined ? (
                <>
                  {!format.id.includes('translation') && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                      <button
                        onClick={() => setDisplayLangMap(prev => ({ ...prev, [format.id]: 'fr' }))}
                        style={{
                          flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                          backgroundColor: (displayLangMap[format.id] || 'fr') === 'fr' ? '#eef2ff' : '#f3f4f6',
                          color: (displayLangMap[format.id] || 'fr') === 'fr' ? '#4f46e5' : '#6b7280',
                          border: (displayLangMap[format.id] || 'fr') === 'fr' ? '1px solid #c7d2fe' : '1px solid transparent'
                        }}
                      >
                        🇫🇷 Français
                      </button>
                      <button
                        onClick={() => setDisplayLangMap(prev => ({ ...prev, [format.id]: 'bs' }))}
                        style={{
                          flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                          backgroundColor: (displayLangMap[format.id] || 'fr') === 'bs' ? '#eef2ff' : '#f3f4f6',
                          color: (displayLangMap[format.id] || 'fr') === 'bs' ? '#4f46e5' : '#6b7280',
                          border: (displayLangMap[format.id] || 'fr') === 'bs' ? '1px solid #c7d2fe' : '1px solid transparent'
                        }}
                      >
                        🇸🇷 Bushinengué
                      </button>
                      <button
                        onClick={() => setDisplayLangMap(prev => ({ ...prev, [format.id]: 'both' }))}
                        style={{
                          flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                          backgroundColor: (displayLangMap[format.id] || 'fr') === 'both' ? '#eef2ff' : '#f3f4f6',
                          color: (displayLangMap[format.id] || 'fr') === 'both' ? '#4f46e5' : '#6b7280',
                          border: (displayLangMap[format.id] || 'fr') === 'both' ? '1px solid #c7d2fe' : '1px solid transparent'
                        }}
                      >
                        🇸🇷+🇫🇷 Bilingue
                      </button>
                    </div>
                  )}

                  <textarea
                    className="admin-form-control"
                    style={{ flex: 1, minHeight: '150px', marginBottom: '15px', fontSize: '14px', fontFamily: 'inherit' }}
                    value={(function() {
                      if (format.id.includes('translation')) return currentText;
                      const parts = currentText.split('===BUSHINENGUE===');
                      const frText = parts[0] ? parts[0].trim() : '';
                      const bsText = parts[1] ? parts[1].trim() : (parts.length > 0 ? 'Traduction Bushinengué non disponible pour cette ancienne version.' : '');
                      
                      const activeLang = displayLangMap[format.id] || 'fr';
                      if (activeLang === 'fr') return frText;
                      if (activeLang === 'bs') return bsText;
                      return `${bsText}\n\n---\n\n${frText}`;
                    })()}
                    onChange={(e) => {
                      const newText = e.target.value;
                      setVersionsMap(prev => {
                        const newV = [...(prev[format.id] || [])];
                        
                        if (format.id.includes('translation')) {
                          newV[currentIndex] = newText;
                        } else {
                          const parts = currentText.split('===BUSHINENGUE===');
                          const activeLang = displayLangMap[format.id] || 'fr';
                          
                          let frText = parts[0] ? parts[0].trim() : '';
                          let bsText = parts[1] ? parts[1].trim() : '';
                          
                          if (activeLang === 'fr') {
                            frText = newText;
                            newV[currentIndex] = `${frText}\n\n===BUSHINENGUE===\n\n${bsText}`;
                          } else if (activeLang === 'bs') {
                            bsText = newText;
                            newV[currentIndex] = `${frText}\n\n===BUSHINENGUE===\n\n${bsText}`;
                          } else {
                            const splitNew = newText.split('\n\n---\n\n');
                            if (splitNew.length > 1) {
                              bsText = splitNew[0].trim();
                              frText = splitNew.slice(1).join('\n\n---\n\n').trim();
                              newV[currentIndex] = `${frText}\n\n===BUSHINENGUE===\n\n${bsText}`;
                            } else {
                              newV[currentIndex] = newText; // they removed the separator
                            }
                          }
                        }
                        
                        return { ...prev, [format.id]: newV };
                      });
                    }}
                    onBlur={(e) => {
                      const fullTextToSave = versionsMap[format.id][currentIndex];
                      handleSaveText(format.id, fullTextToSave);
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                    <button 
                      onClick={() => {
                        let copyText = currentText;
                        if (!format.id.includes('translation')) {
                          const parts = currentText.split('===BUSHINENGUE===');
                          const frText = parts[0] ? parts[0].trim() : '';
                          const bsText = parts[1] ? parts[1].trim() : '';
                          const activeLang = displayLangMap[format.id] || 'fr';
                          
                          if (activeLang === 'fr') copyText = frText;
                          else if (activeLang === 'bs') copyText = bsText;
                          else copyText = `${bsText}\n\n---\n\n${frText}`;
                        }
                        copyToClipboard(copyText);
                      }}
                      className="admin-btn"
                      style={{ backgroundColor: '#e5e7eb', color: '#374151', fontSize: '13px', padding: '6px 12px' }}
                    >
                      <i className="fas fa-copy"></i> Copier
                    </button>
                    {format.id === 'facebook' && (
                      <button 
                        onClick={() => {
                          let publishText = currentText;
                          if (!format.id.includes('translation')) {
                            const parts = currentText.split('===BUSHINENGUE===');
                            const frText = parts[0] ? parts[0].trim() : '';
                            const bsText = parts[1] ? parts[1].trim() : '';
                            const activeLang = displayLangMap[format.id] || 'fr';
                            
                            if (activeLang === 'fr') publishText = frText;
                            else if (activeLang === 'bs') publishText = bsText;
                            else publishText = `${bsText}\n\n---\n\n${frText}`;
                          }
                          openPublishModal(format.id, publishText);
                        }}
                        className="admin-btn"
                        style={{ backgroundColor: '#1877f2', color: '#fff', fontSize: '13px', padding: '6px 12px', marginLeft: '10px' }}
                      >
                        <i className="fas fa-paper-plane"></i> Publier directement
                      </button>
                    )}
                  </div>
                  
                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '13px', color: '#374151' }}>
                      Instructions pour regénérer
                    </label>
                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                      <textarea
                        className="admin-form-control"
                        style={{ paddingRight: '40px', minHeight: '60px', fontSize: '13px' }}
                        placeholder="Ex: Sois plus drôle..."
                        value={instructions}
                        onChange={(e) => setInstructionsMap(prev => ({ ...prev, [format.id]: e.target.value }))}
                      ></textarea>
                      <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                        <SpeechButton onTranscript={(text) => setInstructionsMap(prev => ({ ...prev, [format.id]: (prev[format.id] || "") + " " + text }))} />
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleGenerate(format.id)}
                      disabled={loadingMap[format.id]}
                      className="admin-btn"
                      style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '6px 12px', fontSize: '13px', width: '100%' }}
                    >
                      {loadingMap[format.id] ? (
                        <><i className="fas fa-spinner fa-spin"></i> Génération...</>
                      ) : (
                        <><i className="fas fa-redo"></i> Regénérer</>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px', flexDirection: 'column', gap: '15px' }}>
                  <i className="fas fa-ghost" style={{ fontSize: '24px', opacity: 0.5 }}></i>
                  Aucun contenu généré pour ce format.
                  <button 
                    onClick={() => handleGenerate(format.id)}
                    disabled={loadingMap[format.id]}
                    className="admin-btn"
                    style={{ backgroundColor: '#8b5cf6', color: '#fff', padding: '8px 16px', marginTop: '10px' }}
                  >
                    {loadingMap[format.id] ? (
                      <><i className="fas fa-spinner fa-spin"></i> Création...</>
                    ) : (
                      <><i className="fas fa-magic"></i> Générer ce format</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )})}
      </div>

      {/* Publish Modal */}
      {publishModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '30px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', color: '#111827' }}>
              <i className="fas fa-paper-plane" style={{ color: '#1877f2' }}></i> Confirmer la publication
            </h3>
            <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: '1.5', marginBottom: '25px' }}>
              Êtes-vous sûr de vouloir publier ce contenu immédiatement sur la page Facebook de CMN NEWS ?<br/><br/>
              Le lien de l'article remplacera automatiquement la balise [LIEN_ARTICLE].
            </p>
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button 
                onClick={closePublishModal}
                disabled={publishModal.isPublishing}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#374151',
                  cursor: publishModal.isPublishing ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                Annuler
              </button>
              <button 
                onClick={confirmPublish}
                disabled={publishModal.isPublishing}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#1877f2',
                  color: '#fff',
                  cursor: publishModal.isPublishing ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {publishModal.isPublishing ? (
                  <><i className="fas fa-spinner fa-spin"></i> Publication en cours...</>
                ) : (
                  <>Confirmer & Publier</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
