'use client';

import { useState, useEffect } from 'react';
import { getFlashInfos, addFlashInfo, toggleFlashInfoActive, deleteFlashInfo, updateFlashInfo, generateFlashInfo } from './actions';
import { useRouter } from 'next/navigation';
import SpeechButton from '@/components/SpeechButton';

export default function FlashInfosPage() {
  const router = useRouter();
  const [flashes, setFlashes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newFlash, setNewFlash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // AI states
  const [aiSubject, setAiSubject] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');

  // Pour l'édition en ligne
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    fetchFlashes();
  }, []);

  const fetchFlashes = async () => {
    setIsLoading(true);
    const res = await getFlashInfos();
    if (res.success) {
      setFlashes(res.data);
    } else {
      console.error(res.error);
    }
    setIsLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newFlash.trim()) return;
    
    setIsSubmitting(true);
    setErrorMsg('');
    
    const res = await addFlashInfo(newFlash);
    if (res.success) {
      setNewFlash('');
      fetchFlashes();
    } else {
      setErrorMsg(res.error);
    }
    setIsSubmitting(false);
  };

  const handleGenerateAI = async () => {
    if (!aiSubject.trim()) {
      setAiError("Décrivez le sujet du flash info.");
      return;
    }
    setIsGeneratingAI(true);
    setAiError('');

    const res = await generateFlashInfo(aiSubject);
    if (res.success) {
      setNewFlash(res.data);
      setAiSubject('');
    } else {
      setAiError(res.error);
    }
    setIsGeneratingAI(false);
  };

  const handleToggle = async (id, currentStatus) => {
    const res = await toggleFlashInfoActive(id, currentStatus);
    if (res.success) {
      fetchFlashes();
    } else {
      alert("Erreur: " + res.error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cette info ?")) return;
    const res = await deleteFlashInfo(id);
    if (res.success) {
      fetchFlashes();
    } else {
      alert("Erreur: " + res.error);
    }
  };

  const handleConvertToArticle = (content) => {
    const aiDraft = {
      title: '',
      description: '',
      aiContext: `Voici un flash info diffusé sur notre bandeau d'actualités. Rédige un article complet et détaillé à partir de ce flash :\n\n"${content}"`,
    };
    sessionStorage.setItem('ai_draft', JSON.stringify(aiDraft));
    router.push('/admin/articles/new');
  };

  const startEditing = (flash) => {
    setEditingId(flash.id);
    setEditContent(flash.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async (id) => {
    if (!editContent.trim()) {
      alert("Le contenu ne peut pas être vide.");
      return;
    }
    setIsSavingEdit(true);
    const res = await updateFlashInfo(id, editContent);
    if (res.success) {
      setEditingId(null);
      setEditContent('');
      fetchFlashes();
    } else {
      alert("Erreur lors de la modification : " + res.error);
    }
    setIsSavingEdit(false);
  };

  return (
    <div className="admin-content-card">
      <div className="admin-header-actions">
        <h1 className="admin-page-title">⚡ Gestion des Flash Infos</h1>
      </div>

      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        Les "Flash Infos" s'affichent dans le bandeau défilant au-dessus du menu principal du site.
        Ajoutez-en pour avertir d'une actualité chaude (Breaking News).
      </p>

      {errorMsg && (
        <div style={{ padding: '15px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '20px' }}>
          {errorMsg}
        </div>
      )}

      {/* Bloc IA */}
      <div style={{ backgroundColor: '#fdf4ff', border: '1px solid #f0abfc', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#a21caf', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-magic"></i> Générer un flash info avec l'IA
        </h3>
        {aiError && (
          <div style={{ padding: '8px 12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', marginBottom: '10px', fontSize: '13px' }}>
            {aiError}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              className="admin-form-control"
              style={{ margin: 0, borderColor: '#e879f9', paddingRight: '45px' }}
              placeholder="Décrivez le sujet (ex: Manifestation à Paris, Résultats élections municipales...)"
              value={aiSubject}
              onChange={e => setAiSubject(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleGenerateAI(); } }}
            />
            <div style={{ position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)' }}>
              <SpeechButton onTranscript={(text) => setAiSubject(prev => prev ? prev + ' ' + text : text)} />
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={isGeneratingAI}
            className="admin-btn"
            style={{ backgroundColor: '#a21caf', color: '#fff', whiteSpace: 'nowrap', opacity: isGeneratingAI ? 0.7 : 1 }}
          >
            {isGeneratingAI ? <><i className="fas fa-spinner fa-spin"></i> Génération...</> : <><i className="fas fa-magic"></i> Générer</>}
          </button>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      <form onSubmit={handleAdd} style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '30px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Diffuser une nouvelle Flash Info</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type="text" 
              className="admin-form-control" 
              style={{ margin: 0, paddingRight: '45px' }}
              placeholder="Ex: Alerte Météo : Vigilance rouge sur 5 départements du Sud-Est à partir de 18h..."
              value={newFlash}
              onChange={e => setNewFlash(e.target.value)}
              required
            />
            <div style={{ position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)' }}>
              <SpeechButton onTranscript={(text) => setNewFlash(prev => prev ? prev + ' ' + text : text)} />
            </div>
          </div>
          <button 
            type="submit" 
            className="admin-btn admin-btn-primary"
            disabled={isSubmitting}
            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
          >
            {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-bolt"></i> Diffuser</>}
          </button>
        </div>
      </form>

      {/* Liste des Flash Infos */}
      <div className="admin-table-container">
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
            <i className="fas fa-spinner fa-spin"></i> Chargement des flash infos...
          </div>
        ) : flashes.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
            Aucune flash info n'a été créée pour le moment.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '10%' }}>Statut</th>
                <th style={{ width: '45%' }}>Contenu du Flash Info</th>
                <th style={{ width: '15%' }}>Date</th>
                <th style={{ width: '30%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flashes.map((flash) => (
                <tr key={flash.id}>
                  <td>
                    {flash.is_active ? (
                      <span className="status-badge status-published">Actif</span>
                    ) : (
                      <span className="status-badge status-draft">Inactif</span>
                    )}
                  </td>
                  <td>
                    {editingId === flash.id ? (
                      <textarea
                        className="admin-form-control"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        style={{ width: '100%', minHeight: '60px', margin: 0, resize: 'vertical' }}
                      />
                    ) : (
                      <strong>{flash.content}</strong>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {new Date(flash.created_at).toLocaleString('fr-FR')}
                    </span>
                  </td>
                  <td>
                    {editingId === flash.id ? (
                      <div className="admin-table-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button 
                          className="admin-btn admin-btn-primary"
                          style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#10b981', borderColor: '#10b981' }}
                          onClick={() => saveEdit(flash.id)}
                          disabled={isSavingEdit}
                        >
                          {isSavingEdit ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>} Sauvegarder
                        </button>
                        <button 
                          className="admin-btn"
                          style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#f3f4f6' }}
                          onClick={cancelEditing}
                        >
                          <i className="fas fa-times"></i> Annuler
                        </button>
                      </div>
                    ) : (
                      <div className="admin-table-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button 
                          className={`admin-btn ${flash.is_active ? '' : 'admin-btn-primary'}`}
                          style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: flash.is_active ? '#f3f4f6' : '#10b981', color: flash.is_active ? '#374151' : 'white' }}
                          onClick={() => handleToggle(flash.id, flash.is_active)}
                          title={flash.is_active ? "Désactiver (Retirer du bandeau)" : "Activer (Afficher dans le bandeau)"}
                        >
                          {flash.is_active ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
                        </button>
                        <button 
                          className="admin-btn"
                          style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}
                          onClick={() => startEditing(flash)}
                          title="Modifier le texte"
                        >
                          <i className="fas fa-edit"></i> Modifier
                        </button>
                        <button 
                          className="admin-btn"
                          style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#fdf4ff', color: '#a21caf', border: '1px solid #f0abfc' }}
                          onClick={() => handleConvertToArticle(flash.content)}
                          title="Convertir en article complet"
                        >
                          <i className="fas fa-newspaper"></i> → Article
                        </button>
                        <button 
                          className="admin-btn-icon" 
                          style={{ color: '#ef4444' }}
                          onClick={() => handleDelete(flash.id)}
                          title="Supprimer"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
