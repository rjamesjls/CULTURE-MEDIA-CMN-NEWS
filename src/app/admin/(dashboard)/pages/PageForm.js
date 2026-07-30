'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { savePage } from './actions';

const CustomEditor = dynamic(() => import('@/components/CustomEditor'), { ssr: false });

export default function PageForm({ initialData = null }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [submitStatus, setSubmitStatus] = useState('published');

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Auto-generate slug if it's a new page and the user hasn't typed a custom slug yet
    if (!initialData) {
      setSlug(newTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('slug', slug);
    formData.append('content', content);
    formData.append('status', submitStatus);

    if (initialData?.id) {
      formData.append('id', initialData.id);
    }

    try {
      await savePage(formData);
      router.push('/admin/pages');
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
            <label className="admin-form-label">Titre de la page</label>
            <input 
              type="text" 
              name="title" 
              className="admin-form-control" 
              required 
              value={title}
              onChange={handleTitleChange}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">URL (Slug)</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ backgroundColor: '#f3f4f6', padding: '10px 15px', border: '1px solid #d1d5db', borderRight: 'none', borderRadius: '6px 0 0 6px', color: '#6b7280' }}>
                /
              </span>
              <input 
                type="text" 
                name="slug" 
                className="admin-form-control" 
                style={{ borderRadius: '0 6px 6px 0' }}
                required 
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ex: a-propos"
              />
            </div>
          </div>

          <div className="admin-form-group" style={{ marginBottom: '60px' }}>
            <label className="admin-form-label">Contenu de la page</label>
            <CustomEditor 
              value={content} 
              onChange={setContent} 
              style={{ height: '400px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '40px', borderTop: '1px solid #e5e7eb', paddingTop: '20px', flexWrap: 'wrap' }}>
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
              {isSubmitting && submitStatus === 'draft' ? 'Enregistrement...' : 'Enregistrer comme brouillon'}
            </button>
            <button type="button" onClick={() => router.push('/admin/pages')} className="admin-btn" style={{ backgroundColor: '#e5e7eb', color: '#374151', marginLeft: 'auto' }}>
              Annuler
            </button>
          </div>
        </form>
      </div>

      {/* Colonne Prévisualisation basique */}
      <div style={{ flex: '1 1 400px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', position: 'sticky', top: '20px' }}>
        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '20px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-eye"></i> Prévisualisation
        </h3>
        
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '30px' }}>
            <h1 style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)', fontSize: '32px', margin: '0 0 30px 0', lineHeight: '1.2' }}>
              {title || 'Titre de la page'}
            </h1>
            
            <div 
              style={{ fontSize: '16px', lineHeight: '1.8', color: '#111827' }}
              dangerouslySetInnerHTML={{ __html: content || '<p style="color:#9ca3af; font-style:italic;">Le contenu de votre page s\'affichera ici...</p>' }}
            />
        </div>
      </div>
      
    </div>
  );
}
