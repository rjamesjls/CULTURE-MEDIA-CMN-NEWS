'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { saveArticle } from '../../actions';
import { generateArticleDraft, adjustArticleDraft } from '../ai-generator/actions';
import SpeechButton from '@/components/SpeechButton';
import TextToSpeechButton from '@/components/TextToSpeechButton';
import 'react-quill-new/dist/quill.snow.css';

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
  const [author, setAuthor] = useState(initialData?.author || 'La Rédaction');
  const [description, setDescription] = useState(initialData?.description || '');
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || '');
  const [content, setContent] = useState(initialData?.content || '');
  
  // AI Generation States
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiSubject, setAiSubject] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [aiLinks, setAiLinks] = useState('');
  const [aiFiles, setAiFiles] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  
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
      const currentData = { title, description, content };
      const result = await adjustArticleDraft(currentData, aiEditInstruction);
      
      if (result.success && result.data) {
        if (result.data.title) setTitle(result.data.title);
        if (result.data.description) setDescription(result.data.description);
        if (result.data.content) setContent(result.data.content);
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
    if (!aiSubject.trim()) {
      setAiError("Veuillez entrer un sujet.");
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
      formData.append('subject', aiSubject);
      if (aiContext) formData.append('context', aiContext);
      if (aiLinks) formData.append('links', aiLinks);
      
      aiFiles.forEach(file => {
        formData.append('files', file);
      });

      const result = await generateArticleDraft(formData);
      
      if (result.success && result.data) {
        setTitle(result.data.title || '');
        setDescription(result.data.description || '');
        setContent(result.data.content || '');
        setAiPanelOpen(false); // Fermer le panneau après succès
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

    const formData = new FormData(e.target);
    formData.append('content', content);
    const status = e.nativeEvent?.submitter?.value || 'published';
    formData.set('status', status);

    if (initialData?.id) {
      formData.append('id', initialData.id);
    }

    try {
      await saveArticle(formData);
      router.push('/admin/articles');
    } catch (err) {
      setErrorMsg(err.message);
      setIsSubmitting(false);
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
                  <label className="admin-form-label" style={{ color: '#86198f', fontSize: '13px' }}>Photos ou PDF (Optionnel)</label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
                      if (droppedFiles.length > 0) setAiFiles(prev => [...prev, ...droppedFiles]);
                    }}
                    onPaste={(e) => {
                      const items = e.clipboardData?.items;
                      if (!items) return;
                      const newFiles = [];
                      for (let i = 0; i < items.length; i++) {
                        if (items[i].kind === 'file') {
                          const file = items[i].getAsFile();
                          if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
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
                      accept="image/*,application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files.length > 0) {
                          setAiFiles(prev => [...prev, ...Array.from(e.target.files)]);
                        }
                      }} 
                    />
                    <i className="fas fa-cloud-upload-alt" style={{ fontSize: '24px', color: '#c026d3', marginBottom: '10px' }}></i>
                    <div style={{ color: '#86198f', fontSize: '14px', fontWeight: '500' }}>
                      Cliquez, glissez-déposez ou collez (Ctrl+V) vos fichiers ici
                    </div>
                    <small style={{ color: '#a21caf', fontSize: '12px' }}>Images et PDF acceptés</small>
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

          <div className="admin-form-group">
            <label className="admin-form-label">Titre de l'article</label>
            <input 
              type="text" 
              name="title" 
              className="admin-form-control" 
              required 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              <label className="admin-form-label">Image de couverture (Upload optionnel)</label>
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
                placeholder="https://..."
              />
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
              name="description" 
              className="admin-form-control" 
              rows="3" 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div className="admin-form-group" style={{ marginBottom: '20px' }}>
            <label className="admin-form-label">Contenu de l'article</label>
            <CustomEditor 
              value={content} 
              onChange={setContent} 
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

          <div style={{ display: 'flex', gap: '15px', marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px', flexWrap: 'wrap' }}>
            <button 
              type="submit" 
              name="status"
              value="published"
              className="admin-btn admin-btn-primary" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enregistrement...' : 'Publier'}
            </button>
            <button 
              type="submit" 
              name="status"
              value="draft"
              className="admin-btn" 
              style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enregistrement...' : (initialData?.status === 'published' ? 'Repasser en brouillon' : 'Enregistrer le brouillon')}
            </button>
            <button type="button" onClick={() => router.push('/admin/articles')} className="admin-btn" style={{ backgroundColor: '#e5e7eb', color: '#374151', marginLeft: 'auto' }}>
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
            <TextToSpeechButton title={title || "Titre"} content={description + " " + content} />
          </div>
        </div>
        
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          {/* Image */}
          <div style={{ width: '100%', height: '200px', backgroundColor: '#e5e7eb', backgroundImage: imageUrl ? `url(${imageUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {!imageUrl && <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Image de couverture</div>}
          </div>
          
          <div style={{ padding: '20px' }}>
            {/* Tag */}
            <span style={{ display: 'inline-block', backgroundColor: 'var(--color-primary, #b91c1c)', color: 'white', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', marginBottom: '10px' }}>
              {category || 'Catégorie'}
            </span>
            
            {/* Titre */}
            <h2 style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)', fontSize: '24px', margin: '0 0 10px 0', lineHeight: '1.3' }}>
              {title || 'Titre de votre article...'}
            </h2>

            {/* Auteur et Date */}
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '15px' }}>
              Par <span style={{ fontWeight: '600' }}>{author || 'La Rédaction'}</span> - {new Date().toLocaleDateString('fr-FR')}
            </div>
            
            {/* Description */}
            <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: '1.5', margin: '0 0 20px 0', fontStyle: 'italic' }}>
              {description || 'Rédigez une courte description qui apparaîtra comme extrait sur la page d\'accueil...'}
            </p>
            
            {/* Content (HTML) */}
            <div 
              id="article-content"
              style={{ fontSize: '15px', lineHeight: '1.6', color: '#111827', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}
              dangerouslySetInnerHTML={{ __html: content || '<p style="color:#9ca3af;">Le contenu de votre article apparaîtra ici...</p>' }}
            />
          </div>
        </div>
      </div>
      
    </div>
  );
}
