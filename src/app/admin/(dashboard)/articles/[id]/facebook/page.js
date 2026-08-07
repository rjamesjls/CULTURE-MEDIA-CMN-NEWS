'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { generateFacebookPost } from './facebook-actions';
import { publishToFacebook } from '../spinoffs/actions';
import { notFound } from 'next/navigation';
import SpeechButton from '@/components/SpeechButton';

export default function FacebookGeneratorPage({ params }) {
  const [article, setArticle] = useState(null);
  const [versions, setVersions] = useState([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [instructions, setInstructions] = useState('');
  
  // Publish Modal State
  const [publishModal, setPublishModal] = useState({ isOpen: false, text: null, isPublishing: false });

  // Derived state for easy binding
  const fbText = currentVersionIndex >= 0 ? versions[currentVersionIndex] : '';

  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params;
      const id = resolvedParams.id;
      
      const res = await generateFacebookPost(id);
      if (res.success) {
        setArticle(res.article);
        setVersions([res.data]);
        setCurrentVersionIndex(0);
      } else {
        setError(res.error);
      }
      setIsLoading(false);
    }
    loadData();
  }, [params]);

  const openPublishModal = (text) => {
    setPublishModal({ isOpen: true, text, isPublishing: false });
  };

  const closePublishModal = () => {
    setPublishModal({ isOpen: false, text: null, isPublishing: false });
  };

  const confirmPublish = async () => {
    if (!publishModal.text) return;
    
    setPublishModal(prev => ({ ...prev, isPublishing: true }));
    try {
      const res = await publishToFacebook(article.id, publishModal.text);
      if (res.success) {
        alert("Succès ! Post publié sur Facebook.");
        closePublishModal();
      } else {
        alert("Erreur de publication : " + res.error);
        setPublishModal(prev => ({ ...prev, isPublishing: false }));
      }
    } catch (e) {
      alert("Erreur inattendue : " + e.message);
      setPublishModal(prev => ({ ...prev, isPublishing: false }));
    }
  };

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>
        <Link href="/admin/publication-center" className="admin-btn" style={{ backgroundColor: '#e5e7eb' }}>
          Retour
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admin/publication-center" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <i className="fas fa-arrow-left"></i> Retour au Publication Center
        </Link>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#111827', margin: '0 0 10px 0' }}>
          <i className="fab fa-facebook" style={{ color: '#1877f2', marginRight: '10px' }}></i>
          Générateur de Post Facebook
        </h2>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>
          Un post optimisé pour générer de l'engagement et du clic sur votre page Facebook.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        
        {/* Aperçu Facebook */}
        <div style={{ 
          width: '500px', 
          backgroundColor: '#fff', 
          borderRadius: '8px', 
          border: '1px solid #dcdedf',
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}>
          {/* Header Post */}
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#e4e6eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-users" style={{ color: '#606770' }}></i>
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: '#050505' }}>CMN NEWS</div>
              <div style={{ fontSize: '13px', color: '#65676b' }}>À l'instant · 🌎</div>
            </div>
          </div>
          
          {/* Text Content */}
          <div style={{ padding: '4px 16px 16px 16px', fontSize: '15px', color: '#050505', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
            {isLoading ? (
              <div style={{ color: '#65676b' }}><i className="fas fa-spinner fa-spin"></i> Génération du texte...</div>
            ) : (
              fbText
            )}
          </div>

          {/* Link Preview */}
          <div style={{ borderTop: '1px solid #dcdedf', backgroundColor: '#f0f2f5' }}>
            {article?.image_url ? (
              <img src={article.image_url} alt="Cover" style={{ width: '100%', height: '260px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '260px', backgroundColor: '#e4e6eb' }}></div>
            )}
            <div style={{ padding: '10px 16px' }}>
              <div style={{ fontSize: '12px', color: '#65676b', textTransform: 'uppercase' }}>cmn-news.com</div>
              <div style={{ fontWeight: '600', fontSize: '16px', color: '#050505', margin: '4px 0' }}>{article?.title || 'Titre de l\'article'}</div>
              <div style={{ fontSize: '14px', color: '#65676b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {article?.description || 'Description de l\'article...'}
              </div>
            </div>
          </div>
        </div>

        {/* Editeur */}
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Texte généré</h3>
              
              {/* Version Navigation */}
              {versions.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#6b7280' }}>
                  <button 
                    onClick={() => setCurrentVersionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentVersionIndex === 0}
                    style={{ border: 'none', background: 'none', cursor: currentVersionIndex === 0 ? 'not-allowed' : 'pointer', color: currentVersionIndex === 0 ? '#d1d5db' : '#374151' }}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <span>Version {currentVersionIndex + 1} / {versions.length}</span>
                  <button 
                    onClick={() => setCurrentVersionIndex(prev => Math.min(versions.length - 1, prev + 1))}
                    disabled={currentVersionIndex === versions.length - 1}
                    style={{ border: 'none', background: 'none', cursor: currentVersionIndex === versions.length - 1 ? 'not-allowed' : 'pointer', color: currentVersionIndex === versions.length - 1 ? '#d1d5db' : '#374151' }}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>
            
            {isLoading ? (
              <div style={{ height: '100px', backgroundColor: '#f3f4f6', borderRadius: '8px', animation: 'pulse 2s infinite' }}></div>
            ) : (
              <>
                <textarea
                  className="admin-form-control"
                  style={{ height: '200px', marginBottom: '20px', fontSize: '15px' }}
                  value={fbText}
                  onChange={(e) => {
                    // Update only current version
                    const newVersions = [...versions];
                    newVersions[currentVersionIndex] = e.target.value;
                    setVersions(newVersions);
                  }}
                ></textarea>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <button 
                    className="admin-btn"
                    style={{ backgroundColor: '#1877f2', color: '#fff', flex: 1 }}
                    onClick={() => navigator.clipboard.writeText(fbText)}
                  >
                    <i className="fas fa-copy"></i> Copier le texte
                  </button>
                  <button 
                    className="admin-btn"
                    style={{ backgroundColor: '#1877f2', color: '#fff', flex: 1 }}
                    onClick={() => openPublishModal(fbText)}
                  >
                    <i className="fas fa-paper-plane"></i> Publier directement
                  </button>
                </div>
                
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                    Instructions pour une nouvelle version
                  </label>
                  <div style={{ position: 'relative', marginBottom: '15px' }}>
                    <textarea
                      className="admin-form-control"
                      style={{ paddingRight: '40px', minHeight: '80px', fontSize: '14px' }}
                      placeholder="Ex: Sois plus drôle, ajoute plus d'emojis, raccourcis le texte..."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                    ></textarea>
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <SpeechButton onTranscript={(text) => setInstructions(prev => prev + " " + text)} />
                    </div>
                  </div>
                  
                  <button 
                    className="admin-btn"
                    style={{ backgroundColor: '#f3f4f6', color: '#374151', width: '100%' }}
                    onClick={async () => {
                      setIsRegenerating(true);
                      const res = await generateFacebookPost(article.id, instructions);
                      if (res.success) {
                        setVersions(prev => [...prev, res.data]);
                        setCurrentVersionIndex(prev => prev + 1);
                        setInstructions('');
                      } else {
                        alert("Erreur: " + res.error);
                      }
                      setIsRegenerating(false);
                    }}
                    disabled={isRegenerating}
                  >
                    {isRegenerating ? (
                      <><i className="fas fa-spinner fa-spin"></i> Génération...</>
                    ) : (
                      <><i className="fas fa-redo"></i> Regénérer avec ces instructions</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

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
              Le lien de l'article remplacera automatiquement la balise [LIEN ICI] ou [LIEN_ARTICLE].
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
