'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { saveArticle } from '../../actions';
import { generateArticleDraft, adjustArticleDraft, generateSuperArticle } from '../ai-generator/actions';
import { translateArticle } from '../ai-studio/actions';
import SpeechButton from '@/components/SpeechButton';
import TextToSpeechButton from '@/components/TextToSpeechButton';
import 'react-quill-new/dist/quill.snow.css';
import { supabase } from '@/lib/supabase';

const CustomEditor = dynamic(() => import('../../../../components/CustomEditor'), {
  ssr: false,
});

export default function ArticleForm({ initialData = null, categories = [] }) {
  const router = useRouter();
  const imageInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Controlled states for live preview
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || (categories[0]?.name || ''));
  const [articleFormat, setArticleFormat] = useState(initialData?.seo_metadata?.article_format || 'standard');
  const [author, setAuthor] = useState(initialData?.author || 'La Rédaction');
  const [description, setDescription] = useState(initialData?.description || '');
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || '');
  const [content, setContent] = useState(initialData?.content || '');
  
  // Multilingual State (BSH)
  const [currentLang, setCurrentLang] = useState('fr');
  const [titleBsh, setTitleBsh] = useState(initialData?.title_bsh || '');
  const [descriptionBsh, setDescriptionBsh] = useState(initialData?.hook_bsh || '');
  const [contentBsh, setContentBsh] = useState(initialData?.content_bsh || '');
  const [isTranslating, setIsTranslating] = useState(false);
  
  const handleFieldChange = (field, value) => {
    if (currentLang === 'fr') {
      if (field === 'title') setTitle(value);
      if (field === 'description') setDescription(value);
      if (field === 'content') setContent(value);
    } else {
      if (field === 'title') setTitleBsh(value);
      if (field === 'description') setDescriptionBsh(value);
      if (field === 'content') setContentBsh(value);
    }
  };

  const displayedTitle = currentLang === 'fr' ? title : titleBsh;
  const displayedDescription = currentLang === 'fr' ? description : descriptionBsh;
  const displayedContent = currentLang === 'fr' ? content : contentBsh;
  
  // AI Generation States
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiSubject, setAiSubject] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [aiLinks, setAiLinks] = useState('');
  const [aiFile, setAiFile] = useState(null); // Pour le fichier multimédia (Super Generator)
  const [aiFiles, setAiFiles] = useState([]); // Array support for backward compat with dropzone
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  
  // Super Generator Dashboard States
  const [superMetadata, setSuperMetadata] = useState(null);
  
  // Image Generation States
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSearchingPhoto, setIsSearchingPhoto] = useState(false);

  // AI Editor Assistant States
  const [aiEditInstruction, setAiEditInstruction] = useState('');
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [aiEditError, setAiEditError] = useState('');
  const [aiEditPanelOpen, setAiEditPanelOpen] = useState(false);

  const handleAiEdit = async () => {
    if (!aiEditInstruction.trim()) {
      setAiEditError("Veuillez donner une instruction à l'IA (ex: Rallonge ce texte).");
      return;
    }
    setIsAiEditing(true);
    setAiEditError('');
    
    try {
      const currentData = { 
        title: displayedTitle, 
        description: displayedDescription, 
        content: displayedContent 
      };
      const result = await adjustArticleDraft(currentData, aiEditInstruction);
      
      if (result.success && result.data) {
        if (result.data.title) handleFieldChange('title', result.data.title);
        if (result.data.description) handleFieldChange('description', result.data.description);
        if (result.data.content) handleFieldChange('content', result.data.content);
        setAiEditInstruction('');
        setAiEditPanelOpen(false); // On ferme après succès
      } else {
        setAiEditError(result.error || "Erreur lors de la modification.");
      }
    } catch (err) {
      setAiEditError("Une erreur inattendue est survenue.");
    } finally {
      setIsAiEditing(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiSubject.trim() && !aiLinks && !aiFile && aiFiles.length === 0) {
      setAiError("Veuillez entrer un sujet, un lien, ou un fichier.");
      return;
    }
    
    // Anti-écrasement
    if (content.trim() || title.trim() || description.trim()) {
      if (!window.confirm("Attention : Générer un article va remplacer le titre, la description et le contenu actuels de votre formulaire. Voulez-vous continuer ?")) {
        return;
      }
    }
    
    setIsGenerating(true);
    setAiError('');

    try {
      const formData = new FormData();
      if (aiSubject) formData.append('subject', aiSubject);
      if (aiLinks) formData.append('links', aiLinks);
      if (aiFile) formData.append('file', aiFile);
      if (aiFiles.length > 0) {
        // Fallback for drag&drop logic
        formData.append('file', aiFiles[0]);
      }
      
      const result = await generateSuperArticle(formData);
      
      if (result.success && result.data) {
        const data = result.data;
        if (data.title) handleFieldChange('title', data.title);
        if (data.chapo) handleFieldChange('description', data.chapo);
        if (data.content) handleFieldChange('content', data.content);
        
        setSuperMetadata({
          alternateTitles: data.alternate_titles || [],
          summary: data.summary || '',
          metaDescription: data.meta_description || '',
          keywords: data.keywords || [],
          categories: data.categories || [],
          tags: data.tags || [],
          internalLinks: data.internal_links_suggestions || [],
          externalLinks: data.external_links_suggestions || [],
          suggestedImages: data.suggested_images || [],
          readingTime: data.reading_time || 0,
          seoScore: data.seo_score || 0,
          readabilityScore: data.readability_score || 0,
        });

        setAiPanelOpen(false);
      } else {
        setAiError(result.error || "Erreur lors de la génération.");
      }
    } catch (err) {
      setAiError("Une erreur inattendue est survenue.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleGenerateImageAI = () => {
    if (!title) {
      alert("Veuillez d'abord définir un titre d'article pour générer l'image.");
      return;
    }
    setIsGeneratingImage(true);
    // Pollinations generates instantly without API Key!
    const prompt = `Professional high quality realistic cover photo for an article titled: ${title}. ${category ? `Category: ${category}.` : ''} High resolution, cinematic lighting, masterpiece, photorealistic, no text.`;
    const seed = Math.floor(Math.random() * 1000000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=1&seed=${seed}&width=1200&height=630`;
    setImageUrl(url);
    setIsGeneratingImage(false);
  };

  const handleSearchPhoto = async () => {
    if (!title) {
      alert("Veuillez d'abord définir un titre d'article pour chercher une photo.");
      return;
    }
    setIsSearchingPhoto(true);
    try {
      // Extrait les mots-clés du titre (max 3-4 mots pour une meilleure recherche)
      const keywords = title.replace(/[^\w\s]/gi, '').split(' ').filter(w => w.length > 3).slice(0, 3).join(' ');
      const query = category ? `${category} ${keywords}` : keywords;
      
      const res = await fetch(`/api/unsplash/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (res.ok && data.url) {
        setImageUrl(data.url);
      } else {
        alert(data.error || "Aucune image trouvée ou clé API manquante.");
      }
    } catch (e) {
      alert("Erreur lors de la recherche de photo.");
    } finally {
      setIsSearchingPhoto(false);
    }
  };
  
  useEffect(() => {
    if (!initialData) {
      const aiDraftJson = sessionStorage.getItem('ai_draft');
      if (aiDraftJson) {
        try {
          const parsed = JSON.parse(aiDraftJson);
          
          // Case 1: Regular AI draft (title, desc, content)
          if (parsed.title && !parsed.aiContext) setTitle(parsed.title);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.content) setContent(parsed.content);
          
          // Case 2: Interview to Article context
          if (parsed.aiContext) {
            setAiSubject(parsed.title || "Interview");
            setAiContext(parsed.aiContext);
            setAiPanelOpen(true);
          }
          
          // Clean up so it doesn't stay forever
          sessionStorage.removeItem('ai_draft');
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [initialData]);
  
  // We will extract the status directly from the submitter button

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const formElement = e.target;
      const formData = new FormData(formElement);
      
      // Upload image_file to Supabase directly if present
      const imageFile = formData.get('image_file');
      if (imageFile && imageFile.size > 0) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `articles/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, imageFile, { upsert: false });
          
        if (uploadError) throw new Error("Erreur lors de l'upload de l'image (Supabase): " + uploadError.message);
        
        const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(fileName);
        formData.set('image_url', publicUrlData.publicUrl);
        formData.delete('image_file'); // Ne pas envoyer le fichier au Server Action
      }

      // Upload magazine_cover_file to Supabase directly if present
      const magazineCoverFile = formData.get('magazine_cover_file');
      if (magazineCoverFile && magazineCoverFile.size > 0) {
        const fileExt = magazineCoverFile.name.split('.').pop();
        const fileName = `magazines/cover_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, magazineCoverFile, { upsert: false });
          
        if (uploadError) throw new Error("Erreur lors de l'upload de la couverture magazine (Supabase): " + uploadError.message);
        
        const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(fileName);
        
        // On ajoutera ce champ dans seo_metadata
        formData.set('magazine_cover_url_temp', publicUrlData.publicUrl);
        formData.delete('magazine_cover_file'); // Ne pas envoyer le fichier au Server Action
      }

      // Vider les autres champs non nécessaires
      if (formData.get('image_url') && formData.get('image_url').startsWith('data:image/')) {
        formData.delete('image_url'); // Evite d'envoyer la string base64 énorme si on n'a pas uploadé
      }

      formData.append('title', title);
      formData.append('description', description);
      formData.append('content', content);
      formData.append('title_bsh', titleBsh);
      formData.append('hook_bsh', descriptionBsh);
      formData.append('content_bsh', contentBsh);
      
      const existingMetadata = initialData?.seo_metadata || {};
      const mergedMetadata = superMetadata ? { ...superMetadata } : { ...existingMetadata };
      mergedMetadata.article_format = articleFormat;
      
      // Récupérer l'URL uploadée
      const magCoverUrl = formData.get('magazine_cover_url_temp');
      if (magCoverUrl) {
        mergedMetadata.magazine_cover_url = magCoverUrl;
        formData.delete('magazine_cover_url_temp');
      }

      formData.append('seo_metadata', JSON.stringify(mergedMetadata));

      const status = e.nativeEvent?.submitter?.value || 'published';
      formData.set('status', status);

      if (initialData?.id) {
        formData.append('id', initialData.id);
      }

      await saveArticle(formData);
      router.push('/admin/articles');
    } catch (err) {
      setErrorMsg(err.message);
      setIsSubmitting(false);
    }
  };

  const handleTranslate = async () => {
    // Check if we have French content to translate
    if (!title && !content) {
      alert("Veuillez d'abord remplir le titre et le contenu en Français.");
      return;
    }

    setIsTranslating(true);
    try {
      const translated = await translateArticle(title, description, content, 'Bushinengué');
      setTitleBsh(translated.title || '');
      setDescriptionBsh(translated.description || '');
      setContentBsh(translated.content || '');
    } catch (error) {
      alert("Erreur de traduction : " + error.message);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      
      <div style={{ flex: '1 1 500px' }}>
        <form onSubmit={handleSubmit} className="admin-form-container" style={{ margin: 0 }}>
          
          {/* --- BLOC IA INTÉGRÉ --- */}
          <div style={{ marginBottom: '25px', backgroundColor: '#fdf4ff', border: '1px solid #f0abfc', borderRadius: '8px', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setAiPanelOpen(!aiPanelOpen)}>
              <h4 style={{ margin: 0, color: '#a21caf', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                <i className="fas fa-magic"></i> Générer l'article avec l'IA
              </h4>
              <i className={`fas fa-chevron-${aiPanelOpen ? 'up' : 'down'}`} style={{ color: '#c026d3' }}></i>
            </div>
            
            {aiPanelOpen && (
              <div style={{ marginTop: '15px', borderTop: '1px solid #f5d0fe', paddingTop: '15px' }}>
                {aiError && (
                  <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', marginBottom: '10px', fontSize: '13px' }}>
                    {aiError}
                  </div>
                )}
                <div className="admin-form-group">
                  <label className="admin-form-label" style={{ color: '#86198f', fontSize: '13px' }}>Sujet de l'article *</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="text" className="admin-form-control" value={aiSubject} onChange={(e) => setAiSubject(e.target.value)} placeholder="Ex: L'histoire du Château de Versailles" style={{ borderColor: '#e879f9', flex: 1 }} />
                    <SpeechButton onTranscript={(text) => setAiSubject(prev => prev ? prev + ' ' + text : text)} />
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label" style={{ color: '#86198f', fontSize: '13px' }}>Contexte (Optionnel)</label>
                    <div style={{ position: 'relative' }}>
                      <textarea className="admin-form-control" value={aiContext} onChange={(e) => setAiContext(e.target.value)} placeholder="Ex: Adopte un ton formel..." rows="2" style={{ borderColor: '#e879f9', paddingRight: '50px' }}></textarea>
                      <div style={{ position: 'absolute', top: '6px', right: '6px' }}>
                        <SpeechButton onTranscript={(text) => setAiContext(prev => prev ? prev + ' ' + text : text)} />
                      </div>
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label" style={{ color: '#86198f', fontSize: '13px' }}>Liens à inclure (Optionnel)</label>
                    <textarea className="admin-form-control" value={aiLinks} onChange={(e) => setAiLinks(e.target.value)} placeholder="Ex: https://wikipedia.org/..." rows="2" style={{ borderColor: '#e879f9' }}></textarea>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label" style={{ color: '#86198f', fontSize: '13px' }}>Fichiers (PDF, Audio, Vidéo, Images) (Optionnel)</label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('audio/') || f.type.startsWith('video/') || f.type === 'application/pdf');
                      if (droppedFiles.length > 0) setAiFiles(prev => [...prev, ...droppedFiles]);
                    }}
                    onPaste={(e) => {
                      const items = e.clipboardData?.items;
                      if (!items) return;
                      const newFiles = [];
                      for (let i = 0; i < items.length; i++) {
                        if (items[i].kind === 'file') {
                          const file = items[i].getAsFile();
                          if (file && (file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/') || file.type === 'application/pdf')) {
                            newFiles.push(file);
                          }
                        }
                      }
                      if (newFiles.length > 0) setAiFiles(prev => [...prev, ...newFiles]);
                    }}
                    style={{ 
                      border: '2px dashed #e879f9', 
                      borderRadius: '8px', 
                      padding: '20px', 
                      textAlign: 'center',
                      backgroundColor: '#fdf4ff',
                      cursor: 'pointer',
                      position: 'relative',
                      outline: 'none'
                    }}
                    tabIndex="0"
                    onClick={() => document.getElementById('ai-file-upload').click()}
                  >
                    <input 
                      id="ai-file-upload"
                      type="file" 
                      multiple 
                      accept="image/*,application/pdf,audio/*,video/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files.length > 0) {
                          setAiFiles(prev => [...prev, ...Array.from(e.target.files)]);
                        }
                      }} 
                    />
                    <i className="fas fa-cloud-upload-alt" style={{ fontSize: '24px', color: '#c026d3', marginBottom: '10px' }}></i>
                    <div style={{ color: '#86198f', fontSize: '14px', fontWeight: '500' }}>
                      Cliquez, glissez-déposez ou collez vos fichiers ici
                    </div>
                    <small style={{ color: '#a21caf', fontSize: '12px' }}>Max 50 Mo (PDF, Audio, Vidéo, Images)</small>
                  </div>
                  
                  {aiFiles.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {aiFiles.map((file, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#fae8ff', color: '#86198f', padding: '4px 10px', borderRadius: '15px', fontSize: '12px', border: '1px solid #f0abfc' }}>
                          <i className={file.type.includes('pdf') ? "fas fa-file-pdf" : "fas fa-image"}></i>
                          <span style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                          <i 
                            className="fas fa-times" 
                            style={{ cursor: 'pointer', marginLeft: '5px' }}
                            onClick={() => setAiFiles(aiFiles.filter((_, i) => i !== idx))}
                          ></i>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="admin-btn"
                  style={{ backgroundColor: '#a21caf', color: '#fff', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: isGenerating ? 0.7 : 1 }}
                >
                  {isGenerating ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Génération en cours (10 à 30s)...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic"></i> Lancer la génération
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          {/* --- FIN BLOC IA --- */}

          {errorMsg && (
            <div style={{ padding: '15px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '20px' }}>
              {errorMsg}
            </div>
          )}

          {/* SÉLECTEUR DE LANGUE */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
            <button
              type="button"
              onClick={() => setCurrentLang('fr')}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '15px',
                color: currentLang === 'fr' ? '#10b981' : '#6b7280',
                borderBottom: currentLang === 'fr' ? '3px solid #10b981' : '3px solid transparent',
                marginBottom: '-2px'
              }}
            >
              🇫🇷 Français (Principal)
            </button>
            <button
              type="button"
              onClick={() => setCurrentLang('bsh')}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '15px',
                color: currentLang === 'bsh' ? '#f59e0b' : '#6b7280',
                borderBottom: currentLang === 'bsh' ? '3px solid #f59e0b' : '3px solid transparent',
                marginBottom: '-2px'
              }}
            >
              🇸🇷 Bushinengué (Tongo)
            </button>
          </div>

          {currentLang !== 'fr' && (
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-language"></i> Assistant Linguistique IA
                  </h4>
                  <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#d97706' }}>
                    Traduisez automatiquement la version française en utilisant le dictionnaire local et les règles éditoriales (Knowledge Brain).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="admin-btn"
                  style={{ backgroundColor: '#f59e0b', color: '#fff', opacity: isTranslating ? 0.7 : 1, cursor: isTranslating ? 'not-allowed' : 'pointer' }}
                >
                  <i className="fas fa-magic"></i> {isTranslating ? 'Traduction en cours...' : 'Traduire depuis le Français'}
                </button>
              </div>
            </div>
          )}

          <div className="admin-form-group">
            <label className="admin-form-label">Titre de l'article</label>
            <input 
              type="text" 
              name={`title_${currentLang}`} // just to prevent standard submit conflict if needed, though we manually control it
              className="admin-form-control" 
              required={currentLang === 'fr'}
              value={displayedTitle}
              onChange={(e) => handleFieldChange('title', e.target.value)}
            />
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Catégorie</label>
              <select 
                name="category" 
                className="admin-form-control" 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Format de l'article</label>
              <select 
                className="admin-form-control" 
                value={articleFormat}
                onChange={(e) => setArticleFormat(e.target.value)}
              >
                <option value="standard">Article Standard</option>
                <option value="web_magazine">Web Magazine</option>
                <option value="special_edition">Édition Spéciale</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Auteur</label>
              <input 
                type="text" 
                name="author" 
                className="admin-form-control" 
                required 
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ex: La Rédaction"
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">
                Image de l'article (Upload optionnel)
              </label>
              <div 
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
                  if (file) {
                    if (imageInputRef.current) {
                      const dt = new DataTransfer();
                      dt.items.add(file);
                      imageInputRef.current.files = dt.files;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => setImageUrl(ev.target.result);
                    reader.readAsDataURL(file);
                  }
                }}
                onPaste={(e) => {
                  const items = e.clipboardData?.items;
                  if (!items) return;
                  for (let i = 0; i < items.length; i++) {
                    if (items[i].kind === 'file') {
                      const file = items[i].getAsFile();
                      if (file && file.type.startsWith('image/')) {
                        if (imageInputRef.current) {
                          const dt = new DataTransfer();
                          dt.items.add(file);
                          imageInputRef.current.files = dt.files;
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) => setImageUrl(ev.target.result);
                        reader.readAsDataURL(file);
                        break;
                      }
                    }
                  }
                }}
                style={{ 
                  border: '2px dashed #d1d5db', 
                  borderRadius: '8px', 
                  padding: '20px', 
                  textAlign: 'center',
                  backgroundColor: '#f9fafb',
                  cursor: 'pointer',
                  position: 'relative',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                tabIndex="0"
                onClick={() => imageInputRef.current?.click()}
              >
                <input 
                  ref={imageInputRef}
                  type="file" 
                  name="image_file" 
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setImageUrl(ev.target.result);
                      reader.readAsDataURL(e.target.files[0]);
                    }
                  }}
                />
                <i className="fas fa-image" style={{ fontSize: '24px', color: '#9ca3af', marginBottom: '10px' }}></i>
                <div style={{ color: '#4b5563', fontSize: '14px', fontWeight: '500' }}>
                  Cliquez, glissez-déposez ou collez (Ctrl+V) votre image ici
                </div>
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Ou URL de l'image (si pas d'upload)</label>
              <input 
                type="url" 
                name="image_url" 
                className="admin-form-control" 
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemple.com/image.jpg"
              />

              {articleFormat === 'web_magazine' && (
                <div className="admin-form-row" style={{ marginTop: '20px' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label" style={{ color: '#c026d3' }}>
                      Couverture spécifique du Web Magazine (Format Portrait)
                    </label>
                    <input 
                      type="file" 
                      name="magazine_cover_file" 
                      accept="image/*"
                      className="admin-form-control"
                      style={{ padding: '10px' }}
                    />
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                      Utilisée pour l'affichage en kiosque et l'en-tête de la page de lecture. 
                      Laissez vide pour réutiliser l'image principale de l'article.
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button 
                  type="button" 
                  onClick={handleGenerateImageAI}
                  disabled={isGeneratingImage}
                  className="admin-btn"
                  style={{ flex: 1, backgroundColor: '#a21caf', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                >
                  <i className="fas fa-magic"></i> {isGeneratingImage ? 'Génération...' : 'Créer via IA (Gratuit)'}
                </button>
                <button 
                  type="button" 
                  onClick={handleSearchPhoto}
                  disabled={isSearchingPhoto}
                  className="admin-btn"
                  style={{ flex: 1, backgroundColor: '#0284c7', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                >
                  <i className="fas fa-camera"></i> {isSearchingPhoto ? 'Recherche...' : 'Chercher Photo (Unsplash)'}
                </button>
              </div>
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Description courte (Extrait)</label>
            <textarea 
              name={`description_${currentLang}`}
              className="admin-form-control" 
              rows="3" 
              required={currentLang === 'fr'}
              value={displayedDescription}
              onChange={(e) => handleFieldChange('description', e.target.value)}
            ></textarea>
          </div>

          <div className="admin-form-group" style={{ marginBottom: '20px' }}>
            <label className="admin-form-label">Contenu de l'article</label>
            <CustomEditor 
              value={displayedContent} 
              onChange={(val) => handleFieldChange('content', val)} 
              style={{ height: '300px' }}
            />
          </div>

          {/* --- ASSISTANT IA MODIFICATION --- */}
          <div style={{ marginBottom: '40px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setAiEditPanelOpen(!aiEditPanelOpen)}>
              <h4 style={{ margin: 0, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                <i className="fas fa-robot"></i> Assistant IA : Modifier cet article
              </h4>
              <i className={`fas fa-chevron-${aiEditPanelOpen ? 'up' : 'down'}`} style={{ color: '#2563eb' }}></i>
            </div>
            
            {aiEditPanelOpen && (
              <div style={{ marginTop: '15px', borderTop: '1px solid #dbeafe', paddingTop: '15px' }}>
                <p style={{ fontSize: '13px', color: '#1e40af', marginBottom: '10px' }}>
                  L'IA va lire votre brouillon actuel et le réécrire selon vos consignes.
                </p>
                {aiEditError && (
                  <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', marginBottom: '10px', fontSize: '13px' }}>
                    {aiEditError}
                  </div>
                )}
                <div className="admin-form-group">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      className="admin-form-control" 
                      value={aiEditInstruction} 
                      onChange={(e) => setAiEditInstruction(e.target.value)} 
                      placeholder="Ex: Rallonge le texte, ajoute un paragraphe sur la culture locale..." 
                      style={{ borderColor: '#93c5fd', flex: 1 }} 
                    />
                    <SpeechButton onTranscript={(text) => setAiEditInstruction(prev => prev ? prev + ' ' + text : text)} />
                  </div>
                </div>


                <button 
                  type="button" 
                  onClick={handleAiEdit}
                  disabled={isAiEditing}
                  className="admin-btn"
                  style={{ backgroundColor: '#1d4ed8', color: '#fff', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: isAiEditing ? 0.7 : 1 }}
                >
                  {isAiEditing ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Modification en cours (10 à 20s)...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic"></i> Appliquer la modification
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          {/* --- FIN ASSISTANT IA MODIFICATION --- */}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px', flexWrap: 'wrap' }}>
            <button 
              type="submit" 
              name="status"
              value="published"
              className="admin-btn admin-btn-primary" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enregistrement...' : 'Publier immédiatement'}
            </button>
            <button 
              type="submit" 
              name="status"
              value="pending"
              className="admin-btn" 
              style={{ backgroundColor: '#fef08a', color: '#854d0e', border: '1px solid #fde047' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enregistrement...' : 'Soumettre pour validation'}
            </button>
            <button 
              type="submit" 
              name="status"
              value="draft"
              className="admin-btn" 
              style={{ backgroundColor: '#e5e7eb', color: '#4b5563', border: '1px solid #d1d5db' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enregistrement...' : (initialData?.status === 'published' ? 'Repasser en brouillon' : 'Enregistrer le brouillon')}
            </button>
            <button type="button" onClick={() => router.push('/admin/articles')} className="admin-btn" style={{ backgroundColor: '#f3f4f6', color: '#9ca3af', marginLeft: 'auto', border: 'none' }}>
              Annuler
            </button>
          </div>
        </form>
      </div>

      {/* Colonne Prévisualisation */}
      <div style={{ flex: '1 1 400px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', position: 'sticky', top: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <i className="fas fa-eye"></i> Prévisualisation
          </h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {initialData?.slug ? (
              <a 
                href={`/article/${initialData.slug}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="admin-btn" 
                style={{ backgroundColor: '#10b981', color: 'white', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                title="Voir la vraie page du site avec cet article"
              >
                <i className="fas fa-external-link-alt"></i> Aperçu complet
              </a>
            ) : (
              <button 
                type="button"
                onClick={() => alert("Veuillez d'abord enregistrer l'article (Brouillon ou Publier) pour pouvoir afficher l'aperçu grandeur nature sur le site.")}
                className="admin-btn" 
                style={{ backgroundColor: '#d1d5db', color: '#4b5563', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fas fa-external-link-alt"></i> Aperçu complet
              </button>
            )}
            <TextToSpeechButton title={displayedTitle || "Titre"} content={displayedDescription + " " + displayedContent} />
          </div>
        </div>
        
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          {/* Image */}
          <div style={{ width: '100%', height: '200px', backgroundColor: '#e5e7eb', backgroundImage: imageUrl ? `url(${imageUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {!imageUrl && (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontWeight: '500' }}>
                {articleFormat === 'web_magazine' ? 'Couverture Web Magazine' : 'Image de couverture'}
              </div>
            )}
          </div>
          
          {/* Super Dashboard (S'affiche si des métadonnées sont générées) */}
          {superMetadata && (
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🚀</span> Tableau de Bord IA
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div style={{ padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Score SEO</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: superMetadata.seoScore > 80 ? '#10b981' : '#f59e0b' }}>{superMetadata.seoScore}/100</div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Lisibilité</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{superMetadata.readabilityScore}/100</div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Temps de lecture</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6366f1' }}>~{superMetadata.readingTime} min</div>
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>💡 Titres Alternatifs (Note) :</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#4b5563', fontSize: '14px' }}>
                  {superMetadata.alternateTitles.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>🏷️ Mots-clés & Tags :</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[...superMetadata.keywords, ...superMetadata.tags].map((kw, i) => (
                    <span key={i} style={{ padding: '4px 8px', backgroundColor: '#e5e7eb', borderRadius: '16px', fontSize: '12px', color: '#374151' }}>{kw}</span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>📝 Résumé Analytique :</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', fontStyle: 'italic' }}>"{superMetadata.summary}"</p>
              </div>
            </div>
          )}

          {/* Affichage du Titre Principal */}
          <div style={{ padding: '20px' }}>
            {/* Tag */}
            <span style={{ display: 'inline-block', backgroundColor: 'var(--color-primary, #b91c1c)', color: 'white', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', marginBottom: '10px' }}>
              {category || 'Catégorie'}
            </span>
            
            {/* Titre */}
            <h2 style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)', fontSize: '24px', margin: '0 0 10px 0', lineHeight: '1.3' }}>
              {displayedTitle || 'Titre de votre article...'}
            </h2>

            {/* Auteur et Date */}
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '15px' }}>
              Par <span style={{ fontWeight: '600' }}>{author || 'La Rédaction'}</span> - {new Date().toLocaleDateString('fr-FR')}
            </div>
            
            {/* Description */}
            <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: '1.5', margin: '0 0 20px 0', fontStyle: 'italic' }}>
              {displayedDescription || 'Rédigez une courte description qui apparaîtra comme extrait sur la page d\'accueil...'}
            </p>
            
            {/* Content (HTML) */}
            <div 
              id="article-content"
              style={{ fontSize: '15px', lineHeight: '1.6', color: '#111827', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}
              dangerouslySetInnerHTML={{ __html: displayedContent || '<p style="color:#9ca3af;">Le contenu de votre article apparaîtra ici...</p>' }}
            />
          </div>
        </div>
      </div>
      
    </div>
  );
}
