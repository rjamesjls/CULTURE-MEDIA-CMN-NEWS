'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { saveArticle } from '../../actions';
import 'react-quill-new/dist/quill.snow.css';

const CustomEditor = dynamic(() => import('../../../../components/CustomEditor'), {
  ssr: false,
});

export default function ArticleForm({ initialData = null, categories = [] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Controlled states for live preview
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || (categories[0]?.name || ''));
  const [author, setAuthor] = useState(initialData?.author || 'La Rédaction');
  const [description, setDescription] = useState(initialData?.description || '');
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || '');
  const [content, setContent] = useState(initialData?.content || '');
  
  useEffect(() => {
    if (!initialData) {
      const aiDraftJson = sessionStorage.getItem('ai_draft');
      if (aiDraftJson) {
        try {
          const parsed = JSON.parse(aiDraftJson);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.content) setContent(parsed.content);
          
          // Clean up so it doesn't stay forever
          sessionStorage.removeItem('ai_draft');
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [initialData]);
  
  // To track which button was clicked
  const [submitStatus, setSubmitStatus] = useState('published');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const formData = new FormData(e.target);
    formData.append('content', content);
    formData.append('status', submitStatus);

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
      
      {/* Colonne Formulaire */}
      <div style={{ flex: '1 1 500px' }}>
        <form onSubmit={handleSubmit} className="admin-form-container" style={{ margin: 0 }}>
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
              <label className="admin-form-label">Image (Upload optionnel)</label>
              <input 
                type="file" 
                name="image_file" 
                accept="image/*"
                className="admin-form-control"
                style={{ padding: '7px' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (e) => setImageUrl(e.target.result);
                    reader.readAsDataURL(e.target.files[0]);
                  }
                }}
              />
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

          <div className="admin-form-group" style={{ marginBottom: '60px' }}>
            <label className="admin-form-label">Contenu de l'article</label>
            <CustomEditor 
              value={content} 
              onChange={setContent} 
              style={{ height: '300px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px', flexWrap: 'wrap' }}>
            <button 
              type="submit" 
              className="admin-btn admin-btn-primary" 
              disabled={isSubmitting}
              onClick={() => setSubmitStatus('published')}
            >
              {isSubmitting && submitStatus === 'published' ? 'Enregistrement...' : 'Publier'}
            </button>
            <button 
              type="submit" 
              className="admin-btn" 
              style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
              disabled={isSubmitting}
              onClick={() => setSubmitStatus('draft')}
            >
              {isSubmitting && submitStatus === 'draft' ? 'Enregistrement...' : 'Enregistrer le brouillon'}
            </button>
            <button type="button" onClick={() => router.push('/admin/articles')} className="admin-btn" style={{ backgroundColor: '#e5e7eb', color: '#374151', marginLeft: 'auto' }}>
              Annuler
            </button>
          </div>
        </form>
      </div>

      {/* Colonne Prévisualisation */}
      <div style={{ flex: '1 1 400px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', position: 'sticky', top: '20px' }}>
        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '20px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-eye"></i> Prévisualisation en direct
        </h3>
        
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
              style={{ fontSize: '15px', lineHeight: '1.6', color: '#111827', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}
              dangerouslySetInnerHTML={{ __html: content || '<p style="color:#9ca3af;">Le contenu de votre article apparaîtra ici...</p>' }}
            />
          </div>
        </div>
      </div>
      
    </div>
  );
}
