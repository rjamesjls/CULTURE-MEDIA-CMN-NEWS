'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createIdea, updateIdea, deleteIdea } from './actions';
import { saveArticle } from '../../actions';

const COLUMNS = [
  { id: 'idea', title: '💡 Idées Nouvelles', color: '#f3f4f6', borderColor: '#e5e7eb' },
  { id: 'todo', title: '📝 À faire', color: '#eff6ff', borderColor: '#bfdbfe' },
  { id: 'in_progress', title: '⏳ En cours', color: '#fef3c7', borderColor: '#fde68a' },
  { id: 'done', title: '✅ Terminé', color: '#dcfce7', borderColor: '#bbf7d0' },
];

export default function IdeasClient({ initialIdeas }) {
  const router = useRouter();
  const [ideas, setIdeas] = useState(initialIdeas);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  
  // Modal state
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddIdea = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    setIsSaving(true);
    const result = await createIdea({ title: newTitle, description: '', status: 'idea' });
    if (result.success) {
      setIdeas([result.idea, ...ideas]);
      setNewTitle('');
      setIsAdding(false);
    }
    setIsSaving(false);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    // Optimistic update
    setIdeas(ideas.map(idea => idea.id === id ? { ...idea, status: newStatus } : idea));
    await updateIdea(id, { status: newStatus });
  };

  const handleSaveIdeaDetails = async () => {
    if (!selectedIdea) return;
    setIsSaving(true);
    const result = await updateIdea(selectedIdea.id, { 
      title: selectedIdea.title, 
      description: selectedIdea.description 
    });
    if (result.success) {
      setIdeas(ideas.map(idea => idea.id === selectedIdea.id ? result.idea : idea));
    }
    setIsSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer cette idée ?')) return;
    setIdeas(ideas.filter(idea => idea.id !== id));
    await deleteIdea(id);
    if (selectedIdea?.id === id) setSelectedIdea(null);
  };

  const handleCreateArticle = () => {
    // Redirige vers l'AI Generator avec l'ID de l'idée
    router.push(`/admin/ai-generator?idea_id=${selectedIdea.id}`);
  };

  const handleCreateInstagram = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', `Post Instagram: ${selectedIdea.title}`);
      formData.append('content', selectedIdea.description || 'Contenu à générer...');
      formData.append('category', 'Faits divers');
      formData.append('status', 'draft');
      formData.append('pub_date', new Date().toISOString());

      const res = await saveArticle(formData);
      if (res.success && res.id) {
        router.push(`/admin/articles/${res.id}/instagram`);
      } else {
        alert('Erreur lors de la création du brouillon.');
      }
    } catch (e) {
      console.error(e);
      alert('Erreur.');
    }
    setIsSaving(false);
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 120px)', overflowX: 'auto', paddingBottom: '20px' }}>
      {/* KANBAN COLUMNS */}
      {COLUMNS.map(col => (
        <div key={col.id} style={{ 
          minWidth: '300px', 
          width: '300px', 
          backgroundColor: col.color, 
          borderRadius: '8px', 
          border: `1px solid ${col.borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100%'
        }}>
          <div style={{ padding: '15px', borderBottom: `1px solid ${col.borderColor}`, fontWeight: 'bold', color: '#374151', display: 'flex', justifyContent: 'space-between' }}>
            <span>{col.title}</span>
            <span style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
              {ideas.filter(i => i.status === col.id).length}
            </span>
          </div>
          
          <div style={{ padding: '15px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {col.id === 'idea' && (
              isAdding ? (
                <form onSubmit={handleAddIdea} style={{ backgroundColor: 'white', padding: '10px', borderRadius: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <input 
                    autoFocus
                    type="text" 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Nouvelle idée..."
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '8px', fontSize: '14px' }}
                  />
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button type="submit" disabled={isSaving} className="admin-btn" style={{ padding: '4px 8px', fontSize: '12px', flex: 1, backgroundColor: '#3b82f6', color: 'white', border: 'none' }}>
                      Ajouter
                    </button>
                    <button type="button" onClick={() => setIsAdding(false)} className="admin-btn" style={{ padding: '4px 8px', fontSize: '12px', flex: 1 }}>
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <button 
                  onClick={() => setIsAdding(true)}
                  style={{ width: '100%', padding: '10px', border: '1px dashed #9ca3af', borderRadius: '6px', backgroundColor: 'transparent', cursor: 'pointer', color: '#4b5563', fontWeight: '500' }}
                >
                  + Ajouter une idée
                </button>
              )
            )}

            {ideas.filter(i => i.status === col.id).map(idea => (
              <div 
                key={idea.id} 
                onClick={() => setSelectedIdea(idea)}
                style={{ 
                  backgroundColor: 'white', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  border: '1px solid #e5e7eb',
                  transition: 'transform 0.1s, box-shadow 0.1s',
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; }}
              >
                <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '8px', fontSize: '14px' }}>{idea.title}</div>
                {idea.description && <div style={{ fontSize: '12px', color: '#6b7280', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{idea.description}</div>}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', gap: '5px' }}>
                  <select 
                    value={idea.status} 
                    onChange={(e) => { e.stopPropagation(); handleUpdateStatus(idea.id, e.target.value); }}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb' }}
                  >
                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* SLIDE-OVER PANEL / MODAL */}
      {selectedIdea && (
        <>
          <div 
            onClick={() => setSelectedIdea(null)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 40 }}
          />
          <div style={{ 
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '500px', backgroundColor: 'white', 
            boxShadow: '-4px 0 15px rgba(0,0,0,0.1)', zIndex: 50, display: 'flex', flexDirection: 'column',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>Détails de l'idée</h2>
              <button onClick={() => setSelectedIdea(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#6b7280' }}>&times;</button>
            </div>
            
            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>Titre</label>
              <input 
                type="text" 
                value={selectedIdea.title} 
                onChange={e => setSelectedIdea({...selectedIdea, title: e.target.value})}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '20px' }}
              />

              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>Notes & Structure</label>
              <textarea 
                value={selectedIdea.description || ''} 
                onChange={e => setSelectedIdea({...selectedIdea, description: e.target.value})}
                placeholder="Listez vos points clés ici..."
                rows={10}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '20px', resize: 'vertical' }}
              />

              <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                <button 
                  onClick={handleSaveIdeaDetails}
                  disabled={isSaving}
                  className="admin-btn"
                  style={{ flex: 1, backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px' }}
                >
                  {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>

              <hr style={{ borderTop: '1px solid #e5e7eb', margin: '0 0 20px 0' }} />

              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>⚡️ Actions Rapides</h3>
              
              <button 
                onClick={handleCreateArticle}
                className="admin-btn"
                style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <i className="fas fa-magic"></i> Rédiger un Article avec l'IA
              </button>
              
              <button 
                onClick={handleCreateInstagram}
                disabled={isSaving}
                className="admin-btn"
                style={{ width: '100%', padding: '12px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: 'white', border: 'none', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <i className="fab fa-instagram"></i> Créer un Post Instagram (IA)
              </button>

              <button 
                onClick={() => handleDelete(selectedIdea.id)}
                className="admin-btn"
                style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444' }}
              >
                <i className="fas fa-trash"></i> Supprimer cette idée
              </button>

            </div>
          </div>
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
