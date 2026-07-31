'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createMagazine, updateMagazine } from '../../../actions/magazines';

export default function MagazineForm({ articles, initialData }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initialisation et migration de la structure de données
  const [pages, setPages] = useState([]);

  useEffect(() => {
    if (initialData?.content_data) {
      const data = initialData.content_data;
      if (Array.isArray(data) && data.length > 0) {
        // Migration of old data format
        if (typeof data[0] === 'string') {
          if (initialData.type === 'static') {
            setPages(data.map(url => ({ id: Math.random().toString(), type: 'advert', imageUrl: url })));
          } else {
            setPages(data.map(artId => ({ id: Math.random().toString(), type: 'article', articleId: artId })));
          }
        } else {
          // It's already the new format
          setPages(data);
        }
      }
    }
  }, [initialData]);

  const movePageUp = (index) => {
    if (index === 0) return;
    const newPages = [...pages];
    const temp = newPages[index - 1];
    newPages[index - 1] = newPages[index];
    newPages[index] = temp;
    setPages(newPages);
  };

  const movePageDown = (index) => {
    if (index === pages.length - 1) return;
    const newPages = [...pages];
    const temp = newPages[index + 1];
    newPages[index + 1] = newPages[index];
    newPages[index] = temp;
    setPages(newPages);
  };

  const removePage = (index) => {
    setPages(pages.filter((_, i) => i !== index));
  };

  const addPage = (type) => {
    const newPage = { id: Math.random().toString(), type };
    if (type === 'article') newPage.articleId = articles[0]?.id;
    if (type === 'advert') newPage.imageUrl = '';
    setPages([...pages, newPage]);
  };

  const updatePage = (index, field, value) => {
    const newPages = [...pages];
    newPages[index][field] = value;
    setPages(newPages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const formData = new FormData(e.target);
    
    // Cleanup empty image urls for adverts
    const cleanPages = pages.map(p => {
      if (p.type === 'advert' && !p.imageUrl) return null;
      return p;
    }).filter(Boolean);

    if (cleanPages.length === 0) {
      setErrorMsg("Votre magazine doit contenir au moins une page.");
      setIsSubmitting(false);
      return;
    }

    formData.append('content_data', JSON.stringify(cleanPages));
    formData.append('type', 'builder'); // Nouveau type unifié

    try {
      if (initialData) {
        await updateMagazine(initialData.id, formData);
      } else {
        await createMagazine(formData);
      }
      router.push('/admin/magazines');
    } catch (err) {
      setErrorMsg(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form-container" style={{ margin: 0, maxWidth: '1000px' }}>
      {errorMsg && (
        <div style={{ padding: '15px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px' }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        
        {/* Colonne gauche : Infos globales */}
        <div>
          <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '20px' }}>Informations générales</h3>
          <div className="admin-form-group">
            <label className="admin-form-label">Titre du magazine</label>
            <input type="text" name="title" className="admin-form-control" required defaultValue={initialData?.title || ''} placeholder="Ex: Édition Été 2026" />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Description (Optionnelle)</label>
            <textarea name="description" className="admin-form-control" rows="3" defaultValue={initialData?.description || ''}></textarea>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Image de Couverture</label>
            {initialData?.cover_image_url && (
              <div style={{ marginBottom: '10px' }}>
                <img src={initialData.cover_image_url} alt="Cover" style={{ width: '100%', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              </div>
            )}
            <input type="file" name="image_file" className="admin-form-control" accept="image/*" />
            <small style={{ color: '#6b7280', display: 'block', marginTop: '5px' }}>Laissez vide pour conserver l'image actuelle.</small>
          </div>
        </div>

        {/* Colonne droite : Chemin de fer */}
        <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Chemin de fer (Ordre des pages)</h3>
          </div>

          {pages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
              <i className="fas fa-layer-group fa-3x" style={{ marginBottom: '15px' }}></i>
              <p>Commencez à construire votre magazine en ajoutant des pages.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {pages.map((page, index) => (
                <div key={page.id} style={{ display: 'flex', gap: '15px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #d1d5db', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <button type="button" onClick={() => movePageUp(index)} disabled={index === 0} style={{ border: 'none', background: 'none', cursor: index === 0 ? 'default' : 'pointer', color: index === 0 ? '#d1d5db' : '#6b7280' }}><i className="fas fa-chevron-up"></i></button>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center', color: '#4f46e5' }}>{index + 1}</span>
                    <button type="button" onClick={() => movePageDown(index)} disabled={index === pages.length - 1} style={{ border: 'none', background: 'none', cursor: index === pages.length - 1 ? 'default' : 'pointer', color: index === pages.length - 1 ? '#d1d5db' : '#6b7280' }}><i className="fas fa-chevron-down"></i></button>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span className={`admin-badge ${
                        page.type === 'cover' ? 'badge-purple' : 
                        page.type === 'sommaire' ? 'badge-blue' : 
                        page.type === 'article' ? 'badge-green' : 
                        'badge-yellow'
                      }`}>
                        {page.type === 'cover' ? 'Page de Couverture' : 
                         page.type === 'sommaire' ? 'Sommaire (Automatique)' : 
                         page.type === 'article' ? 'Article (Html)' : 
                         'Image / Publicité'}
                      </span>
                      <button type="button" onClick={() => removePage(index)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <i className="fas fa-times"></i>
                      </button>
                    </div>

                    {page.type === 'article' && (
                      <select 
                        className="admin-form-control" 
                        value={page.articleId} 
                        onChange={(e) => updatePage(index, 'articleId', e.target.value)}
                      >
                        {articles.map(a => (
                          <option key={a.id} value={a.id}>{a.title} ({new Date(a.publication_date).toLocaleDateString()})</option>
                        ))}
                      </select>
                    )}

                    {page.type === 'advert' && (
                      <input 
                        type="url" 
                        className="admin-form-control" 
                        placeholder="https://.../image.jpg" 
                        value={page.imageUrl || ''} 
                        onChange={(e) => updatePage(index, 'imageUrl', e.target.value)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button type="button" onClick={() => addPage('cover')} className="admin-btn" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8' }}>
              + Couverture
            </button>
            <button type="button" onClick={() => addPage('sommaire')} className="admin-btn" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
              + Sommaire
            </button>
            <button type="button" onClick={() => addPage('article')} className="admin-btn" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
              + Article
            </button>
            <button type="button" onClick={() => addPage('advert')} className="admin-btn" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>
              + Image/Pub
            </button>
          </div>
        </div>

      </div>

      <div style={{ marginTop: '30px', textAlign: 'right' }}>
        <button type="submit" className="admin-btn admin-btn-primary" disabled={isSubmitting} style={{ fontSize: '16px', padding: '12px 30px' }}>
          {isSubmitting ? 'Enregistrement...' : initialData ? 'Enregistrer les modifications' : 'Créer le magazine'}
        </button>
      </div>
    </form>
  );
}
