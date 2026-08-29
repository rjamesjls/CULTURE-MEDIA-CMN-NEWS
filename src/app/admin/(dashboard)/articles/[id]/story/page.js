'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { generateStoryPost, publishStoryToMeta, getArticleForStory, saveStoryData } from './story-actions';
import { notFound } from 'next/navigation';
import * as htmlToImage from 'html-to-image';

export default function StoryGeneratorPage({ params }) {
  const [articleId, setArticleId] = useState(null);
  const [article, setArticle] = useState(null);
  
  // Nouveaux états de gestion des versions
  const [storyVersions, setStoryVersions] = useState({ fr: [], bsh: [] });
  const [currentIndex, setCurrentIndex] = useState({ fr: 0, bsh: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Nouveaux états de personnalisation
  const [bgColor, setBgColor] = useState('rgba(0,0,0,0.8)'); // Overlay color
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [textAlign, setTextAlign] = useState('center');
  const [lang, setLang] = useState('fr'); // 'fr' ou 'bsh'
  
  // Etat de publication
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState('');

  const phoneRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError('');
      const resolvedParams = await params;
      const id = resolvedParams.id;
      setArticleId(id);
      
      const res = await getArticleForStory(id);
      if (res.success) {
        setArticle(res.article);
        
        // Charger les données sauvegardées (s'il y en a)
        const savedData = res.article.story_data || { fr: [], bsh: [] };
        let initialVersions = { 
          fr: Array.isArray(savedData.fr) ? savedData.fr : [], 
          bsh: Array.isArray(savedData.bsh) ? savedData.bsh : [] 
        };
        
        // S'il n'y a AUCUNE version française enregistrée, on génère la V1 automatiquement pour gagner du temps
        if (initialVersions.fr.length === 0) {
          const genRes = await generateStoryPost(id, 'fr');
          if (genRes.success) {
            initialVersions.fr = [genRes.data];
          }
        }
        
        setStoryVersions(initialVersions);
        setCurrentIndex({
          fr: Math.max(0, initialVersions.fr.length - 1),
          bsh: Math.max(0, initialVersions.bsh.length - 1)
        });
        
      } else {
        setError(res.error);
      }
      setIsLoading(false);
    }
    loadData();
  }, [params]); // Ne dépend plus de "lang", charge une seule fois

  const handleGenerate = async () => {
    setIsGenerating(true);
    const res = await generateStoryPost(articleId, lang);
    if (res.success) {
      setStoryVersions(prev => {
        const newVersions = [...prev[lang], res.data];
        return { ...prev, [lang]: newVersions };
      });
      setCurrentIndex(prev => ({
        ...prev,
        [lang]: storyVersions[lang].length // Cible le nouvel index
      }));
    } else {
      alert("Erreur: " + res.error);
    }
    setIsGenerating(false);
  };

  const handleLangChange = async (newLang) => {
    setLang(newLang);
    // Si on bascule sur une langue qui n'a aucune version, on lance une génération automatique pour gagner du temps
    if (storyVersions[newLang].length === 0 && !isLoading && !isGenerating) {
      setIsGenerating(true);
      const res = await generateStoryPost(articleId, newLang);
      if (res.success) {
        setStoryVersions(prev => {
          const newVersions = [...prev[newLang], res.data];
          return { ...prev, [newLang]: newVersions };
        });
        setCurrentIndex(prev => ({
          ...prev,
          [newLang]: 0
        }));
      } else {
        alert("Erreur génération automatique: " + res.error);
      }
      setIsGenerating(false);
    }
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setStoryVersions(prev => {
      const currentList = [...prev[lang]];
      // Si la liste est vide, on crée un premier élément
      if (currentList.length === 0) currentList.push('');
      currentList[currentIndex[lang]] = newText;
      return { ...prev, [lang]: currentList };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await saveStoryData(articleId, storyVersions);
    setIsSaving(false);
    if (res.success) {
      alert("Versions enregistrées avec succès !");
    } else {
      alert("Erreur lors de l'enregistrement : " + res.error);
    }
  };

  const prevVersion = () => {
    setCurrentIndex(prev => ({
      ...prev,
      [lang]: Math.max(0, prev[lang] - 1)
    }));
  };

  const nextVersion = () => {
    setCurrentIndex(prev => ({
      ...prev,
      [lang]: Math.min(storyVersions[lang].length - 1, prev[lang] + 1)
    }));
  };

  const currentText = storyVersions[lang]?.[currentIndex[lang]] || '';
  const totalVersions = storyVersions[lang]?.length || 0;

  const handleDownload = async (format) => {
    if (!phoneRef.current) return;
    try {
      const dataUrl = format === 'png' 
        ? await htmlToImage.toPng(phoneRef.current, { quality: 1, pixelRatio: 2 })
        : await htmlToImage.toJpeg(phoneRef.current, { quality: 0.9, pixelRatio: 2 });
        
      const link = document.createElement('a');
      link.download = `story-${article?.id || 'cmn'}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      alert('Impossible de générer l\'image.');
    }
  };

  const handlePublish = async () => {
    if (!phoneRef.current) return;
    setIsPublishing(true);
    setPublishMessage('');
    try {
      const dataUrl = await htmlToImage.toJpeg(phoneRef.current, { quality: 0.9, pixelRatio: 2 });
      const res = await publishStoryToMeta(dataUrl);
      if (res.success) {
        setPublishMessage({ type: 'success', text: res.message });
      } else {
        setPublishMessage({ type: 'error', text: res.error });
      }
    } catch (err) {
      setPublishMessage({ type: 'error', text: "Erreur technique lors de la publication." });
    }
    setIsPublishing(false);
  };

  if (error && !article) {
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
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admin/publication-center" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <i className="fas fa-arrow-left"></i> Retour au Publication Center
        </Link>
      </div>

      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: '#111827', margin: '0 0 10px 0' }}>
            <i className="fas fa-magic" style={{ color: '#c026d3', marginRight: '10px' }}></i>
            Studio Créatif Story
          </h2>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>
            Personnalisez, générez plusieurs versions, et publiez directement votre Story.
          </p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving || isLoading}
          className="admin-btn"
          style={{ backgroundColor: '#111827', color: '#fff', padding: '8px 16px' }}
        >
          {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>} Enregistrer
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 340px 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Colonne 1: Contenu & IA */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Texte & Langue</h3>
          
          {/* Onglets de vue */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button 
              onClick={() => handleLangChange('fr')}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: lang === 'fr' ? '2px solid #c026d3' : '1px solid #d1d5db', backgroundColor: lang === 'fr' ? '#fdf4ff' : '#fff', color: lang === 'fr' ? '#c026d3' : '#374151', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🇫🇷 Français
            </button>
            <button 
              onClick={() => handleLangChange('bsh')}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: lang === 'bsh' ? '2px solid #c026d3' : '1px solid #d1d5db', backgroundColor: lang === 'bsh' ? '#fdf4ff' : '#fff', color: lang === 'bsh' ? '#c026d3' : '#374151', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🇸🇷 Bushinengué
            </button>
          </div>

          {/* Contrôle des versions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', backgroundColor: '#f9fafb', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <button onClick={prevVersion} disabled={currentIndex[lang] === 0 || totalVersions === 0} style={{ border: 'none', background: 'none', cursor: currentIndex[lang] > 0 ? 'pointer' : 'not-allowed', color: currentIndex[lang] > 0 ? '#c026d3' : '#9ca3af' }}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>
              {totalVersions === 0 ? "Aucune version" : `Version ${currentIndex[lang] + 1} / ${totalVersions}`}
            </span>
            <button onClick={nextVersion} disabled={currentIndex[lang] >= totalVersions - 1 || totalVersions === 0} style={{ border: 'none', background: 'none', cursor: currentIndex[lang] < totalVersions - 1 ? 'pointer' : 'not-allowed', color: currentIndex[lang] < totalVersions - 1 ? '#c026d3' : '#9ca3af' }}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          {isLoading ? (
            <div style={{ height: '150px', backgroundColor: '#f3f4f6', borderRadius: '8px', animation: 'pulse 2s infinite' }}></div>
          ) : (
            <textarea
              className="admin-form-control"
              style={{ height: '150px', marginBottom: '15px', fontSize: '15px' }}
              value={currentText}
              onChange={handleTextChange}
              placeholder={totalVersions === 0 ? "Cliquez sur 'Générer avec l'IA' pour créer un texte..." : ""}
            ></textarea>
          )}

          {/* Bouton manuel de génération */}
          <button 
            className="admin-btn"
            style={{ width: '100%', backgroundColor: '#fdf4ff', color: '#c026d3', border: '1px solid #e879f9', padding: '10px' }}
            onClick={handleGenerate}
            disabled={isGenerating || isLoading}
          >
            {isGenerating ? (
              <><i className="fas fa-spinner fa-spin"></i> Génération en cours...</>
            ) : (
              <><i className="fas fa-robot"></i> Générer une nouvelle version IA</>
            )}
          </button>
          
          {error && <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{error}</div>}
        </div>

        {/* Colonne 2: Aperçu du téléphone */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div 
            ref={phoneRef}
            style={{ 
              width: '320px', 
              height: '568px', 
              backgroundColor: '#111827', 
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              borderRadius: '8px' // Un léger border-radius est mieux pour html-to-image que 30px avec border
            }}
          >
            {article?.image_url && (
              <img src={article.image_url} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            
            <div style={{ 
              position: 'absolute', 
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center',
              padding: '30px',
              backgroundColor: bgColor
            }}>
              {isLoading || isGenerating ? (
                <div style={{ color: '#fff', textAlign: 'center' }}>
                  <i className="fas fa-spinner fa-spin fa-2x"></i>
                </div>
              ) : (
                <div style={{ 
                  color: '#fff',
                  fontSize: '22px',
                  fontWeight: fontFamily === 'Impact' ? 'normal' : 'bold',
                  fontFamily: fontFamily,
                  lineHeight: '1.4',
                  textAlign: textAlign,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                }}>
                  {currentText}
                </div>
              )}
            </div>
            
            {/* Logo AFOLUKUTV en bas */}
            <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px' }}>
              AFOLUKUTV
            </div>
          </div>
        </div>

        {/* Colonne 3: Design & Export */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Personnalisation visuelle</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#4b5563', marginBottom: '5px', fontWeight: 'bold' }}>Filtre de fond</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setBgColor('rgba(0,0,0,0.7)')} style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#000', border: bgColor === 'rgba(0,0,0,0.7)' ? '2px solid #c026d3' : '2px solid transparent', cursor: 'pointer' }} title="Noir sombre"></button>
              <button onClick={() => setBgColor('rgba(0,0,0,0.3)')} style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#555', border: bgColor === 'rgba(0,0,0,0.3)' ? '2px solid #c026d3' : '2px solid transparent', cursor: 'pointer' }} title="Noir léger"></button>
              <button onClick={() => setBgColor('linear-gradient(to top, rgba(217,119,6,0.9), transparent)')} style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(to top, #d97706, transparent)', border: bgColor.includes('217') ? '2px solid #c026d3' : '2px solid transparent', cursor: 'pointer' }} title="Dégradé AFOLUKUTV"></button>
              <button onClick={() => setBgColor('rgba(192,38,211,0.6)')} style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#c026d3', border: bgColor === 'rgba(192,38,211,0.6)' ? '2px solid #000' : '2px solid transparent', cursor: 'pointer' }} title="Violet"></button>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#4b5563', marginBottom: '5px', fontWeight: 'bold' }}>Police d'écriture</label>
            <select className="admin-form-control" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
              <option value="sans-serif">Moderne (Sans-Serif)</option>
              <option value="serif">Classique (Serif)</option>
              <option value="Impact, sans-serif">Impact (Massif)</option>
              <option value="'Courier New', Courier, monospace">Machine à écrire</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#4b5563', marginBottom: '5px', fontWeight: 'bold' }}>Alignement</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setTextAlign('left')} style={{ flex: 1, padding: '5px', border: '1px solid #d1d5db', backgroundColor: textAlign === 'left' ? '#f3f4f6' : '#fff', borderRadius: '4px', cursor: 'pointer' }}><i className="fas fa-align-left"></i></button>
              <button onClick={() => setTextAlign('center')} style={{ flex: 1, padding: '5px', border: '1px solid #d1d5db', backgroundColor: textAlign === 'center' ? '#f3f4f6' : '#fff', borderRadius: '4px', cursor: 'pointer' }}><i className="fas fa-align-center"></i></button>
              <button onClick={() => setTextAlign('right')} style={{ flex: 1, padding: '5px', border: '1px solid #d1d5db', backgroundColor: textAlign === 'right' ? '#f3f4f6' : '#fff', borderRadius: '4px', cursor: 'pointer' }}><i className="fas fa-align-right"></i></button>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />

          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Export</h3>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button 
              className="admin-btn"
              style={{ backgroundColor: '#10b981', color: '#fff', flex: 1, padding: '10px' }}
              onClick={() => handleDownload('jpg')}
            >
              <i className="fas fa-download"></i> .JPG
            </button>
            <button 
              className="admin-btn"
              style={{ backgroundColor: '#059669', color: '#fff', flex: 1, padding: '10px' }}
              onClick={() => handleDownload('png')}
            >
              <i className="fas fa-download"></i> .PNG
            </button>
          </div>
          
          <button 
            className="admin-btn"
            style={{ backgroundColor: '#c026d3', color: '#fff', width: '100%', padding: '12px', fontSize: '15px' }}
            onClick={handlePublish}
            disabled={isPublishing}
          >
            {isPublishing ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fab fa-instagram"></i> Publier directement</>}
          </button>
          
          {publishMessage && (
            <div style={{ marginTop: '10px', padding: '10px', borderRadius: '6px', fontSize: '13px', backgroundColor: publishMessage.type === 'error' ? '#fef2f2' : '#ecfdf5', color: publishMessage.type === 'error' ? '#991b1b' : '#065f46', border: `1px solid ${publishMessage.type === 'error' ? '#fecaca' : '#a7f3d0'}` }}>
              {publishMessage.text}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
